import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { slugifyArabic } from "@/lib/slug";

const FALLBACK_AUTHOR_NAMES = [
  "ليان السالم",
  "سارة القحطاني",
  "ريم العتيبي",
  "نجلاء الحربي",
  "هبة الزهراني",
  "شهد الغامدي",
  "أماني الدوسري",
  "رنا المطيري",
  "مها الشمري",
  "نوف العبدالله",
  "عبدالرحمن الشهري",
  "فيصل العنزي",
  "مازن القيسي",
  "أحمد الزبيدي",
  "خالد العمري",
  "عمر السبيعي",
  "حسام الجابري",
  "بندر البقمي",
  "سلمان السويلم",
  "تركي العلي",
  "يزن القيسي",
  "محمد الرشيد",
  "رامي الحسن",
  "إياد الخطيب",
];

const FALLBACK_REVIEWER_NAMES = ["لجنة التحرير", "نهى السعدي", "هدى العبدلي", "سالم الجهني", "ندى الشمري", "علي الحازمي"];

type ContributorPool = {
  authors: string[];
  reviewers: string[];
};

async function generateContributorNamesWithAI(): Promise<ContributorPool | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await client.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "أنت مدير تحرير عربي. أعد JSON فقط بأسماء عربية طبيعية.",
      },
      {
        role: "user",
        content: `أنشئ JSON بالشكل:
{
  "authors": ["20 اسم عربي طبيعي لكُتّاب محتوى"],
  "reviewers": ["6 أسماء عربية مناسبة للتدقيق التحريري"]
}
شروط:
- أسماء حقيقية بطابع عربي.
- بدون ألقاب وظيفية.
- بدون تكرار.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<ContributorPool>;
  if (!Array.isArray(parsed.authors) || !Array.isArray(parsed.reviewers)) return null;

  return {
    authors: parsed.authors.map((name) => name.trim()).filter(Boolean),
    reviewers: parsed.reviewers.map((name) => name.trim()).filter(Boolean),
  };
}

async function upsertAuthor(name: string) {
  const baseSlug = slugifyArabic(name) || `author-${Date.now()}`;
  const existing = await prisma.author.findFirst({
    where: { displayName: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;

  let slug = baseSlug;
  let suffix = 1;
  // Ensure unique slug without failing the pipeline.
  while (await prisma.author.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return prisma.author.create({
    data: {
      displayName: name,
      slug,
      bio: "كاتب متخصص في المحتوى العربي المعرفي.",
    },
  });
}

async function upsertReviewer(name: string) {
  const baseSlug = slugifyArabic(name) || `reviewer-${Date.now()}`;
  const existing = await prisma.reviewer.findFirst({
    where: { displayName: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;

  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.reviewer.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return prisma.reviewer.create({
    data: {
      displayName: name,
      slug,
      bio: "مراجع تحريري لضمان جودة المحتوى ودقته.",
    },
  });
}

export async function ensureContributorPools(minAuthors = 20, minReviewers = 5) {
  const authors = await prisma.author.findMany({ orderBy: { createdAt: "asc" } });
  const reviewers = await prisma.reviewer.findMany({ orderBy: { createdAt: "asc" } });

  const aiPool = await generateContributorNamesWithAI().catch(() => null);
  const authorNames = [...(aiPool?.authors ?? []), ...FALLBACK_AUTHOR_NAMES];
  const reviewerNames = [...(aiPool?.reviewers ?? []), ...FALLBACK_REVIEWER_NAMES];

  let authorIndex = 0;
  while (authors.length < minAuthors && authorIndex < authorNames.length) {
    const created = await upsertAuthor(authorNames[authorIndex]);
    if (!authors.some((item) => item.id === created.id)) authors.push(created);
    authorIndex += 1;
  }

  let reviewerIndex = 0;
  while (reviewers.length < minReviewers && reviewerIndex < reviewerNames.length) {
    const created = await upsertReviewer(reviewerNames[reviewerIndex]);
    if (!reviewers.some((item) => item.id === created.id)) reviewers.push(created);
    reviewerIndex += 1;
  }

  return { authors, reviewers };
}

export function pickRandomItem<T>(items: T[]) {
  if (items.length === 0) throw new Error("Cannot pick random item from empty list");
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}
