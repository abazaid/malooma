import { notFound } from "next/navigation";
import { buildCategorySeo, buildSubcategorySeo } from "@/lib/category-seo";
import {
  estimateMarkdownTokens,
  renderArticleMarkdown,
  renderCategoryMarkdown,
  renderHomeMarkdown,
  renderStaticPageMarkdown,
} from "@/lib/markdown";
import { contentRepository } from "@/lib/repositories/content-repository";

function markdownResponse(markdown: string, status = 200) {
  return new Response(markdown, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
      "x-markdown-tokens": estimateMarkdownTokens(markdown),
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}

function decodePath(value: string | null) {
  if (!value) return "/";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = decodePath(request.headers.get("x-markdown-path") ?? url.searchParams.get("path")).replace(/\/+$/, "") || "/";
  const segments = pathname.split("/").filter(Boolean);

  if (pathname === "/") {
    const home = await contentRepository.getHomeData();
    return markdownResponse(renderHomeMarkdown(home));
  }

  if (segments[0] === "articles" && segments[1]) {
    const article = await contentRepository.getArticleBySlug(segments[1]);
    if (!article) notFound();
    return markdownResponse(renderArticleMarkdown(article));
  }

  if (segments[0] === "categories" && !segments[1]) {
    const categories = await contentRepository.getMainCategories();
    return markdownResponse(
      renderCategoryMarkdown({
        title: "التصنيفات",
        description: "دليل تصنيفات معلومة الرئيسية والفرعية للوصول السريع إلى المقالات العربية المنظمة.",
        path: "/categories",
        categories,
      }),
    );
  }

  if (segments[0] === "categories" && segments[1] && !segments[2]) {
    const [category, articles] = await Promise.all([
      contentRepository.getCategoryBySlug(segments[1]),
      contentRepository.getArticlesByCategory(segments[1], 1),
    ]);
    if (!category) notFound();

    const seo = buildCategorySeo({
      categoryName: category.name,
      subcategoriesCount: category.subcategories.length,
      articlesCount: articles.total,
    });

    return markdownResponse(
      renderCategoryMarkdown({
        title: category.name,
        description: seo.description,
        path: `/categories/${category.slug}`,
        categories: [{ ...category, subcategories: category.subcategories }],
        articles: articles.items,
      }),
    );
  }

  if (segments[0] === "categories" && segments[1] && segments[2]) {
    const [category, subcategory, articles] = await Promise.all([
      contentRepository.getCategoryBySlug(segments[1]),
      contentRepository.getSubcategoryBySlug(segments[1], segments[2]),
      contentRepository.getArticlesBySubcategory(segments[2], 1, segments[1]),
    ]);
    if (!category || !subcategory) notFound();

    const seo = buildSubcategorySeo({
      categoryName: category.name,
      subcategoryName: subcategory.name,
      articlesCount: articles.total,
    });

    return markdownResponse(
      renderCategoryMarkdown({
        title: `${subcategory.name} - ${category.name}`,
        description: seo.description,
        path: `/categories/${category.slug}/${subcategory.slug}`,
        articles: articles.items,
      }),
    );
  }

  if (segments[0] === "latest") {
    const latest = await contentRepository.getLatestArticles(1);
    return markdownResponse(
      renderCategoryMarkdown({
        title: "أحدث المقالات",
        description: "أحدث المقالات المنشورة في معلومة عبر جميع التصنيفات.",
        path: "/latest",
        articles: latest.items,
      }),
    );
  }

  if (segments[0] === "popular") {
    const popular = await contentRepository.getPopularArticles(1);
    return markdownResponse(
      renderCategoryMarkdown({
        title: "الأكثر رواجا",
        description: "قائمة المقالات الأكثر رواجا في معلومة.",
        path: "/popular",
        articles: popular.items,
      }),
    );
  }

  if (segments[0] === "authors" && segments[1]) {
    const [author, articles] = await Promise.all([
      contentRepository.getAuthorBySlug(segments[1]),
      contentRepository.getArticlesByAuthor(segments[1], 1),
    ]);
    if (!author) notFound();

    return markdownResponse(
      renderCategoryMarkdown({
        title: author.name,
        description: author.bio,
        path: `/authors/${author.slug}`,
        articles: articles.items,
      }),
    );
  }

  const staticPage = await contentRepository.getStaticPage(segments[0]);
  if (staticPage) {
    return markdownResponse(
      renderStaticPageMarkdown({
        title: staticPage.title,
        description: staticPage.description,
        body: staticPage.body,
        path: `/${staticPage.slug}`,
      }),
    );
  }

  notFound();
}
