import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { slugifyArabic } from "./slug";

export type RawCategory = {
  name: string;
  slug: string;
  parentName: string;
  parentSlug: string;
};

export type RawArticleSeed = {
  title: string;
  slug: string;
  categorySlug: string;
  subcategorySlug: string;
};

const MAIN_CATEGORIES = [
  "فن الطهي",
  "حول العالم",
  "العناية بالذات",
  "مال وأعمال",
  "سؤال وجواب",
  "تقنية",
  "علوم الأرض",
  "فنون",
  "قصص وحكايات",
  "تغذية",
  "إسلام",
  "الزواج والحب",
  "حيوانات ونباتات",
  "تعليم",
  "صحة",
  "الحياة والمجتمع",
  "رياضة",
  "الأسرة",
  "وزن ورشاقة",
  "منوعات",
] as const;

const KEYWORD_PARENT_MAP: Record<string, string[]> = {
  "فن الطهي": ["طبق", "طهي", "مأكولات", "سلطة", "شور", "كيك", "حلويات", "عجائن", "صلص", "بهار", "عصير", "مشروب"],
  "العناية بالذات": ["بشرة", "شعر", "مكياج", "جمال", "أزياء", "عناية", "أظافر", "تفتيح", "الهالات", "حبوب"],
  "حول العالم": ["دول", "مدن", "عواصم", "سياح", "معالم", "مساح", "سكان"],
  "مال وأعمال": ["اقتصاد", "عملات", "صناعة", "عقارات", "استثمار", "أعمال"],
  "تقنية": ["تقنية", "برمج", "كمبيوتر", "موبايل", "إنترنت", "الكترون", "تطبيق", "برامج"],
  "إسلام": ["إسلام", "أحاديث", "أذكار", "قرآن", "فقه", "دعاء", "شرع", "إيمان", "الأنبياء"],
  "تغذية": ["غذ", "فيتامين", "سعرات", "حمية", "رجيم", "حليب", "فواكه", "خضروات"],
  "تعليم": ["تعليم", "تعلم", "دراسة", "مدرس", "جامعة", "لغة", "مهارات"],
  "حيوانات ونباتات": ["حيوان", "نبات", "أسماك", "برمائيات", "زهور", "ورود", "طيور"],
  "قصص وحكايات": ["قصة", "قصص", "حكا", "رواية"],
  "فنون": ["فن", "موسيق", "أدب", "شعر", "رسم", "سينما"],
  "الزواج والحب": ["زواج", "حب", "رومانس", "خطيب", "زوج"],
  "صحة": ["صحة", "مرض", "آلام", "أعراض", "علاج", "سكر", "ضغط", "صداع"],
  "رياضة": ["رياض", "تمارين", "لياقة", "كرة"],
  "الأسرة": ["طفل", "أسرة", "حمل", "ولادة", "أم", "أب"],
  "وزن ورشاقة": ["وزن", "رشاق", "سمنة", "نحافة"],
};

function chooseParent(name: string): string {
  for (const [parent, keywords] of Object.entries(KEYWORD_PARENT_MAP)) {
    if (keywords.some((keyword) => name.includes(keyword))) {
      return parent;
    }
  }
  return "منوعات";
}

function parseCategoryLine(line: string): string | null {
  if (!line.trim()) return null;
  try {
    const url = new URL(line.trim());
    const decoded = decodeURIComponent(url.pathname);
    const clean = decoded.replace(/^\//, "");
    if (!clean.startsWith("تصنيف:")) return null;
    return clean.replace("تصنيف:", "").replaceAll("_", " ").trim();
  } catch {
    return null;
  }
}

function parseArticleLine(line: string): string | null {
  if (!line.trim()) return null;
  try {
    const url = new URL(line.trim());
    const decoded = decodeURIComponent(url.pathname);
    const clean = decoded.replace(/^\//, "");
    if (!clean || clean.startsWith("تصنيف:") || clean.startsWith("خاص:")) return null;
    return clean.replaceAll("_", " ").trim();
  } catch {
    return null;
  }
}

async function readLines(fileName: string) {
  const filePath = path.join(process.cwd(), "reference-data", fileName);
  const content = await readFile(filePath, "utf8");
  return content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export const loadReferenceTaxonomy = cache(async (): Promise<RawCategory[]> => {
  const lines = await readLines("mawdoo3_categories.txt");
  const set = new Set<string>();
  const categories: RawCategory[] = [];

  for (const line of lines) {
    const name = parseCategoryLine(line);
    if (!name || set.has(name)) continue;
    set.add(name);

    const parentName = chooseParent(name);
    categories.push({
      name,
      slug: slugifyArabic(name),
      parentName,
      parentSlug: slugifyArabic(parentName),
    });
  }

  for (const main of MAIN_CATEGORIES) {
    if (!set.has(main)) {
      categories.push({
        name: main,
        slug: slugifyArabic(main),
        parentName: main,
        parentSlug: slugifyArabic(main),
      });
    }
  }

  return categories;
});

export const loadReferenceArticleSeeds = cache(async (): Promise<RawArticleSeed[]> => {
  const [articleLines, categories] = await Promise.all([
    readLines("mawdoo3_topic_links_from_categories.txt"),
    loadReferenceTaxonomy(),
  ]);

  const subcategories = categories.filter((c) => c.name !== c.parentName);
  const subByIndex = subcategories.length > 0 ? subcategories : categories;

  const items: RawArticleSeed[] = [];
  const seen = new Set<string>();

  for (const [index, line] of articleLines.entries()) {
    if (index > 4000) break;
    const title = parseArticleLine(line);
    if (!title) continue;

    const slug = slugifyArabic(title);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const target = subByIndex[index % subByIndex.length];
    items.push({
      title,
      slug,
      categorySlug: target.parentSlug,
      subcategorySlug: target.slug,
    });
  }

  return items;
});

export const MAIN_CATEGORY_NAMES = MAIN_CATEGORIES;
