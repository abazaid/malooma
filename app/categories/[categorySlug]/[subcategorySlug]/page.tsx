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
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const [category, subcategory] = await Promise.all([
    contentRepository.getCategoryBySlug(categorySlug),
    contentRepository.getSubcategoryBySlug(categorySlug, subcategorySlug),
  ]);

  if (!category || !subcategory) {
    return buildMetadata({ title: "تصنيف غير موجود", description: "الصفحة المطلوبة غير متاحة.", path: "/404", noIndex: true });
  }

  return buildMetadata({
    title: `${subcategory.name} - ${category.name}`,
    description: `أرشيف مقالات ${subcategory.name} ضمن قسم ${category.name}.`,
    path: `/categories/${category.slug}/${subcategory.slug}`,
  });
}

export default async function SubcategoryPage({ params, searchParams }: Props) {
  const { categorySlug, subcategorySlug } = await params;
  const page = Number((await searchParams).page ?? "1");

  const [category, subcategory, articles] = await Promise.all([
    contentRepository.getCategoryBySlug(categorySlug),
    contentRepository.getSubcategoryBySlug(categorySlug, subcategorySlug),
    contentRepository.getArticlesBySubcategory(subcategorySlug, page),
  ]);

  if (!category || !subcategory) notFound();

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${subcategory.name} - ${category.name}`,
          url: absoluteUrl(`/categories/${category.slug}/${subcategory.slug}`),
          isPartOf: absoluteUrl(`/categories/${category.slug}`),
        }}
      />

      <Breadcrumbs
        items={[
          { href: "/", label: "الرئيسية" },
          { href: `/categories/${category.slug}`, label: category.name },
          { label: subcategory.name },
        ]}
      />

      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">{subcategory.name}</h1>
        <p className="mt-2 text-sm text-slate-700">أرشيف مقالات هذا التصنيف مرتب حسب الأحدث مع روابط نحو التصنيف الأب والتصنيفات الشقيقة.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link href={`/categories/${category.slug}`} className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
            العودة إلى {category.name}
          </Link>
          {category.subcategories.slice(0, 8).map((sibling) => (
            <Link
              key={sibling.slug}
              href={`/categories/${category.slug}/${sibling.slug}`}
              className={`rounded border px-3 py-1.5 ${
                sibling.slug === subcategory.slug ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              {sibling.name}
            </Link>
          ))}
        </div>
      </header>

      <section>
        <SectionHeader title="مقالات التصنيف" description={`نتائج: ${articles.total.toLocaleString("ar-SA")}`} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.items.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        <Pagination basePath={`/categories/${category.slug}/${subcategory.slug}`} page={articles.page} totalPages={articles.totalPages} />
      </section>
    </div>
  );
}
