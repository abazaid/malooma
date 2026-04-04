import type { Category } from "@prisma/client";
import { tokenizeArabic } from "@/lib/pipeline/text-utils";
import { slugifyArabic } from "@/lib/slug";
import { prisma } from "@/lib/prisma";

const CATEGORY_HINTS: Record<string, string[]> = {
  "فن الطهي": ["طبخ", "أكل", "وصفة", "حلو", "مطبخ", "سلطة", "كيك", "شوربة", "مشروب"],
  "حول العالم": ["دولة", "مدينة", "سياحة", "عاصمة", "آثار", "جغرافيا"],
  "العناية بالذات": ["بشرة", "شعر", "مكياج", "عناية", "أزياء", "جمال"],
  "مال وأعمال": ["اقتصاد", "مشروع", "استثمار", "أعمال", "تجارة", "عملات"],
  "تقنية": ["تقنية", "هاتف", "انترنت", "برمجة", "كمبيوتر", "تطبيق"],
  "صحة": ["مرض", "صحة", "علاج", "أعراض", "ضغط", "سكري", "فيتامين"],
  "تعليم": ["تعليم", "تعلم", "مدرسة", "جامعة", "بحث", "دراسة"],
  "إسلام": ["إسلام", "دعاء", "القرآن", "حديث", "فقه", "الوضوء"],
  "تغذية": ["غذاء", "سعرات", "رجيم", "فيتامين", "بروتين"],
  "حيوانات ونباتات": ["حيوان", "نبات", "زهور", "طيور", "أسماك"],
  "قصص وحكايات": ["قصة", "حكاية", "رواية"],
  "فنون": ["موسيقى", "فن", "رسم", "شعر", "أدب"],
};

async function ensureBaseMainCategories() {
  const baseNames = Object.keys(CATEGORY_HINTS);
  for (const [index, name] of baseNames.entries()) {
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
    if (hints.some((hint) => token.includes(hint) || hint.includes(token))) {
      score += 2;
    }
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

export async function classifyTopic(title: string): Promise<{ mainCategory: Category; subCategory: Category }> {
  await ensureBaseMainCategories();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ level: "asc" }, { sortOrder: "asc" }],
  });

  const mainCategories = categories.filter((cat) => cat.level === 1);
  const subCategories = categories.filter((cat) => cat.level === 2);

  let winnerMain = mainCategories[0];
  let maxMainScore = -1;
  for (const main of mainCategories) {
    const score = scoreMainCategory(title, main.name);
    if (score > maxMainScore) {
      maxMainScore = score;
      winnerMain = main;
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
      update: {
        isActive: true,
      },
    });
  }

  return { mainCategory: winnerMain, subCategory: winnerSub };
}
