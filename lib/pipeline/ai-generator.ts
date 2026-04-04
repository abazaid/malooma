import OpenAI from "openai";

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
    h2: (input.h2 ?? []).slice(0, 8),
    h3: (input.h3 ?? []).slice(0, 8),
    sections: (input.sections ?? []).filter((s) => s?.heading && s?.body),
    keyPoints: (input.keyPoints ?? []).filter(Boolean).slice(0, 12),
    faq: (input.faq ?? []).filter((f) => f?.q && f?.a).slice(0, 8),
    lsiKeywords: (input.lsiKeywords ?? []).filter(Boolean).slice(0, 15),
    metaTitle: (input.metaTitle ?? "").trim(),
    metaDescription: (input.metaDescription ?? "").trim(),
  };
}

async function requestPackage(client: OpenAI, model: string, prompt: string) {
  const response = await client.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "أنت محرر عربي محترف وخبير SEO. أنشئ محتوى أصلي 100% بدون نسخ أو إعادة صياغة حرفية من أي منافس. أخرج JSON صالح فقط.",
      },
      { role: "user", content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const jsonText = extractJson(content);
  return JSON.parse(jsonText) as AiArticlePackage;
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

  const basePrompt = `
أنشئ مقالًا عربيًا أصليًا بالكامل حول الموضوع التالي:
- الموضوع: ${input.topic}
- التصنيف الرئيسي: ${input.mainCategory}
- التصنيف الفرعي: ${input.subCategory}

شروط إلزامية:
1) المحتوى عربي طبيعي وبشري واحترافي.
2) لا يقل النص عن 1200 كلمة.
3) فقرة قصيرة واضحة، بدون حشو أو تكرار.
4) اكتب وفق Search Intent واضح.
5) أدرج FAQ واقعي.
6) أدرج نقاط عملية قابلة للتطبيق.
7) لا تنسخ أي صياغة من أي موقع خارجي.
8) إن أمكن، اربط الموضوع بمواضيع ذات صلة من هذه العناوين:
${input.relatedTitles.slice(0, 12).map((t, i) => `${i + 1}. ${t}`).join("\n") || "- لا توجد روابط سابقة"}

أعد النتيجة JSON فقط بالشكل:
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
  "metaDescription": "..."
}
`;

  let pkg = normalizePackage(await requestPackage(client, model, basePrompt), input.topic);

  if (articleWordCount(pkg) < 1200) {
    const expansionPrompt = `
المقال التالي أقل من 1200 كلمة. وسّع المحتوى بنفس الموضوع، مع الحفاظ على الجودة وعدم التكرار.
الموضوع: ${input.topic}

المخرجات يجب أن تكون JSON بنفس البنية السابقة وتحتوي نصًا أطول.
النص الحالي:
${JSON.stringify(pkg)}
`;

    pkg = normalizePackage(await requestPackage(client, model, expansionPrompt), pkg.title || input.topic);
  }

  return pkg;
}
