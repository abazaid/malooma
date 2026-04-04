import crypto from "node:crypto";

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function normalizeTopicTitle(title: string) {
  return title
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[ـ]/g, "")
    .replace(/[\W_]+/g, " ")
    .trim()
    .toLowerCase();
}

export function hashTitle(normalizedTitle: string) {
  return crypto.createHash("sha1").update(normalizedTitle, "utf8").digest("hex");
}

export function tokenizeArabic(text: string) {
  return normalizeTopicTitle(text)
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

export function jaccardSimilarity(a: string, b: string) {
  const sa = new Set(tokenizeArabic(a));
  const sb = new Set(tokenizeArabic(b));
  if (sa.size === 0 || sb.size === 0) return 0;

  let intersection = 0;
  for (const token of sa) {
    if (sb.has(token)) intersection += 1;
  }
  const union = new Set([...sa, ...sb]).size;
  return intersection / union;
}

export function splitToSentences(text: string) {
  return text.split(/[.!؟\n]/).map((s) => s.trim()).filter(Boolean);
}
