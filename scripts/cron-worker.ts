import { processPendingImages, publishDueArticles, runContentPipeline } from "@/lib/pipeline/engine";

async function main() {
  console.log("[cron] run pipeline");
  await runContentPipeline({ intake: false, dailyLimit: 5, scheduleBatch: 5 });

  console.log("[cron] publish due");
  await publishDueArticles(5);

  console.log("[cron] process images");
  await processPendingImages(5);
}

main().catch((error) => {
  console.error("cron worker failed", error);
  process.exit(1);
});
