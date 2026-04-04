import { absoluteUrl, truncate } from "@/lib/utils";
import { slugifyArabic } from "@/lib/slug";

export function optimizeSeo(input: {
  title: string;
  excerpt: string;
  categoryName: string;
  lsiKeywords: string[];
}) {
  const slug = slugifyArabic(input.title);
  const keywordSuffix = input.lsiKeywords.slice(0, 3).join("، ");
  const metaTitle = truncate(`${input.title} | دليل شامل من معلومة`, 60);
  const metaDescription = truncate(`${input.excerpt} تعرّف على أهم النقاط حول ${input.categoryName} مع شرح عملي وأمثلة واضحة.`, 155);
  const canonical = absoluteUrl(`/articles/${slug}`);

  return {
    slug,
    metaTitle,
    metaDescription,
    canonical,
    lsiKeywords: [...new Set([input.categoryName, ...input.lsiKeywords, keywordSuffix])].filter(Boolean),
  };
}
