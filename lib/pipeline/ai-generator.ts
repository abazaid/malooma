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
    excerpt: input.excerpt?.trim() || `دليل عملي وشامل حول ${titleFallback}.`,
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

function createTextClient() {
  const baseURL = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || "http://127.0.0.1:11434/v1";
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "ollama";

  return new OpenAI({
    apiKey,
    baseURL,
  });
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
  const client = createTextClient();
  const lightModel = process.env.LLM_MODEL_LIGHT || "qwen3:4b";
  const writerModel = process.env.LLM_MODEL_WRITER || "qwen3:8b";

  const analysis = await promptJson<AnalysisStage>({
    client,
    model: lightModel,
    system: "أنت خبير SEO عربي. نفّذ مرحلة التحليل فقط وأعد JSON صحيح فقط.",
    user: `المرحلة 1: تحليل الموضوع
الموضوع: ${input.topic}
التصنيف الرئيسي: ${input.mainCategory}
التصنيف الفرعي: ${input.subCategory}

أعد JSON:
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
    model: lightModel,
    system: "أنت محرر محتوى عربي. نفّذ مرحلة الهيكل فقط وأعد JSON صحيح فقط.",
    user: `المرحلة 2: بناء الهيكل
نتيجة التحليل:
${JSON.stringify(analysis, null, 2)}

الموضوع: ${input.topic}
أنشئ H2 و H3 مرتبة تخدم نية البحث بدون حشو.

JSON:
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

  const executionPrompt = `المرحلة 3: كتابة المقال النهائي
اعتمد فقط على التحليل والهيكل التاليين:

التحليل:
${JSON.stringify(analysis, null, 2)}

الهيكل:
${JSON.stringify(outline, null, 2)}

عناوين مساعدة للربط الداخلي:
${input.relatedTitles.slice(0, 15).map((title, idx) => `${idx + 1}. ${title}`).join("\n") || "- لا توجد مقالات سابقة"}

قواعد إلزامية:
1) لا تعرض مراحل التحليل أو الهيكل للمستخدم.
2) اكتب مقال عربي بشري احترافي.
3) الطول بين 800 و1500 كلمة.
4) كل فقرة لها فائدة عملية واضحة.
5) أضف أمثلة واقعية وخطوات ونصائح قابلة للتطبيق.
6) امنع الحشو والتكرار والأسلوب النظري.
7) أضف FAQ عملي.
8) أضف SEO fields: meta title / meta description / keywords.
9) اقترح روابط داخلية طبيعية (2-5).

أعد JSON فقط بالبنية:
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
      model: writerModel,
      system: "أنت كاتب عربي محترف. أعد JSON صالح فقط.",
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
        model: writerModel,
        system: "أنت محرر عربي. صحّح طول المقال فقط إلى 800-1500 كلمة مع الحفاظ على الجودة. JSON فقط.",
        user: `الطول الحالي ${words} كلمة. أعد كتابة المحتوى بنفس الفكرة بحيث يصبح بين 800 و1500 كلمة.
الناتج الحالي:
${JSON.stringify(pkg)}
أعد نفس JSON schema.`,
        temperature: 0.5,
      }),
      pkg.title || input.topic,
    );
  }

  return pkg;
}
