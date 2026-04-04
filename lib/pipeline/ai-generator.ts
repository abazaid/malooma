import OpenAI from "openai";

type SearchIntent = "تعليمي" | "عملي" | "حل مشكلة" | "مقارنة" | "تجاري";

type AnalysisStage = {
  primaryKeyword: string;
  searchIntent: SearchIntent;
  userGoal: string;
  userProblem: string;
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

function packageWordCount(pkg: AiArticlePackage) {
  const text = [
    pkg.searchIntent,
    pkg.excerpt,
    ...pkg.sections.map((section) => `${section.heading} ${section.body}`),
    ...pkg.keyPoints,
    ...pkg.faq.map((faq) => `${faq.q} ${faq.a}`),
    pkg.conclusion,
  ].join("\n");
  return countWords(text);
}

function normalizePackage(input: AiArticlePackage, titleFallback: string): AiArticlePackage {
  return {
    ...input,
    title: input.title?.trim() || titleFallback,
    excerpt: input.excerpt?.trim() || `دليل عملي حول ${titleFallback}.`,
    h2: (input.h2 ?? []).filter(Boolean).slice(0, 10),
    h3: (input.h3 ?? []).filter(Boolean).slice(0, 12),
    sections: (input.sections ?? []).filter((item) => item?.heading && item?.body),
    keyPoints: (input.keyPoints ?? []).filter(Boolean).slice(0, 14),
    faq: (input.faq ?? []).filter((item) => item?.q && item?.a).slice(0, 8),
    lsiKeywords: (input.lsiKeywords ?? []).filter(Boolean).slice(0, 18),
    metaTitle: (input.metaTitle ?? "").trim(),
    metaDescription: (input.metaDescription ?? "").trim(),
    internalLinkSuggestions: (input.internalLinkSuggestions ?? [])
      .filter((item) => item?.anchor && item?.targetTopic)
      .slice(0, 6),
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
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for AI generation");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const analysis = await promptJson<AnalysisStage>({
    client,
    model,
    system: "You are an Arabic SEO strategist. Return valid JSON only.",
    user: `Stage 1 - Analysis for Arabic article.
Topic: ${input.topic}
Main category: ${input.mainCategory}
Sub category: ${input.subCategory}

Return:
{
  "primaryKeyword": "...",
  "searchIntent": "تعليمي|عملي|حل مشكلة|مقارنة|تجاري",
  "userGoal": "...",
  "userProblem": "..."
}`,
    temperature: 0.3,
  });

  const outline = await promptJson<OutlineStage>({
    client,
    model,
    system: "You are an Arabic content editor. Return valid JSON only.",
    user: `Stage 2 - Outline.
Analysis:
${JSON.stringify(analysis, null, 2)}

Build an Arabic outline (H2/H3) that serves search intent with no fluff.
Return:
{
  "h1": "...",
  "h2": ["..."],
  "h3": ["..."],
  "keyPoints": ["..."],
  "faqQuestions": ["..."],
  "lsiKeywords": ["..."],
  "flowNote": "..."
}`,
    temperature: 0.4,
  });

  const executionPrompt = `Stage 3 - Execution.
Write the final article in Arabic only, based strictly on the analysis + outline.
Do not show analysis/outline in output.

Analysis:
${JSON.stringify(analysis, null, 2)}

Outline:
${JSON.stringify(outline, null, 2)}

Related titles for internal linking:
${input.relatedTitles.slice(0, 15).map((title, idx) => `${idx + 1}. ${title}`).join("\n") || "- no previous articles"}

Rules:
1) Human Arabic style.
2) Article length between 800 and 1500 words.
3) Practical value in every section.
4) Include real examples, actionable steps, tips, and FAQ.
5) No fluff or repetition.
6) Include SEO output (meta title, meta description, LSI keywords).
7) Internal links suggestions between 2 and 5.

Return JSON only:
{
  "searchIntent": "...",
  "title": "...",
  "excerpt": "...",
  "h2": ["..."],
  "h3": ["..."],
  "sections": [{"heading":"...","body":"..."}],
  "keyPoints": ["..."],
  "faq": [{"q":"...","a":"..."}],
  "conclusion": "...",
  "lsiKeywords": ["..."],
  "metaTitle": "...",
  "metaDescription": "...",
  "internalLinkSuggestions": [{"anchor":"...","targetTopic":"..."}]
}`;

  let pkg = normalizePackage(
    await promptJson<AiArticlePackage>({
      client,
      model,
      system: "You are a senior Arabic writer and SEO editor. Return valid JSON only.",
      user: executionPrompt,
      temperature: 0.7,
    }),
    outline.h1 || input.topic,
  );

  const words = packageWordCount(pkg);
  if (words < 800 || words > 1500) {
    pkg = normalizePackage(
      await promptJson<AiArticlePackage>({
        client,
        model,
        system: "Fix word count to 800-1500 while preserving quality. Return valid JSON only.",
        user: `Current word count is ${words}. Rewrite to target 800-1500 words.
Current output:
${JSON.stringify(pkg)}
Return the same JSON schema.`,
        temperature: 0.5,
      }),
      pkg.title || input.topic,
    );
  }

  return pkg;
}
