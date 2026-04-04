import { ArticleCard } from "@/components/content/article-card";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Pagination } from "@/components/content/pagination";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";

export const metadata = buildMetadata({
  title: "نتائج البحث",
  description: "صفحة نتائج البحث الداخلية.",
  path: "/search/results",
  noIndex: true,
});

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page = "1" } = await searchParams;
  const data = await contentRepository.searchArticles(q, Number(page));

  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { href: "/search", label: "البحث" }, { label: "النتائج" }]} />
      <h1 className="mb-2 text-3xl font-black text-slate-900">نتائج البحث</h1>
      <p className="mb-5 text-sm text-slate-700">
        {q ? `نتائج لعبارة: ${q}` : "أدخل عبارة بحث للحصول على نتائج"} — {data.total.toLocaleString("ar-SA")} نتيجة
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      <Pagination basePath="/search/results" page={data.page} totalPages={data.totalPages} query={{ q }} />
    </div>
  );
}
