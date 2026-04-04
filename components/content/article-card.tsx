import Link from "next/link";
import type { ArticleCardModel } from "@/lib/types";
import { formatArabicDate } from "@/lib/utils";

export function ArticleCard({ article }: { article: ArticleCardModel }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.heroImage}
          alt={article.title}
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 text-xs font-semibold text-teal-700">
          <Link href={`/categories/${article.categorySlug}/${article.subcategorySlug}`}>{article.subcategoryName}</Link>
        </div>
        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-7 text-slate-900">
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-7 text-slate-600">{article.excerpt}</p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>{article.author.name}</span>
          <span>{formatArabicDate(article.publishedAt)}</span>
        </div>
      </div>
    </article>
  );
}
