import type { Category } from "@prisma/client";
import OpenAI from "openai";
import { tokenizeArabic } from "@/lib/pipeline/text-utils";
import { slugifyArabic } from "@/lib/slug";
import { prisma } from "@/lib/prisma";

const CATEGORY_HINTS: Record<string, string[]> = {
  "فن الطهي": ["طبخ", "أكل", "وصفة", "حلو", "مطبخ", "سلطة", "كيك", "شوربة", "مشروب"],
  "حول العالم": ["دولة", "مدينة", "سياحة", "عاصمة", "جغرافيا", "معالم", "متاحف", "حضارة", "تاريخ"],
  "العناية بالذات": ["بشرة", "شعر", "مكياج", "عناية", "أزياء", "جمال"],
  "مال وأعمال": ["اقتصاد", "مشروع", "استثمار", "أعمال", "تجارة", "عملات", "ميزان", "تمويل", "مبيعات"],
  "تقنية": ["تقنية", "هاتف", "انترنت", "برمجة", "كمبيوتر", "تطبيق", "ذكاء", "رقمي"],
  "صحة": ["مرض", "صحة", "علاج", "أعراض", "ضغط", "سكري", "فيتامين", "تغذية", "سمنة"],
  "تعليم": ["تعليم", "تعلم", "مدرسة", "جامعة", "بحث", "دراسة", "منهج", "اختبار"],
  "إسلام": ["إسلام", "دعاء", "القرآن", "حديث", "فقه", "الوضوء", "الصلاة", "الزكاة"],
  "تغذية": ["غذاء", "سعرات", "رجيم", "فيتامين", "بروتين", "غذائية", "حمية"],
  "حيوانات ونباتات": ["حيوان", "نبات", "زهور", "طيور", "أسماك", "زراعة"],
  "قصص وحكايات": ["قصة", "حكاية", "رواية"],
  "فنون": ["موسيقى", "فن", "رسم", "شعر", "أدب", "مسرح"],
  "الحياة والمجتمع": ["المجتمع", "الأسرة", "المرأة", "الطلاق", "البطالة", "التسول", "العنف", "زواج"],
};

const ELIGIBLE_MAIN_NAMES = Object.keys(CATEGORY_HINTS);

function forcedMainCategory(title: string) {
  const normalized = title.replace(/\s+/g, " ").trim();

  if (normalized.includes("آثار") && normalized.includes("على")) {
    if (/(التدخين|السكر|الضغط|مرض|صحة|البشرة|الشعر|الشمس|الحروق)/.test(normalized)) return "صحة";
    if (/(البطالة|الطلاق|التسول|العنف|المجتمع|المرأة|الأسرة)/.test(normalized)) return "الحياة والمجتمع";
  }

  return null;
}

async function ensureBaseMainCategories() {
  for (const [index, name] of ELIGIBLE_MAIN_NAMES.entries()) {
    const slug = slugifyArabic(name);
    await prisma.category.upsert({
      where: { slug },
      create: {
        name,
        slug,
        level: 1,
        sortOrder: index,
        description: `قسم رئيسي تلقائي: ${name}`,
        isActive: true,
      },
      update: {
        name,
        level: 1,
        sortOrder: index,
        isActive: true,
      },
    });
  }
}

function scoreMainCategory(title: string, categoryName: string) {
  const tokens = tokenizeArabic(title);
  const hints = CATEGORY_HINTS[categoryName] ?? [];
  let score = 0;
  for (const token of tokens) {
    if (hints.some((hint) => token.includes(hint) || hint.includes(token))) score += 2;
  }
  if (title.includes(categoryName)) score += 3;
  return score;
}

function scoreSubCategory(title: string, subName: string) {
  const tokens = tokenizeArabic(title);
  let score = 0;
  for (const token of tokens) {
    if (subName.includes(token) || token.includes(subName)) score += 2;
  }
  return score;
}

async function pickMainCategoryWithAi(title: string, mains: Category[]) {
  if (!process.env.OPENAI_API_KEY || mains.length === 0) return null;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const response = await client.chat.completions.create({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Classify the Arabic title to one category from the provided list only. Return JSON only: {\"category\":\"...\"}.",
        },
        { role: "user", content: `Title: ${title}\nCategories: ${mains.map((m) => m.name).join(" | ")}` },
      ],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { category?: string };
    return mains.find((m) => m.name === parsed.category) ?? null;
  } catch {
    return null;
  }
}

export async function classifyTopic(title: string): Promise<{ mainCategory: Category; subCategory: Category }> {
  await ensureBaseMainCategories();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
  });

  const mainCategories = categories.filter((cat) => cat.level === 1);
  const subCategories = categories.filter((cat) => cat.level === 2);
  const hintedMainCategories = mainCategories.filter((cat) => ELIGIBLE_MAIN_NAMES.includes(cat.name));
  const eligibleMains = hintedMainCategories.length > 0 ? hintedMainCategories : mainCategories;

  const forcedMain = forcedMainCategory(title);
  let winnerMain = eligibleMains[0];
  let bestMainScore = -1;

  if (forcedMain) {
    const forced = eligibleMains.find((item) => item.name === forcedMain);
    if (forced) winnerMain = forced;
  } else {
    for (const main of eligibleMains) {
      const score = scoreMainCategory(title, main.name);
      if (score > bestMainScore) {
        bestMainScore = score;
        winnerMain = main;
      }
    }

    if (bestMainScore <= 0) {
      const aiPick = await pickMainCategoryWithAi(title, eligibleMains);
      if (aiPick) winnerMain = aiPick;
    }
  }

  const mainSubs = subCategories.filter((sub) => sub.parentId === winnerMain.id);
  let winnerSub = mainSubs[0] ?? null;
  let maxSubScore = -1;
  for (const sub of mainSubs) {
    const score = scoreSubCategory(title, sub.name);
    if (score > maxSubScore) {
      maxSubScore = score;
      winnerSub = sub;
    }
  }

  if (!winnerSub || maxSubScore <= 0) {
    const fallbackName = `منوعات ${winnerMain.name}`;
    winnerSub = await prisma.category.upsert({
      where: { slug: slugifyArabic(fallbackName) },
      create: {
        name: fallbackName,
        slug: slugifyArabic(fallbackName),
        level: 2,
        parentId: winnerMain.id,
        description: `تصنيف فرعي تلقائي ضمن ${winnerMain.name}`,
      },
      update: { isActive: true },
    });
  }

  return { mainCategory: winnerMain, subCategory: winnerSub };
}

