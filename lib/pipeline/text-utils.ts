import crypto from "node:crypto";

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function normalizeTopicTitle(title: string) {
  return title
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[ـ]/g, "")
    // Keep letters and numbers from all languages (including Arabic).
    .replace(/[^\p{L}\p{N}]+/gu, " ")
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

const TOPIC_STOPWORDS = new Set([
  "ما",
  "ماذا",
  "هو",
  "هي",
  "على",
  "من",
  "في",
  "عن",
  "الى",
  "إلى",
  "و",
  "او",
  "أو",
  "كيف",
  "كيفية",
  "تعريف",
  "شرح",
  "أهم",
  "افضل",
  "أفضل",
  "آثار",
  "اثر",
  "أثر",
]);

function coreTokens(text: string) {
  return tokenizeArabic(text).filter((token) => !TOPIC_STOPWORDS.has(token) && token.length >= 3);
}

export function sharedCoreTokenCount(a: string, b: string) {
  const sa = new Set(coreTokens(a));
  const sb = new Set(coreTokens(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const token of sa) {
    if (sb.has(token)) shared += 1;
  }
  return shared;
}

export function topicCoherenceScore(a: string, b: string) {
  const j = jaccardSimilarity(a, b);
  const coreShared = sharedCoreTokenCount(a, b);
  const coreBoost = Math.min(0.5, coreShared * 0.15);
  return j + coreBoost;
}
