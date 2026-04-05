import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { env } from "@/lib/env";

type CoverInput = {
  slug: string;
  prompt: string;
  fallbackSeed: string;
};

type CoverOutput = {
  fileName: string;
  mimeType: string;
  storageKey: string;
  url: string;
  isFallback?: boolean;
};

function buildFallbackCover(seed: string) {
  return {
    fileName: `${seed}.svg`,
    mimeType: "image/svg+xml",
    storageKey: `external/fallback/${seed}`,
    // Generic fallback to avoid unrelated photos when image generation fails.
    url: `https://placehold.co/1600x900/f1f5f9/0f172a/png?text=${encodeURIComponent("Malooma")}`,
    isFallback: true,
  } satisfies CoverOutput;
}

export async function generateCoverImage(input: CoverInput): Promise<CoverOutput> {
  if (!env.OPENAI_API_KEY) return buildFallbackCover(input.fallbackSeed);

  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const imageModel = env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const params: Parameters<typeof client.images.generate>[0] = {
      model: imageModel,
      prompt: input.prompt,
      size: "1536x1024",
    };
    if (imageModel.startsWith("gpt-image-")) {
      params.quality = "medium";
    }

    const result = await client.images.generate(params);
    const b64 = "data" in result ? result.data?.[0]?.b64_json : undefined;
    if (!b64) return buildFallbackCover(input.fallbackSeed);

    const buffer = Buffer.from(b64, "base64");
    const safeBase = input.slug
      .normalize("NFKD")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/[^a-zA-Z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "cover";
    const fileName = `${Date.now()}-${safeBase}.png`;
    const relativeDir = path.join("generated", "articles");
    const publicDir = path.join(process.cwd(), "public", relativeDir);
    await fs.mkdir(publicDir, { recursive: true });
    await fs.writeFile(path.join(publicDir, fileName), buffer);

    return {
      fileName,
      mimeType: "image/png",
      storageKey: `${relativeDir}/${fileName}`,
      url: `/${relativeDir}/${fileName}`,
    };
  } catch {
    return buildFallbackCover(input.fallbackSeed);
  }
}
