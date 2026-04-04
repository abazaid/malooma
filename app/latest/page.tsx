import { ArticleCard } from "@/components/content/article-card";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Pagination } from "@/components/content/pagination";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";

export const metadata = buildMetadata({
  title: "أجدد المقالات",
  description: "آخر المقالات المنشورة ضمن كافة الأقسام.",
  path: "/latest",
});

export default async function LatestPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await searchParams).page ?? "1");
  const data = await contentRepository.getLatestArticles(page);

  return (
    <div>
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: "أجدد المقالات" }]} />
      <h1 className="mb-4 text-3xl font-black text-slate-900">أجدد المقالات</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
      <Pagination basePath="/latest" page={data.page} totalPages={data.totalPages} />
    </div>
  );
}
