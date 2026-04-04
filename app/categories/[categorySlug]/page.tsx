import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/content/article-card";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Pagination } from "@/components/content/pagination";
import { SectionHeader } from "@/components/content/section-header";
import { JsonLd } from "@/components/seo/json-ld";
import { contentRepository } from "@/lib/repositories/content-repository";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";

type Props = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await contentRepository.getCategoryBySlug(categorySlug);
  if (!category) {
    return buildMetadata({ title: "تصنيف غير موجود", description: "الصفحة المطلوبة غير متاحة.", path: "/404", noIndex: true });
  }

  return buildMetadata({
    title: category.name,
    description: category.description,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const page = Number((await searchParams).page ?? "1");

  const [category, articles] = await Promise.all([
    contentRepository.getCategoryBySlug(categorySlug),
    contentRepository.getArticlesByCategory(categorySlug, page),
  ]);

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.name,
          url: absoluteUrl(`/categories/${category.slug}`),
          description: category.description,
        }}
      />

      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: category.name }]} />

      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">{category.name}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-700">{category.description}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <SectionHeader title="التصنيفات الفرعية" />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {category.subcategories.map((subcategory) => (
            <li key={subcategory.slug}>
              <Link
                href={`/categories/${category.slug}/${subcategory.slug}`}
                className="block rounded border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {subcategory.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHeader title="أحدث المقالات" description={`نتائج: ${articles.total.toLocaleString("ar-SA")}`} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.items.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        <Pagination basePath={`/categories/${category.slug}`} page={articles.page} totalPages={articles.totalPages} />
      </section>
    </div>
  );
}
