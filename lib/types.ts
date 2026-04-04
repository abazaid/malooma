export type MainCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  subcategories: Subcategory[];
};

export type Subcategory = {
  id: string;
  name: string;
  slug: string;
  parentSlug: string;
};

export type AuthorSummary = {
  id: string;
  slug: string;
  name: string;
  bio: string;
};

export type ArticleCardModel = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string;
  categorySlug: string;
  subcategoryName: string;
  subcategorySlug: string;
  publishedAt: string;
  readingMinutes: number;
  heroImage: string;
  author: AuthorSummary;
};

export type ArticleModel = ArticleCardModel & {
  updatedAt: string;
  reviewer?: AuthorSummary;
  sections: {
    id: string;
    heading?: string;
    blockType:
      | "paragraph"
      | "heading"
      | "image"
      | "list"
      | "quote"
      | "note"
      | "faq"
      | "table"
      | "source_list"
      | "related_articles"
      | "callout";
    content: string;
    payload?: Record<string, unknown>;
  }[];
  faqs: { question: string; answer: string }[];
  sources: { title: string; url: string; publisher?: string }[];
  relatedArticles: ArticleCardModel[];
  keywords: string[];
  canonical: string;
  trustNote: string;
};

export type StaticPageModel = {
  slug: string;
  title: string;
  body: string;
  description: string;
};
