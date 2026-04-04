import { processPendingImages } from "@/lib/pipeline/engine";

async function main() {
  const report = await processPendingImages(5);
  console.log("Image queue report:\n", JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Image processing failed", error);
  process.exit(1);
});
