import { processPendingImages, publishDueArticles, runContentPipeline } from "@/lib/pipeline/engine";

async function main() {
  console.log("[cron] run pipeline");
  await runContentPipeline({ intake: false, dailyLimit: 10, scheduleBatch: 10 });

  console.log("[cron] publish due");
  await publishDueArticles(10);

  console.log("[cron] process images");
  await processPendingImages(10);
}

main().catch((error) => {
  console.error("cron worker failed", error);
  process.exit(1);
});
