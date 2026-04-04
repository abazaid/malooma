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

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function articleWordCount(pkg: AiArticlePackage) {
  const joined = [
    pkg.searchIntent,
    pkg.excerpt,
    ...pkg.sections.map((s) => `${s.heading} ${s.body}`),
    ...pkg.keyPoints,
    ...pkg.faq.map((f) => `${f.q} ${f.a}`),
    pkg.conclusion,
  ].join("\n");
  return wordCount(joined);
}

function normalizePackage(input: AiArticlePackage, titleFallback: string): AiArticlePackage {
  return {
    ...input,
    title: input.title?.trim() || titleFallback,
    excerpt: input.excerpt?.trim() || `دليل عملي وشامل حول ${titleFallback}.`,
    h2: (input.h2 ?? []).slice(0, 10),
    h3: (input.h3 ?? []).slice(0, 12),
    sections: (input.sections ?? []).filter((s) => s?.heading && s?.body),
    keyPoints: (input.keyPoints ?? []).filter(Boolean).slice(0, 12),
    faq: (input.faq ?? []).filter((f) => f?.q && f?.a).slice(0, 10),
    lsiKeywords: (input.lsiKeywords ?? []).filter(Boolean).slice(0, 18),
    metaTitle: (input.metaTitle ?? "").trim(),
    metaDescription: (input.metaDescription ?? "").trim(),
    internalLinkSuggestions: (input.internalLinkSuggestions ?? [])
      .filter((item) => item?.anchor && item?.targetTopic)
      .slice(0, 8),
  };
}

async function promptJson<T>(client: OpenAI, model: string, system: string, user: string): Promise<T> {
  const response = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
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
  model?: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for AI generation");
  }

  const model = input.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey });

  const analysis = await promptJson<AnalysisStage>(
    client,
    model,
    "أنت خبير SEO عربي. نفّذ مرحلة التحليل فقط. أعد JSON صالح فقط.",
    `المرحلة 1: Analysis
الموضوع: ${input.topic}
التصنيف الرئيسي: ${input.mainCategory}
التصنيف الفرعي: ${input.subCategory}

المطلوب JSON:
{
  "primaryKeyword": "...",
  "searchIntent": "تعليمي|عملي|حل مشكلة|مقارنة|تجاري",
  "userGoal": "...",
  "userProblem": "..."
}
اجعل التحليل واقعيًا ومباشرًا.`,
  );

  const outline = await promptJson<OutlineStage>(
    client,
    model,
    "أنت محرر محتوى عربي احترافي. نفّذ مرحلة الهيكل فقط. أعد JSON صالح فقط.",
    `المرحلة 2: Outline
نتيجة التحليل:
${JSON.stringify(analysis, null, 2)}

الموضوع: ${input.topic}
يجب أن يكون الهيكل عمليًا ويراعي نية البحث، بدون حشو.
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
  );

  const executionPrompt = `المرحلة 3: Execution
اكتب المقال النهائي بناءً على التحليل والهيكل فقط. لا تخرج عنهما.
لا تعرض مراحل التحليل والهيكل للمستخدم.

نتيجة التحليل:
${JSON.stringify(analysis, null, 2)}

نتيجة الهيكل:
${JSON.stringify(outline, null, 2)}

عناوين مقالات ذات صلة متاحة للربط الداخلي:
${input.relatedTitles.slice(0, 12).map((t, i) => `${i + 1}. ${t}`).join("\n") || "- لا توجد مقالات منشورة بعد"}

قواعد إلزامية:
1) محتوى عربي طبيعي وبشري واحترافي.
2) الحد الأدنى 1200 كلمة.
3) فقرات قصيرة وواضحة.
4) ممنوع الحشو والتكرار والأسلوب النظري العام.
5) أضف أمثلة واقعية وخطوات عملية ونصائح قابلة للتطبيق.
6) اربط المعلومات بنتائج فعلية مثل توفير الوقت أو حل المشكلة أو رفع الدخل.
7) لا تنسخ أي نص من أي مصدر خارجي.
8) الربط الداخلي الذكي:
   - إذا توجد مواضيع ذات صلة: أنشئ اقتراحات anchor text طبيعية.
   - إذا لا توجد: أنشئ internalLinkSuggestions كروابط مقترحة لإضافتها لاحقًا.

أعد JSON فقط بالشكل:
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
    await promptJson<AiArticlePackage>(
      client,
      model,
      "أنت كاتب عربي محترف وخبير SEO. أعد JSON صالح فقط.",
      executionPrompt,
    ),
    outline.h1 || input.topic,
  );

  if (articleWordCount(pkg) < 1200) {
    pkg = normalizePackage(
      await promptJson<AiArticlePackage>(
        client,
        model,
        "أنت كاتب عربي محترف وخبير SEO. وسّع المقال مع الحفاظ على الجودة. أعد JSON فقط.",
        `المقال الحالي أقل من 1200 كلمة. وسّعه فورًا دون تكرار أو حشو.
النص الحالي:
${JSON.stringify(pkg)}
أعد نفس البنية تمامًا.`,
      ),
      pkg.title || input.topic,
    );
  }

  return pkg;
}
