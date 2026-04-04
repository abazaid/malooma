import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/content/article-body";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { contentRepository } from "@/lib/repositories/content-repository";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl, formatArabicDate } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await contentRepository.getArticleBySlug(slug);

  if (!article) {
    return buildMetadata({ title: "مقال غير موجود", description: "المقال المطلوب غير متوفر.", path: "/404", noIndex: true });
  }

  return buildMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/articles/${article.slug}`,
    image: article.heroImage,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await contentRepository.getArticleBySlug(slug);

  if (!article) notFound();

  return (
    <article className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") },
            {
              "@type": "ListItem",
              position: 2,
              name: article.categoryName,
              item: absoluteUrl(`/categories/${article.categorySlug}`),
            },
            { "@type": "ListItem", position: 3, name: article.title, item: absoluteUrl(`/articles/${article.slug}`) },
          ],
        }}
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          author: { "@type": "Person", name: article.author.name },
          image: [article.heroImage],
          mainEntityOfPage: article.canonical,
          publisher: {
            "@type": "Organization",
            name: "معلومة",
            logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.ico") },
          },
        }}
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }}
      />

      <Breadcrumbs
        items={[
          { href: "/", label: "الرئيسية" },
          { href: `/categories/${article.categorySlug}`, label: article.categoryName },
          { href: `/categories/${article.categorySlug}/${article.subcategorySlug}`, label: article.subcategoryName },
          { label: article.title },
        ]}
      />

      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="mb-2 text-sm font-semibold text-teal-700">{article.subcategoryName}</p>
        <h1 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">{article.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 md:text-sm">
          <span>الكاتب: {article.author.name}</span>
          <span>•</span>
          <span>التدقيق: {article.reviewer?.name}</span>
          <span>•</span>
          <span>نُشر: {formatArabicDate(article.publishedAt)}</span>
          <span>•</span>
          <span>آخر تحديث: {formatArabicDate(article.updatedAt)}</span>
          <span>•</span>
          <span>{article.readingMinutes} دقائق قراءة</span>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.heroImage} alt={article.title} className="h-full w-full object-cover" loading="lazy" />
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <ArticleBody article={article} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        <h2 className="text-base font-bold text-slate-900">سياسة التدقيق</h2>
        <p className="mt-2 leading-7">{article.trustNote}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/editorial-standards" className="rounded border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100">
            قراءة معايير التدقيق
          </Link>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(article.canonical)}&text=${encodeURIComponent(article.title)}`}
            rel="noreferrer"
            target="_blank"
            className="rounded border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-100"
          >
            مشاركة المقال
          </a>
        </div>
      </section>
    </article>
  );
}
