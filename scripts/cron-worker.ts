import { runContentPipeline, publishDueArticles } from "@/lib/pipeline/engine";

async function main() {
  console.log("[cron] run pipeline");
  await runContentPipeline({ intake: true, dailyLimit: 10, scheduleBatch: 10 });

  console.log("[cron] publish due");
  await publishDueArticles(20);
}

main().catch((error) => {
  console.error("cron worker failed", error);
  process.exit(1);
});
