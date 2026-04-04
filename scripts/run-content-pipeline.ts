import { runContentPipeline } from "@/lib/pipeline/engine";

async function main() {
  const report = await runContentPipeline({ intake: false, dailyLimit: 10, scheduleBatch: 10 });
  console.log("Pipeline report:\n", JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Pipeline failed", error);
  process.exit(1);
});
