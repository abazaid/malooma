import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/content/article-card";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Pagination } from "@/components/content/pagination";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";

export const metadata = buildMetadata({
  title: "الكاتب",
  description: "صفحة تعريف الكاتب وأحدث مقالاته.",
  path: "/authors",
});

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const page = Number((await searchParams).page ?? "1");

  const [author, articles] = await Promise.all([
    contentRepository.getAuthorBySlug(slug),
    contentRepository.getArticlesByAuthor(slug, page),
  ]);

  if (!author) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { href: "/team", label: "فريق التحرير" }, { label: author.name }]} />
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">{author.name}</h1>
        <p className="mt-3 text-sm leading-8 text-slate-700">{author.bio}</p>
      </header>

      <section>
        <h2 className="mb-4 text-2xl font-black text-slate-900">مقالات الكاتب</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.items.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        <Pagination basePath={`/authors/${author.slug}`} page={articles.page} totalPages={articles.totalPages} />
      </section>
    </div>
  );
}
