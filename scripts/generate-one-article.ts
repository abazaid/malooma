import { prisma } from "@/lib/prisma";
import { processTopicsToDrafts } from "@/lib/pipeline/engine";

async function main() {
  const title = process.argv.slice(2).join(" ").trim() || "فوائد تنظيم الوقت في العمل الحر";

  const normalized = title.toLowerCase().trim();
  const topic = await prisma.topicQueue.create({
    data: {
      rawTitle: title,
      normalizedTitle: normalized,
      titleHash: `manual-${Date.now()}`,
      status: "CLEANED",
      keywords: normalized.split(/\s+/).slice(0, 10),
    },
  });

  const report = await processTopicsToDrafts(1);
  let article = await prisma.article.findFirst({ where: { topicId: topic.id } });

  if (!article && report.results.length > 0) {
    const fallbackId = report.results[0].articleId;
    article = await prisma.article.findUnique({ where: { id: fallbackId } });
  }

  if (!article) {
    console.log("No article generated from topic", report);
    return;
  }

  console.log(`Generated article slug: ${article.slug}`);
  console.log(`URL: ${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://malooma.org")}/articles/${article.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
