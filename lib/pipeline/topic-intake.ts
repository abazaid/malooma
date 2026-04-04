import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { hashTitle, jaccardSimilarity, normalizeTopicTitle } from "@/lib/pipeline/text-utils";

function parseTopicFromLine(line: string): string | null {
  if (!line.trim()) return null;
  try {
    const url = new URL(line.trim());
    const decoded = decodeURIComponent(url.pathname).replace(/^\//, "");
    if (!decoded || decoded.startsWith("تصنيف:") || decoded.startsWith("خاص:")) return null;
    return decoded.replaceAll("_", " ").trim();
  } catch {
    return null;
  }
}

export async function intakeTopicsFromReference(fileName = "mawdoo3_topic_links_from_categories.txt") {
  const filePath = path.join(process.cwd(), "reference-data", fileName);
  const content = await readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  let inserted = 0;
  for (const line of lines) {
    const title = parseTopicFromLine(line);
    if (!title) continue;

    const normalized = normalizeTopicTitle(title);
    const titleHash = hashTitle(normalized);

    await prisma.topicQueue.upsert({
      where: { titleHash },
      create: {
        rawTitle: title,
        normalizedTitle: normalized,
        titleHash,
        status: "QUEUED",
        keywords: normalized.split(" ").slice(0, 12),
      },
      update: {},
    });
    inserted += 1;
  }

  return { inserted };
}

export async function cleanAndDedupeTopics(limit = 500) {
  const queued = await prisma.topicQueue.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const existingArticles = await prisma.article.findMany({
    select: { title: true, slug: true },
    take: 5000,
  });

  const existingMemories = await prisma.contentMemory.findMany({
    select: { title: true, slug: true },
    take: 5000,
  });

  const uniqueBucket: typeof queued = [];
  const skippedIds: string[] = [];

  for (const topic of queued) {
    let duplicate = false;

    for (const accepted of uniqueBucket) {
      const sim = jaccardSimilarity(topic.normalizedTitle, accepted.normalizedTitle);
      if (sim >= 0.88) {
        duplicate = true;
        skippedIds.push(topic.id);
        break;
      }
    }

    if (!duplicate) {
      for (const old of existingArticles) {
        const sim = jaccardSimilarity(topic.rawTitle, old.title);
        if (sim >= 0.86) {
          duplicate = true;
          skippedIds.push(topic.id);
          break;
        }
      }
    }

    if (!duplicate) {
      for (const old of existingMemories) {
        const sim = jaccardSimilarity(topic.rawTitle, old.title);
        if (sim >= 0.86) {
          duplicate = true;
          skippedIds.push(topic.id);
          break;
        }
      }
    }

    if (!duplicate) uniqueBucket.push(topic);
  }

  if (skippedIds.length > 0) {
    await prisma.topicQueue.updateMany({
      where: { id: { in: skippedIds } },
      data: { status: "SKIPPED", errorMessage: "Topic duplicated or very similar to existing content" },
    });
  }

  const cleanIds = uniqueBucket.map((t) => t.id);
  if (cleanIds.length > 0) {
    await prisma.topicQueue.updateMany({
      where: { id: { in: cleanIds } },
      data: { status: "CLEANED" },
    });
  }

  return { cleaned: cleanIds.length, skipped: skippedIds.length };
}
