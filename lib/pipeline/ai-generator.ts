import OpenAI from "openai";

type SearchIntent = "تعليمي" | "عملي" | "حل مشكلة" | "مقارنة" | "تجاري";

type AnalysisStage = {
  primaryKeyword: string;
  searchIntent: SearchIntent;
  angle: "شرح مبسط" | "تحليل" | "أسباب" | "نتائج" | "دروس";
  userGoal: string;
  userProblem: string;
  userQuestion: string;
};

type OutlineStage = {
  h1: string;
  h2: string[];
  h3: string[];
  keyPoints: string[];
  faqQuestions: string[];
  lsiKeywords: string[];
  flowNote: string;
};

export type AiArticlePackage = {
  searchIntent: string;
  angle?: string;
  userQuestion?: string;
  title: string;
  excerpt: string;
  h2: string[];
  h3: string[];
  sections: { heading: string; body: string }[];
  keyPoints: string[];
  faq: { q: string; a: string }[];
  conclusion: string;
  lsiKeywords: string[];
  metaTitle: string;
  metaDescription: string;
  internalLinkSuggestions: { anchor: string; targetTopic: string }[];
};

function extractJson(content: string) {
  const trimmed = content.trim();
  const codeBlock = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (codeBlock?.[1]) return codeBlock[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function parseJson<T>(raw: string): T {
  return JSON.parse(extractJson(raw)) as T;
}

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function bodyWordCount(pkg: AiArticlePackage) {
  const text = [pkg.excerpt, ...pkg.sections.map((s) => `${s.heading} ${s.body}`), pkg.conclusion].join("\n");
  return countWords(text);
}

function normalizePackage(input: AiArticlePackage, titleFallback: string): AiArticlePackage {
  const sections = (input.sections ?? []).filter((item) => item?.heading && item?.body);
  return {
    ...input,
    title: input.title?.trim() || titleFallback,
    excerpt: input.excerpt?.trim() || `دليل عملي حول ${titleFallback}.`,
    h2: (input.h2 ?? []).filter(Boolean).slice(0, 12),
    h3: (input.h3 ?? []).filter(Boolean).slice(0, 16),
    sections,
    keyPoints: (input.keyPoints ?? []).filter(Boolean).slice(0, 16),
    faq: (input.faq ?? []).filter((item) => item?.q && item?.a).slice(0, 8),
    lsiKeywords: (input.lsiKeywords ?? []).filter(Boolean).slice(0, 18),
    metaTitle: (input.metaTitle ?? "").trim(),
    metaDescription: (input.metaDescription ?? "").trim(),
    internalLinkSuggestions: (input.internalLinkSuggestions ?? []).filter((item) => item?.anchor && item?.targetTopic).slice(0, 6),
  };
}

async function promptJson<T>(input: {
  client: OpenAI;
  model: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<T> {
  const response = await input.client.chat.completions.create({
    model: input.model,
    temperature: input.temperature ?? 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return parseJson<T>(content);
}

export async function generateArticlePackageWithAI(input: {
  topic: string;
  mainCategory: string;
  subCategory: string;
  relatedTitles: string[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for AI generation");

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const analysis = await promptJson<AnalysisStage>({
    client,
    model,
    system: "You are a strict Arabic SEO strategist. Output JSON only.",
    user: `Stage 1 Analysis:\nTopic: ${input.topic}\nMain category: ${input.mainCategory}\nSub category: ${input.subCategory}\n\nRules:\n- Pick ONE intent from: تعليمي | عملي | حل مشكلة | مقارنة | تجاري\n- Pick ONE writing angle from: شرح مبسط | تحليل | أسباب | نتائج | دروس\n- Define one specific user question this article must answer\n\nReturn JSON with: primaryKeyword, searchIntent, angle, userGoal, userProblem, userQuestion`,
    temperature: 0.2,
  });

  const outline = await promptJson<OutlineStage>({
    client,
    model,
    system: "You are a senior Arabic content architect. Output JSON only.",
    user: `Stage 2 Outline based on this analysis:\n${JSON.stringify(analysis)}\n\nReturn JSON with h1, h2[], h3[], keyPoints[], faqQuestions[], lsiKeywords[], flowNote.`,
    temperature: 0.35,
  });

  const executionPrompt = `Stage 3 Execution (Arabic article only).
Do not output analysis or outline text; output final JSON only.

Analysis: ${JSON.stringify(analysis)}
Outline: ${JSON.stringify(outline)}

Related titles (for internal links):
${input.relatedTitles.slice(0, 20).map((title, i) => `${i + 1}. ${title}`).join("\n") || "- none"}

Hard rules:
- Body length must be 900-1500 Arabic words (body = excerpt + sections + conclusion).
- Use direct practical style. Avoid encyclopedic/wikipedia tone.
- Article must answer this exact question: "${analysis.userQuestion}".
- Keep one clear angle only: "${analysis.angle}".
- Practical, non-generic style with concrete examples and steps.
- No filler, no repetition, no AI-cliche language.
- Keep paragraphs short and useful.
- Internal links suggestions must be ONLY from related titles above. If no relevant items exist, return empty list.
- Include FAQ and internal link suggestions (2-5 when possible).

Return JSON schema:
{
  "searchIntent":"...",
  "angle":"...",
  "userQuestion":"...",
  "title":"...",
  "excerpt":"...",
  "h2":["..."],
  "h3":["..."],
  "sections":[{"heading":"...","body":"..."}],
  "keyPoints":["..."],
  "faq":[{"q":"...","a":"..."}],
  "conclusion":"...",
  "lsiKeywords":["..."],
  "metaTitle":"...",
  "metaDescription":"...",
  "internalLinkSuggestions":[{"anchor":"...","targetTopic":"..."}]
}`;

  let pkg = normalizePackage(
    await promptJson<AiArticlePackage>({
      client,
      model,
      system: "You are an Arabic senior editor and SEO specialist. Output valid JSON only.",
      user: executionPrompt,
      temperature: 0.6,
    }),
    outline.h1 || input.topic,
  );

  let words = bodyWordCount(pkg);
  if (words < 900 || pkg.sections.length < 7) {
    pkg = normalizePackage(
      await promptJson<AiArticlePackage>({
        client,
        model,
        system: "Rewrite and expand the article while preserving quality. Output JSON only.",
        user: `Current body words: ${words}, sections: ${pkg.sections.length}. Rewrite to 900-1500 words and at least 7 sections. Keep practical examples and actionable steps.\n\nCurrent JSON:\n${JSON.stringify(pkg)}`,
        temperature: 0.5,
      }),
      pkg.title || input.topic,
    );
    words = bodyWordCount(pkg);
  }

  return pkg;
}
