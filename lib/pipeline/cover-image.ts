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
};

function buildFallbackCover(seed: string) {
  return {
    fileName: `${seed}.jpg`,
    mimeType: "image/jpeg",
    storageKey: `external/picsum/${seed}`,
    url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/900`,
  } satisfies CoverOutput;
}

export async function generateCoverImage(input: CoverInput): Promise<CoverOutput> {
  if (!env.OPENAI_API_KEY) return buildFallbackCover(input.fallbackSeed);

  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const imageModel = env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const result = await client.images.generate({
      model: imageModel,
      prompt: input.prompt,
      size: "1536x1024",
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) return buildFallbackCover(input.fallbackSeed);

    const buffer = Buffer.from(b64, "base64");
    const safeSlug = input.slug.replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, "").slice(0, 96) || `cover-${Date.now()}`;
    const fileName = `${safeSlug}-${Date.now()}.png`;
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
