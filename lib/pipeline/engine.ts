import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { classifyTopic } from "@/lib/pipeline/classifier";
import { generateImagePrompt } from "@/lib/pipeline/image-prompt";
import { attachInternalLinks, backfillInternalLinksToNewArticle } from "@/lib/pipeline/internal-linking";
import { upsertContentMemory } from "@/lib/pipeline/memory";
import { generateOutline } from "@/lib/pipeline/outline-generator";
import { optimizeSeo } from "@/lib/pipeline/seo-engine";
import { buildDailyPublishingSlots, getNextPublishingDay } from "@/lib/pipeline/scheduler";
import { cleanAndDedupeTopics, intakeTopicsFromReference } from "@/lib/pipeline/topic-intake";
import { writeArticleDraft } from "@/lib/pipeline/article-writer";
import { generateArticlePackageWithAI } from "@/lib/pipeline/ai-generator";
import { slugifyArabic } from "@/lib/slug";
import { ensureContributorPools, pickRandomItem } from "@/lib/pipeline/author-pool";
import { generateCoverImage } from "@/lib/pipeline/cover-image";
import { jaccardSimilarity } from "@/lib/pipeline/text-utils";
import { logPipelineEvent } from "@/lib/pipeline/events";

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://malooma.org";
const CLUSTER_SIZE = 5;
const SUPPORTING_SIZE = 4;

function buildExcerpt(topic: string, intent: string) {
  return `دليل شامل حول ${topic}. ${intent}`.slice(0, 280);
}

function buildArticleSchema(article: { title: string; slug: string; excerpt: string; keywords: string[]; publishedAt?: Date | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    mainEntityOfPage: `${SITE_ORIGIN}/articles/${article.slug}`,
    datePublished: article.publishedAt?.toISOString() ?? new Date().toISOString(),
    keywords: article.keywords,
    author: {
      "@type": "Organization",
      name: "معلومة",
    },
  };
}

function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

