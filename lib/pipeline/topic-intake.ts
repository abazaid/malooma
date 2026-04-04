import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { logPipelineEvent } from "@/lib/pipeline/events";
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

function extractUrls(content: string) {
  const urls = new Set<string>();

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      urls.add(trimmed);
    }
  }

  const matches = content.match(/https?:\/\/[^\s<>"']+/g) ?? [];
  for (const value of matches) {
    urls.add(value.trim());
  }

  return [...urls];
}

export async function intakeTopicsFromReference(fileName = "__scan_all__") {
  const referenceDir = path.join(process.cwd(), "reference-data");
  const files = await readdir(referenceDir);
  const preferredFile = fileName === "__scan_all__" ? undefined : files.find((item) => item === fileName);
  const candidateFiles = preferredFile
    ? [preferredFile]
    : files.filter((item) => item.endsWith(".txt") || item.endsWith(".xml"));

  const uniqueByHash = new Map<
    string,
    {
      rawTitle: string;
      normalizedTitle: string;
      titleHash: string;
      status: "QUEUED";
      keywords: string[];
    }
  >();

  for (const file of candidateFiles) {
    const content = await readFile(path.join(referenceDir, file), "utf8");
    const urls = extractUrls(content);
    for (const url of urls) {
      const title = parseTopicFromLine(url);
      if (!title) continue;
      const normalized = normalizeTopicTitle(title);
      const titleHash = hashTitle(normalized);
      if (uniqueByHash.has(titleHash)) continue;

      uniqueByHash.set(titleHash, {
        rawTitle: title,
        normalizedTitle: normalized,
        titleHash,
        status: "QUEUED",
        keywords: normalized.split(" ").slice(0, 12),
      });
    }
  }

  const rows = [...uniqueByHash.values()];
  const chunkSize = 5000;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const result = await prisma.topicQueue.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += result.count;
  }

  await logPipelineEvent({
    stage: "TOPIC_INTAKE",
    status: "SUCCESS",
    message: `Reference intake completed. inserted=${inserted} scanned=${rows.length}`,
    metaJson: {
      inserted,
      scanned: rows.length,
      files: candidateFiles,
    },
  });

  return { inserted, scanned: rows.length, files: candidateFiles.length };
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

  await logPipelineEvent({
    stage: "TOPIC_CLEANING",
    status: "SUCCESS",
    message: `Topic cleaning done. cleaned=${cleanIds.length}, skipped=${skippedIds.length}`,
    metaJson: {
      cleaned: cleanIds.length,
      skipped: skippedIds.length,
    },
  });

  return { cleaned: cleanIds.length, skipped: skippedIds.length };
}

export async function enqueueManualTopic(title: string) {
  const rawTitle = title.trim();
  if (!rawTitle) return null;

  const normalized = normalizeTopicTitle(rawTitle);
  const titleHash = hashTitle(normalized);

  const topic = await prisma.topicQueue.upsert({
    where: { titleHash },
    create: {
      rawTitle,
      normalizedTitle: normalized,
      titleHash,
      status: "QUEUED",
      keywords: normalized.split(" ").slice(0, 12),
    },
    update: {
      rawTitle,
    },
  });

  await logPipelineEvent({
    stage: "TOPIC_MANUAL_ADD",
    status: "SUCCESS",
    topicId: topic.id,
    message: `Manual topic queued: ${rawTitle}`,
  });

  return topic;
}
