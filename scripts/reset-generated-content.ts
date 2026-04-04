import { prisma } from "@/lib/prisma";

async function main() {
  const generatedTopics = await prisma.topicQueue.findMany({
    select: { id: true, article: { select: { id: true } } },
  });
  const generatedArticleIds = generatedTopics.map((item) => item.article?.id).filter((id): id is string => Boolean(id));

  if (generatedArticleIds.length === 0) {
    console.log("No generated articles found to reset.");
  } else {
    await prisma.$transaction([
      prisma.articleRelated.deleteMany({
        where: {
          OR: [
            { articleId: { in: generatedArticleIds } },
            { relatedArticleId: { in: generatedArticleIds } },
          ],
        },
      }),
      prisma.articleSection.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.articleFaq.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.articleSource.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.generatedImagePrompt.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.seoMeta.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.contentMemory.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.popularArticle.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.trendingSlot.deleteMany({ where: { articleId: { in: generatedArticleIds } } }),
      prisma.article.deleteMany({ where: { id: { in: generatedArticleIds } } }),
      prisma.topicQueue.deleteMany({ where: { id: { in: generatedTopics.map((item) => item.id) } } }),
      prisma.publishingJob.deleteMany({}),
    ]);
  }

  const orphanMedia = await prisma.media.findMany({
    where: {
      heroForArticles: { none: {} },
      AND: [{ authorAvatars: { none: {} } }, { reviewerAvatars: { none: {} } }],
    },
    select: { id: true },
  });
  if (orphanMedia.length > 0) {
    await prisma.media.deleteMany({ where: { id: { in: orphanMedia.map((m) => m.id) } } });
  }

  await prisma.author.deleteMany({ where: { userId: null, articles: { none: {} } } });
  await prisma.reviewer.deleteMany({ where: { userId: null, reviewedArticles: { none: {} } } });
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: { startsWith: "auto-author-" } }, { email: { startsWith: "auto-reviewer-" } }],
    },
  });

  console.log("Generated content reset complete.");
}

main()
  .catch((error) => {
    console.error("Reset failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
