import type { ArticleCardModel, ArticleModel, MainCategory } from "@/lib/types";
import { siteConfig } from "@/lib/site";
import { absoluteUrl, formatArabicDate } from "@/lib/utils";

function cleanText(value: string) {
  return value.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function escapeMarkdown(value: string) {
  return cleanText(value).replace(/([\\`*_{}[\]()#+.!|-])/g, "\\$1");
}

function link(label: string, href: string) {
  return `[${escapeMarkdown(label)}](${href.startsWith("http") ? href : absoluteUrl(href)})`;
}

function listArticles(articles: ArticleCardModel[]) {
  if (articles.length === 0) return "- لا توجد مقالات منشورة حاليا.";

  return articles
    .map((article) => {
      const href = `/articles/${article.slug}`;
      return `- ${link(article.title, href)} - ${escapeMarkdown(article.excerpt)} (${formatArabicDate(article.publishedAt)})`;
    })
    .join("\n");
}

function listCategories(categories: MainCategory[]) {
  if (categories.length === 0) return "- لا توجد تصنيفات متاحة حاليا.";

  return categories
    .map((category) => {
      const subcategories = category.subcategories
        .slice(0, 8)
        .map((subcategory) => link(subcategory.name, `/categories/${category.slug}/${subcategory.slug}`))
        .join("، ");

      return `- ${link(category.name, `/categories/${category.slug}`)}: ${escapeMarkdown(category.description)}${
        subcategories ? `\n  - تصنيفات فرعية: ${subcategories}` : ""
      }`;
    })
    .join("\n");
}

export function estimateMarkdownTokens(markdown: string) {
  const arabicAndLatinWords = markdown.split(/\s+/).filter(Boolean).length;
  return String(Math.max(1, Math.ceil(arabicAndLatinWords * 1.35)));
}

export function renderHomeMarkdown(input: {
  latest: ArticleCardModel[];
  popular: ArticleCardModel[];
  trending: ArticleCardModel[];
  categories: MainCategory[];
}) {
  return [
    `# ${siteConfig.name}`,
    "",
    siteConfig.description,
    "",
    `- الموقع: ${absoluteUrl("/")}`,
    `- البريد التحريري: ${siteConfig.editorialEmail}`,
    `- اللغة: العربية`,
    "",
    "## متداول الآن",
    "",
    listArticles(input.trending.slice(0, 8)),
    "",
    "## أحدث المقالات",
    "",
    listArticles(input.latest.slice(0, 12)),
    "",
    "## الأكثر رواجا",
    "",
    listArticles(input.popular.slice(0, 12)),
    "",
    "## التصنيفات",
    "",
    listCategories(input.categories),
  ].join("\n");
}

export function renderArticleMarkdown(article: ArticleModel) {
  const sections = article.sections
    .map((section) => {
      if (section.blockType === "heading") return `## ${escapeMarkdown(section.heading ?? "")}`;
      if (section.blockType === "list") return section.content;
      return [`## ${escapeMarkdown(section.heading ?? "فقرة")}`, "", cleanText(section.content)].join("\n");
    })
    .join("\n\n");

  const faqs = article.faqs
    .map((faq) => `### ${escapeMarkdown(faq.question)}\n\n${cleanText(faq.answer)}`)
    .join("\n\n");

  const sources = article.sources
    .map((source) => `- ${link(source.title, source.url)}${source.publisher ? ` - ${escapeMarkdown(source.publisher)}` : ""}`)
    .join("\n");

  return [
    `# ${escapeMarkdown(article.title)}`,
    "",
    escapeMarkdown(article.excerpt),
    "",
    `- الرابط الأساسي: ${absoluteUrl(`/articles/${article.slug}`)}`,
    `- الكاتب: ${link(article.author.name, `/authors/${article.author.slug}`)}`,
    `- التصنيف: ${link(article.categoryName, `/categories/${article.categorySlug}`)} / ${link(
      article.subcategoryName,
      `/categories/${article.categorySlug}/${article.subcategorySlug}`,
    )}`,
    `- تاريخ النشر: ${formatArabicDate(article.publishedAt)}`,
    `- آخر تحديث: ${formatArabicDate(article.updatedAt)}`,
    "",
    "## إجابة سريعة",
    "",
    cleanText(article.excerpt),
    "",
    sections,
    "",
    article.faqs.length ? "## أسئلة شائعة\n\n" + faqs : "",
    "",
    article.sources.length ? "## المصادر\n\n" + sources : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderCategoryMarkdown(input: {
  title: string;
  description: string;
  path: string;
  articles?: ArticleCardModel[];
  categories?: MainCategory[];
}) {
  return [
    `# ${escapeMarkdown(input.title)}`,
    "",
    escapeMarkdown(input.description),
    "",
    `- الرابط: ${absoluteUrl(input.path)}`,
    "",
    input.categories?.length ? "## التصنيفات\n\n" + listCategories(input.categories) : "",
    input.articles?.length ? "## المقالات\n\n" + listArticles(input.articles) : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderStaticPageMarkdown(input: {
  title: string;
  description: string;
  body: string;
  path: string;
}) {
  return [
    `# ${escapeMarkdown(input.title)}`,
    "",
    escapeMarkdown(input.description),
    "",
    cleanText(input.body),
    "",
    `- الرابط: ${absoluteUrl(input.path)}`,
  ].join("\n");
}
