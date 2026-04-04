import { prisma } from "@/lib/prisma";

export async function upsertContentMemory(input: {
  articleId: string;
  title: string;
  slug: string;
  categoryPath: string;
  keywords: string[];
  summary: string;
}) {
  return prisma.contentMemory.upsert({
    where: { articleId: input.articleId },
    create: {
      articleId: input.articleId,
      title: input.title,
      slug: input.slug,
      categoryPath: input.categoryPath,
      keywords: input.keywords,
      summary: input.summary,
    },
    update: {
      title: input.title,
      slug: input.slug,
      categoryPath: input.categoryPath,
      keywords: input.keywords,
      summary: input.summary,
    },
  });
}
