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

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://malooma.org";

async function ensureAuthorAndReviewer() {
  let author = await prisma.author.findFirst();
  if (!author) {
    const user = await prisma.user.create({
      data: {
        email: `auto-author-${Date.now()}@malooma.org`,
        passwordHash: "generated",
        fullName: "محرك المحتوى",
        role: "AUTHOR",
      },
    });
    author = await prisma.author.create({
      data: {
        userId: user.id,
        slug: `المحرك-${Date.now()}`,
        displayName: "محرك المحتوى",
        bio: "توليد مقالات آلي مع مراجعة تحريرية.",
      },
    });
  }

  let reviewer = await prisma.reviewer.findFirst();
  if (!reviewer) {
    const user = await prisma.user.create({
      data: {
        email: `auto-reviewer-${Date.now()}@malooma.org`,
        passwordHash: "generated",
        fullName: "مراجعة آلية",
        role: "REVIEWER",
      },
    });
    reviewer = await prisma.reviewer.create({
      data: {
        userId: user.id,
        slug: `مراجعة-${Date.now()}`,
        displayName: "المراجعة التحريرية",
        bio: "فحص جودة آلي للمحتوى قبل الجدولة.",
      },
    });
  }

  return { author, reviewer };
}

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

async function processSingleTopic(topicId: string) {
  const topic = await prisma.topicQueue.findUnique({ where: { id: topicId } });
  if (!topic) return null;
  if (!["CLEANED", "OUTLINED", "WRITTEN"].includes(topic.status)) return null;

  const { mainCategory, subCategory } = await classifyTopic(topic.rawTitle);
  const relatedMemory = await prisma.contentMemory.findMany({
    where: { categoryPath: { contains: mainCategory.name, mode: "insensitive" } },
    orderBy: { updatedAt: "desc" },
    take: 12,
  });

  let outline = generateOutline(topic.rawTitle);
  let draft = writeArticleDraft(topic.rawTitle, outline);
  let aiMetaTitle = "";
  let aiMetaDescription = "";

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
    return null;
  }

  const { author, reviewer } = await ensureAuthorAndReviewer();

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

  const relatedCount = await attachInternalLinks({
    articleId: article.id,
    articleTitle: article.title,
    categoryId: article.categoryId,
  });

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

  await upsertContentMemory({
    articleId: article.id,
    title: article.title,
    slug: article.slug,
    categoryPath: `${mainCategory.name} / ${subCategory.name}`,
    keywords: article.keywords,
    summary: article.excerpt,
  });

  return { articleId: article.id, relatedCount };
}

export async function processTopicsToDrafts(limit = 10) {
  const topics = await prisma.topicQueue.findMany({
    where: { status: "CLEANED" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const results = [] as Array<{ articleId: string; relatedCount: number }>;
  for (const topic of topics) {
    const result = await processSingleTopic(topic.id);
    if (result) results.push(result);
  }

  return { drafted: results.length, results };
}

export async function scheduleDailyPublishing(batchSize = 10) {
  const nextDay = getNextPublishingDay();
  const slots = buildDailyPublishingSlots(nextDay, batchSize);

  const articles = await prisma.article.findMany({
    where: { status: "DRAFT" },
    orderBy: { createdAt: "asc" },
    take: batchSize,
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
      batchSize,
      completedCount: 0,
    },
  });

  return { scheduled: articles.length, day: nextDay.toISOString() };
}

export async function publishDueArticles(limit = 10) {
  const due = await prisma.article.findMany({
    where: {
      status: "SCHEDULED",
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: "asc" },
    take: limit,
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

export async function runContentPipeline(input?: {
  intake?: boolean;
  dailyLimit?: number;
  scheduleBatch?: number;
}) {
  const intake = input?.intake ?? true;
  const dailyLimit = input?.dailyLimit ?? 10;
  const scheduleBatch = input?.scheduleBatch ?? 10;

  const report: Record<string, unknown> = {};

  if (intake) {
    report.intake = await intakeTopicsFromReference();
  }

  report.cleaning = await cleanAndDedupeTopics(1500);
  report.drafting = await processTopicsToDrafts(dailyLimit);
  report.scheduling = await scheduleDailyPublishing(scheduleBatch);

  return report;
}

