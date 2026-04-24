import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/content/article-card";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Pagination } from "@/components/content/pagination";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { contentRepository } from "@/lib/repositories/content-repository";
import { absoluteUrl } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await contentRepository.getAuthorBySlug(slug);

  if (!author) {
    return buildMetadata({
      title: "كاتب غير موجود",
      description: "صفحة الكاتب المطلوبة غير متاحة.",
      path: "/404",
      noIndex: true,
    });
  }

  return buildMetadata({
    title: author.name,
    description: author.bio,
    path: `/authors/${author.slug}`,
  });
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = Number((await searchParams).page ?? "1");

  const [author, articles] = await Promise.all([
    contentRepository.getAuthorBySlug(slug),
    contentRepository.getArticlesByAuthor(slug, page),
  ]);

  if (!author) notFound();

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.name,
          url: absoluteUrl(`/authors/${author.slug}`),
          description: author.bio,
          jobTitle: author.jobTitle ?? "كاتب محتوى",
          knowsAbout: author.knowsAbout,
          sameAs: author.sameAs,
          worksFor: {
            "@type": "Organization",
            name: siteConfig.name,
            url: absoluteUrl("/"),
          },
        }}
      />

      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { href: "/team", label: "فريق التحرير" }, { label: author.name }]} />
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-semibold text-teal-700">{author.jobTitle ?? "كاتب محتوى"}</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">{author.name}</h1>
        <p className="mt-3 text-sm leading-8 text-slate-700">{author.bio}</p>
        {author.knowsAbout?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {author.knowsAbout.map((item) => (
              <span key={item} className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                {item}
              </span>
            ))}
          </div>
        ) : null}
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
