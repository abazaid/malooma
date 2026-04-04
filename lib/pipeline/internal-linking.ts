import { prisma } from "@/lib/prisma";
import { jaccardSimilarity } from "@/lib/pipeline/text-utils";

function toAnchorText(title: string) {
  return title.replace(/^ما\s+هو\s+/g, "").replace(/^كيفية\s+/g, "").trim();
}

export async function selectRelatedArticles(params: {
  categoryId: string;
  title: string;
  max: number;
}) {
  const pool = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: params.categoryId,
    },
    orderBy: { publishedAt: "desc" },
    take: 80,
  });

  const scored = pool
    .map((article) => ({
      article,
      score: jaccardSimilarity(params.title, article.title),
    }))
    .filter((item) => item.score > 0.08)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(3, Math.min(params.max, 8)));

  return scored;
}

export async function attachInternalLinks(input: {
  articleId: string;
  articleTitle: string;
  categoryId: string;
}) {
  const related = await selectRelatedArticles({
    categoryId: input.categoryId,
    title: input.articleTitle,
    max: 8,
  });

  let orderNo = 900;
  const linkLines: string[] = [];

  for (const item of related) {
    await prisma.articleRelated.upsert({
      where: {
        articleId_relatedArticleId: {
          articleId: input.articleId,
          relatedArticleId: item.article.id,
        },
      },
      create: {
        articleId: input.articleId,
        relatedArticleId: item.article.id,
        relevanceScore: item.score,
      },
      update: {
        relevanceScore: item.score,
      },
    });

    linkLines.push(`- [${toAnchorText(item.article.title)}](/articles/${item.article.slug})`);
  }

  if (linkLines.length > 0) {
    const existing = await prisma.articleSection.findFirst({
      where: {
        articleId: input.articleId,
        blockType: "related_articles",
      },
    });

    if (existing) {
      await prisma.articleSection.update({
        where: { id: existing.id },
        data: { content: linkLines.join("\n") },
      });
    } else {
      await prisma.articleSection.create({
        data: {
          articleId: input.articleId,
          orderNo: orderNo++,
          blockType: "related_articles",
          heading: "مقالات مرتبطة",
          content: linkLines.join("\n"),
        },
      });
    }
  }

  return related.length;
}

export async function backfillInternalLinksToNewArticle(newArticleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: newArticleId },
    select: { id: true, title: true, categoryId: true, slug: true },
  });

  if (!article) return 0;

  const oldArticles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      categoryId: article.categoryId,
      id: { not: article.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 120,
  });

  let updated = 0;

  for (const old of oldArticles) {
    const score = jaccardSimilarity(old.title, article.title);
    if (score < 0.1) continue;

    await prisma.articleRelated.upsert({
      where: {
        articleId_relatedArticleId: {
          articleId: old.id,
          relatedArticleId: article.id,
        },
      },
      create: {
        articleId: old.id,
        relatedArticleId: article.id,
        relevanceScore: score,
      },
      update: {
        relevanceScore: score,
      },
    });

    updated += 1;
  }

  return updated;
}
