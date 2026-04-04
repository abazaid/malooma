import { intakeTopicsFromReference } from "@/lib/pipeline/topic-intake";

async function main() {
  const fileName = process.argv[2] || "mawdoo3_topic_links.xml";
  console.log(`[intake] start file=${fileName}`);
  const result = await intakeTopicsFromReference(fileName);
  console.log("[intake] done", result);
}

main().catch((error) => {
  console.error("[intake] failed", error);
  process.exit(1);
});

