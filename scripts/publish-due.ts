import { publishDueArticles } from "@/lib/pipeline/engine";

async function main() {
  const report = await publishDueArticles(5);
  console.log("Publish report:\n", JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Publish job failed", error);
  process.exit(1);
});