async function processSingleTopic(topicId: string, runKey?: string) {
  const topic = await prisma.topicQueue.findUnique({ where: { id: topicId } });
  if (!topic) return null;
  if (!["CLEANED", "OUTLINED", "WRITTEN"].includes(topic.status)) return null;

  await logPipelineEvent({
    stage: "TOPIC_PROCESSING_STARTED",
    status: "INFO",
    runKey,
    topicId: topic.id,
    message: topic.rawTitle,
  });

  const { mainCategory, subCategory } = await classifyTopic(topic.rawTitle);
  await logPipelineEvent({
    stage: "TOPIC_CLASSIFIED",
    status: "SUCCESS",
    runKey,
    topicId: topic.id,
    message: `${mainCategory.name} -> ${subCategory.name}`,
  });
  const relatedMemory = await prisma.contentMemory.findMany({
    where: { categoryPath: { contains: mainCategory.name, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  let outline = generateOutline(topic.rawTitle);
  let draft = writeArticleDraft(topic.rawTitle, outline);
  let aiMetaTitle = "";
  let aiMetaDescription = "";
  let aiInternalLinkSuggestions: { anchor: string; targetTopic: string }[] = [];

  if (process.env.OPENAI_API_KEY) {
    const aiPackage = await generateArticlePackageWithAI({
      topic: topic.rawTitle,
      mainCategory: mainCategory.name,
      subCategory: subCategory.name,
      relatedTitles: relatedMemory.map((item) => item.title),
    });

    outline = {
      searchIntent: aiPackage.searchIntent,
      h1: aiPackage.title,
      h2: aiPackage.h2,
      h3: aiPackage.h3,
      faq: aiPackage.faq.map((item) => ({ q: item.q, aHint: item.a })),
      keyPoints: aiPackage.keyPoints,
      conclusion: aiPackage.conclusion,
      lsiKeywords: aiPackage.lsiKeywords,
    };

    draft = {
      intro: aiPackage.excerpt,
      sections: aiPackage.sections.map((section) => ({ heading: section.heading, text: section.body })),
      bulletBlock: aiPackage.keyPoints.map((point) => `- ${point}`).join("\n"),
      conclusion: aiPackage.conclusion,
      wordCount: aiPackage.sections.map((section) => section.body).join(" ").split(/\s+/).filter(Boolean).length,
    };

    aiMetaTitle = aiPackage.metaTitle;
    aiMetaDescription = aiPackage.metaDescription;
    aiInternalLinkSuggestions = aiPackage.internalLinkSuggestions;

    await logPipelineEvent({
      stage: "AI_GENERATION_DONE",
      status: "SUCCESS",
      runKey,
      topicId: topic.id,
      message: `AI article generated (${draft.wordCount} words)`,
    });
  }

  const seo = optimizeSeo({
    title: outline.h1,
    excerpt: buildExcerpt(topic.rawTitle, outline.searchIntent),
    categoryName: mainCategory.name,
    lsiKeywords: outline.lsiKeywords,
  });

  const duplicateBySlug = await prisma.article.findUnique({ where: { slug: seo.slug } });
  if (duplicateBySlug) {
    await prisma.topicQueue.update({
      where: { id: topic.id },
      data: {
        status: "SKIPPED",
        errorMessage: "Slug already exists; recommend updating existing article instead of creating duplicate.",
      },
    });
    await logPipelineEvent({
      stage: "TOPIC_SKIPPED_DUPLICATE",
      status: "WARNING",
      runKey,
      topicId: topic.id,
      message: `Duplicate slug: ${seo.slug}`,
    });
    return null;
  }

  const contributorPools = await ensureContributorPools(20, 5);
  const author = pickRandomItem(contributorPools.authors);
  const reviewer = pickRandomItem(contributorPools.reviewers);

  const article = await prisma.article.create({
    data: {
      title: outline.h1,
      slug: seo.slug,
      excerpt: buildExcerpt(topic.rawTitle, outline.searchIntent),
      status: "DRAFT",
      readingMinutes: Math.max(8, Math.ceil(draft.wordCount / 180)),
      authorId: author.id,
      reviewerId: reviewer.id,
      categoryId: subCategory.id,
      keywords: seo.lsiKeywords.slice(0, 12),
      searchIntent: outline.searchIntent,
      canonicalUrl: seo.canonical,
      topicId: topic.id,
    },
  });
  await logPipelineEvent({
    stage: "ARTICLE_DRAFT_CREATED",
    status: "SUCCESS",
    runKey,
    topicId: topic.id,
    articleId: article.id,
    message: article.slug,
  });

  let orderNo = 1;
  await prisma.articleSection.create({
    data: {
      articleId: article.id,
      orderNo: orderNo++,
      blockType: "paragraph",
      heading: "مقدمة",
      content: draft.intro,
    },
  });

  for (const section of draft.sections) {
    await prisma.articleSection.create({
      data: {
        articleId: article.id,
        orderNo: orderNo++,
        blockType: "paragraph",
        heading: section.heading,
        content: section.text,
      },
    });
  }

  await prisma.articleSection.create({
    data: {
      articleId: article.id,
      orderNo: orderNo++,
      blockType: "list",
      heading: "نقاط مهمة",
      content: draft.bulletBlock,
    },
  });

  await prisma.articleSection.create({
    data: {
      articleId: article.id,
      orderNo: orderNo++,
      blockType: "paragraph",
      heading: "الخلاصة",
      content: draft.conclusion,
    },
  });

  let faqOrder = 1;
  for (const faq of outline.faq) {
    await prisma.articleFaq.create({
      data: {
        articleId: article.id,
        orderNo: faqOrder++,
        question: faq.q,
        answer: `${faq.aHint} ويُنصح بالبدء بخطة واضحة ثم القياس والتحسين المستمر.`,
      },
    });
  }

  await prisma.articleSource.createMany({
    data: [
      {
        articleId: article.id,
        orderNo: 1,
        title: "مذكرة تحريرية داخلية",
        url: `${SITE_ORIGIN}/editorial-standards`,
        publisher: "معلومة",
      },
      {
        articleId: article.id,
        orderNo: 2,
        title: "مرجع تصنيفي داخلي",
        url: `${SITE_ORIGIN}/categories/${slugifyArabic(mainCategory.name)}/${subCategory.slug}`,
        publisher: "معلومة",
      },
    ],
  });

  const faqRows = await prisma.articleFaq.findMany({ where: { articleId: article.id }, orderBy: { orderNo: "asc" } });

  await prisma.seoMeta.create({
    data: {
      articleId: article.id,
      metaTitle: aiMetaTitle || seo.metaTitle,
      metaDescription: aiMetaDescription || seo.metaDescription,
      canonicalUrl: seo.canonical,
      schemaJson: {
        article: buildArticleSchema({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          keywords: article.keywords,
          publishedAt: article.publishedAt,
        }),
        faq: buildFaqSchema(faqRows.map((f) => ({ question: f.question, answer: f.answer }))),
      } satisfies Prisma.JsonObject,
    },
  });

  const imagePrompt = generateImagePrompt(article.title, mainCategory.name);

  await prisma.generatedImagePrompt.create({
    data: {
      articleId: article.id,
      prompt: imagePrompt.prompt,
      negativePrompt: imagePrompt.negativePrompt,
    },
  });

  await prisma.article.update({
    where: { id: article.id },
    data: {
      imagePrompt: imagePrompt.prompt,
    },
  });
  await logPipelineEvent({
    stage: "IMAGE_PROMPT_READY",
    status: "SUCCESS",
    runKey,
    topicId: topic.id,
    articleId: article.id,
    message: "Image prompt queued for async generation",
  });

  const relatedCount = await attachInternalLinks({
    articleId: article.id,
    articleTitle: article.title,
    categoryId: article.categoryId,
  });
  await logPipelineEvent({
    stage: "INTERNAL_LINKS_ATTACHED",
    status: "SUCCESS",
    runKey,
    topicId: topic.id,
    articleId: article.id,
    message: `Related count: ${relatedCount}`,
  });

  if (relatedCount === 0 && aiInternalLinkSuggestions.length > 0) {
      await prisma.articleSection.create({
        data: {
          articleId: article.id,
          orderNo: orderNo++,
          blockType: "callout",
          heading: "روابط داخلية مقترحة لإضافتها لاحقًا",
          content: aiInternalLinkSuggestions.map((item) => `- ${item.anchor} → ${item.targetTopic}`).join("\n"),
        },
      });
  }

  await prisma.topicQueue.update({
    where: { id: topic.id },
    data: {
      status: "WRITTEN",
      processedAt: new Date(),
      searchIntent: outline.searchIntent,
      outlineJson: outline as unknown as Prisma.JsonObject,
      keywords: seo.lsiKeywords.slice(0, 12),
      mainCategoryId: mainCategory.id,
      subCategoryId: subCategory.id,
    },
  });
  await logPipelineEvent({
    stage: "TOPIC_WRITTEN",
    status: "SUCCESS",
    runKey,
    topicId: topic.id,
    articleId: article.id,
    message: "Draft is ready",
  });

  await upsertContentMemory({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    categoryPath: `${mainCategory.name} / ${subCategory.name}`,
    keywords: article.keywords,
    summary: article.excerpt,
  });

  return { articleId: article.id, relatedCount, topicId: topic.id };
}

export async function processTopicsToDrafts(limit = 10, runKey?: string) {
  const topics = await prisma.topicQueue.findMany({
    where: { status: "CLEANED" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const results = [] as Array<{ articleId: string; relatedCount: number; topicId: string }>;
  for (const topic of topics) {
    const result = await processSingleTopic(topic.id, runKey);
    if (result) results.push(result);
  }

  return { drafted: results.length, results };
}

async function selectDailyTopicCluster() {
  const topics = await prisma.topicQueue.findMany({
    where: { status: "CLEANED" },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  if (topics.length < CLUSTER_SIZE) return null;

  for (const core of topics) {
    const scored = topics
      .filter((item) => item.id !== core.id)
      .map((item) => ({
        topic: item,
        score: jaccardSimilarity(core.normalizedTitle, item.normalizedTitle),
      }))
      .filter((item) => item.score >= 0.2)
      .sort((a, b) => (b.score === a.score ? +new Date(a.topic.createdAt) - +new Date(b.topic.createdAt) : b.score - a.score));

    const supporting = scored.slice(0, SUPPORTING_SIZE).map((item) => item.topic);
    if (supporting.length === SUPPORTING_SIZE) {
      return { coreTopic: core, supportingTopics: supporting };
    }
  }

  return null;
}

async function attachClusterLinks(input: {
  articleIds: string[];
}) {
  const articles = await prisma.article.findMany({
    where: { id: { in: input.articleIds } },
    select: { id: true, slug: true, title: true },
  });

  const toAnchor = (title: string) => title.replace(/^ما\s+هو\s+/g, "").replace(/^كيفية\s+/g, "").trim();
  for (const article of articles) {
    const peers = articles.filter((item) => item.id !== article.id);
    for (const peer of peers) {
      const score = Math.max(0.7, jaccardSimilarity(article.title, peer.title));
      await prisma.articleRelated.upsert({
        where: {
          articleId_relatedArticleId: {
            articleId: article.id,
            relatedArticleId: peer.id,
          },
        },
        create: {
          articleId: article.id,
          relatedArticleId: peer.id,
          relevanceScore: score,
        },
        update: {
          relevanceScore: score,
        },
      });
    }

    const lines = peers.map((peer) => `- [${toAnchor(peer.title)}](/articles/${peer.slug})`);
    const existing = await prisma.articleSection.findFirst({
      where: { articleId: article.id, blockType: "related_articles" },
      select: { id: true },
    });

    if (existing) {
      await prisma.articleSection.update({
        where: { id: existing.id },
        data: {
          heading: "مقالات مرتبطة ضمن نفس المحور",
          content: lines.join("\n"),
        },
      });
    } else {
      await prisma.articleSection.create({
        data: {
          articleId: article.id,
          orderNo: 999,
          blockType: "related_articles",
          heading: "مقالات مرتبطة ضمن نفس المحور",
          content: lines.join("\n"),
        },
      });
    }
  }
}

async function processDailyClusterToDrafts(runKey?: string) {
  const cluster = await selectDailyTopicCluster();
  if (!cluster) {
    await logPipelineEvent({
      stage: "CLUSTER_SELECTION",
      status: "WARNING",
      runKey,
      message: "No coherent 5-topic cluster found.",
    });
    return {
      drafted: 0,
      clusterMode: true,
      reason: "No coherent 5-topic cluster found. Pipeline aborted by policy.",
      results: [],
    };
  }

  await logPipelineEvent({
    stage: "CLUSTER_SELECTION",
    status: "SUCCESS",
    runKey,
    topicId: cluster.coreTopic.id,
    message: `Core: ${cluster.coreTopic.rawTitle}`,
    metaJson: {
      supporting: cluster.supportingTopics.map((item) => item.rawTitle),
    },
  });

  const orderedTopics = [cluster.coreTopic, ...cluster.supportingTopics];
  const results: Array<{ articleId: string; relatedCount: number; topicId: string }> = [];

  for (const topic of orderedTopics) {
    const result = await processSingleTopic(topic.id, runKey);
    if (result) results.push(result);
  }

  if (results.length !== CLUSTER_SIZE) {
    const generatedArticleIds = results.map((item) => item.articleId);
    if (generatedArticleIds.length > 0) {
      await prisma.article.deleteMany({ where: { id: { in: generatedArticleIds } } });
    }

    await prisma.topicQueue.updateMany({
      where: { id: { in: orderedTopics.map((item) => item.id) } },
      data: {
        status: "CLEANED",
        errorMessage: "Cluster not completed (must be exactly 5 linked articles).",
      },
    });
    await logPipelineEvent({
      stage: "CLUSTER_ROLLBACK",
      status: "ERROR",
      runKey,
      message: "Cluster generation incomplete. Drafts rolled back.",
    });

    return {
      drafted: 0,
      clusterMode: true,
      reason: "Cluster generation incomplete. All generated drafts rolled back.",
      results: [],
    };
  }

  await attachClusterLinks({ articleIds: results.map((item) => item.articleId) });
  for (const item of results) {
    await logPipelineEvent({
      stage: "CLUSTER_LINKS_DONE",
      status: "SUCCESS",
      runKey,
      topicId: item.topicId,
      articleId: item.articleId,
      message: "Linked to cluster peers",
    });
  }

  return {
    drafted: results.length,
    clusterMode: true,
    coreTopic: cluster.coreTopic.rawTitle,
    supportingTopics: cluster.supportingTopics.map((item) => item.rawTitle),
    results,
  };
}

export async function scheduleDailyPublishing(batchSize = 5, articleIds?: string[], runKey?: string) {
  const cappedBatchSize = Math.min(5, Math.max(1, batchSize));
  const nextDay = getNextPublishingDay();
  const slots = buildDailyPublishingSlots(nextDay, cappedBatchSize);

  const articles = await prisma.article.findMany({
    where: {
      status: "DRAFT",
      ...(articleIds && articleIds.length > 0 ? { id: { in: articleIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: cappedBatchSize,
  });

  for (const [index, article] of articles.entries()) {
    await prisma.article.update({
      where: { id: article.id },
      data: {
        status: "SCHEDULED",
        publishedAt: slots[index],
      },
    });

    if (article.topicId) {
      await prisma.topicQueue.update({
        where: { id: article.topicId },
        data: {
          status: "SCHEDULED",
        },
      });
    }
  }

  await prisma.publishingJob.create({
    data: {
      runAt: nextDay,
      status: "PENDING",
      batchSize: cappedBatchSize,
      completedCount: 0,
    },
  });
  await logPipelineEvent({
    stage: "SCHEDULING_DONE",
    status: "SUCCESS",
    runKey,
    message: `Scheduled ${articles.length} articles for ${nextDay.toISOString()}`,
  });

  for (const article of articles) {
    await logPipelineEvent({
      stage: "ARTICLE_SCHEDULED",
      status: "SUCCESS",
      runKey,
      articleId: article.id,
      message: "Article moved to SCHEDULED",
    });
  }

  return { scheduled: articles.length, day: nextDay.toISOString() };
}

export async function publishDueArticles(limit = 5, runKey?: string) {
  const cappedLimit = Math.min(5, Math.max(1, limit));
  const due = await prisma.article.findMany({
    where: {
      status: "SCHEDULED",
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: "asc" },
    take: cappedLimit,
  });

  let published = 0;
  for (const article of due) {
    await prisma.article.update({
      where: { id: article.id },
      data: { status: "PUBLISHED" },
    });

    if (article.topicId) {
      await prisma.topicQueue.update({
        where: { id: article.topicId },
        data: { status: "PUBLISHED", processedAt: new Date() },
      });
    }

    await backfillInternalLinksToNewArticle(article.id);

    await upsertContentMemory({
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      categoryPath: article.categoryId,
      keywords: article.keywords,
      summary: article.excerpt,
    });

    await logPipelineEvent({
      stage: "ARTICLE_PUBLISHED",
      status: "SUCCESS",
      runKey,
      topicId: article.topicId ?? undefined,
      articleId: article.id,
      message: article.slug,
    });

    published += 1;
  }

  await prisma.publishingJob.updateMany({
    where: { status: { in: ["PENDING", "RUNNING"] } },
    data: {
      status: "DONE",
      completedCount: { increment: published },
    },
  });

  return { published };
}

export async function publishScheduledNow(limit = 5, runKey?: string) {
  const cappedLimit = Math.min(5, Math.max(1, limit));
  const scheduled = await prisma.article.findMany({
    where: { status: "SCHEDULED" },
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
    take: cappedLimit,
  });

  let published = 0;
  for (const article of scheduled) {
    await prisma.article.update({
      where: { id: article.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    if (article.topicId) {
      await prisma.topicQueue.update({
        where: { id: article.topicId },
        data: { status: "PUBLISHED", processedAt: new Date() },
      });
    }

    await backfillInternalLinksToNewArticle(article.id);
    await upsertContentMemory({
      articleId: article.id,
      title: article.title,
      slug: article.slug,
      categoryPath: article.categoryId,
      keywords: article.keywords,
      summary: article.excerpt,
    });

    await logPipelineEvent({
      stage: "ARTICLE_FORCE_PUBLISHED",
      status: "SUCCESS",
      runKey,
      topicId: article.topicId ?? undefined,
      articleId: article.id,
      message: article.slug,
    });

    published += 1;
  }

  return { published };
}

export async function processPendingImages(limit = 5, runKey?: string) {
  const queue = await prisma.generatedImagePrompt.findMany({
    where: {
      article: {
        heroMediaId: null,
      },
    },
    orderBy: { createdAt: "asc" },
    take: Math.min(10, Math.max(1, limit)),
    include: {
      article: {
        select: {
          id: true,
          slug: true,
          title: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  let generated = 0;
  for (const item of queue) {
    const cover = await generateCoverImage({
      slug: item.article.slug,
      prompt: item.prompt,
      fallbackSeed: slugifyArabic(`${item.article.category.name}-${item.article.slug}`),
    });

    const media = await prisma.media.create({
      data: {
        fileName: cover.fileName,
        mimeType: cover.mimeType,
        storageKey: cover.storageKey,
        url: cover.url,
        altText: item.article.title,
      },
    });

    await prisma.article.update({
      where: { id: item.article.id },
      data: { heroMediaId: media.id },
    });

    await logPipelineEvent({
      stage: "ARTICLE_COVER_ATTACHED",
      status: "SUCCESS",
      runKey,
      articleId: item.article.id,
      message: cover.url,
    });

    generated += 1;
  }

  return { generated };
}

export async function runContentPipeline(input?: {
  intake?: boolean;
  dailyLimit?: number;
  scheduleBatch?: number;
}) {
  const runKey = `run-${new Date().toISOString()}`;
  const intake = input?.intake ?? true;
  const enforcedClusterSize = CLUSTER_SIZE;
  const scheduleBatch = Math.min(enforcedClusterSize, Math.max(enforcedClusterSize, input?.scheduleBatch ?? enforcedClusterSize));

  const report: Record<string, unknown> = {};

  if (intake) {
    report.intake = await intakeTopicsFromReference();
  }

  report.policy = {
    mode: "cluster",
    dailyArticles: enforcedClusterSize,
  };

  report.cleaning = await cleanAndDedupeTopics(1500);
  const clusterDrafting = await processDailyClusterToDrafts(runKey);
  report.drafting = clusterDrafting;

  if (clusterDrafting.drafted === CLUSTER_SIZE) {
    report.scheduling = await scheduleDailyPublishing(
      scheduleBatch,
      clusterDrafting.results.map((item) => item.articleId),
      runKey,
    );
  } else {
    report.scheduling = {
      scheduled: 0,
      skipped: true,
      reason: "Cluster policy: scheduling skipped because complete 5-article cluster was not generated.",
    };
  }

  await logPipelineEvent({
    stage: "PIPELINE_RUN_COMPLETED",
    status: "SUCCESS",
    runKey,
    message: "Pipeline run finished",
    metaJson: report as Prisma.JsonObject,
  });

  return report;
}

