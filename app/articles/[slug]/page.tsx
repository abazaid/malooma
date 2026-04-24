import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/content/article-body";
import { ArticleSidebar } from "@/components/content/article-sidebar";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { contentRepository } from "@/lib/repositories/content-repository";
import { buildMetadata } from "@/lib/seo";
import { siteConfig, siteLogoUrl } from "@/lib/site";
import { absoluteUrl, formatArabicDate } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await contentRepository.getArticleBySlug(slug);

  if (!article) {
    return buildMetadata({
      title: "مقال غير موجود",
      description: "المقال المطلوب غير متوفر.",
      path: "/404",
      noIndex: true,
    });
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

  const [latest, popular, mainCategory] = await Promise.all([
    contentRepository.getLatestArticles(1),
    contentRepository.getPopularArticles(1),
    contentRepository.getCategoryBySlug(article.categorySlug),
  ]);

  const articleUrl = absoluteUrl(`/articles/${article.slug}`);
  const articleImage = absoluteUrl(article.heroImage);
  const authorSchema = {
    "@type": "Person",
    name: article.author.name,
    url: absoluteUrl(`/authors/${article.author.slug}`),
    jobTitle: article.author.jobTitle ?? "كاتب محتوى",
    worksFor: {
      "@type": "Organization",
      name: siteConfig.name,
      url: absoluteUrl("/"),
    },
    knowsAbout: article.author.knowsAbout ?? article.keywords,
    sameAs: article.author.sameAs,
  };

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
            { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
          ],
        }}
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt,
          inLanguage: "ar",
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          author: authorSchema,
          image: {
            "@type": "ImageObject",
            url: articleImage,
            width: 1200,
            height: 630,
          },
          mainEntityOfPage: article.canonical || articleUrl,
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["article h1", "[data-speakable='quick-answer']", "article section p:first-of-type"],
          },
          publisher: {
            "@type": "Organization",
            name: siteConfig.name,
            url: absoluteUrl("/"),
            logo: { "@type": "ImageObject", url: siteLogoUrl(), width: 1200, height: 630 },
          },
        }}
      />

      {article.faqs.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            inLanguage: "ar",
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
      ) : null}

      <Breadcrumbs
        items={[
          { href: "/", label: "الرئيسية" },
          { href: `/categories/${article.categorySlug}`, label: article.categoryName },
          { href: `/categories/${article.categorySlug}/${article.subcategorySlug}`, label: article.subcategoryName },
          { label: article.title },
        ]}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
            <p className="mb-2 text-sm font-semibold text-teal-700">{article.subcategoryName}</p>
            <h1 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">{article.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 md:text-sm">
              <Link href={`/authors/${article.author.slug}`}>الكاتب: {article.author.name}</Link>
              <span>-</span>
              <span>التدقيق: {article.reviewer?.name ?? "فريق التحرير"}</span>
              <span>-</span>
              <span>نشر: {formatArabicDate(article.publishedAt)}</span>
              <span>-</span>
              <span>آخر تحديث: {formatArabicDate(article.updatedAt)}</span>
              <span>-</span>
              <span>{article.readingMinutes} دقائق قراءة</span>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.heroImage} alt={`صورة توضيحية لمقال ${article.title}`} className="h-full w-full object-cover" loading="lazy" />
            </div>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
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
        </div>

        <ArticleSidebar
          currentSlug={article.slug}
          categorySlug={article.categorySlug}
          categoryName={article.categoryName}
          subcategorySlug={article.subcategorySlug}
          subcategoryName={article.subcategoryName}
          mainCategory={mainCategory}
          latest={latest.items}
          popular={popular.items}
        />
      </div>
    </article>
  );
}
