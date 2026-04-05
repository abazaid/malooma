import Link from "next/link";
import type { ArticleCardModel, MainCategory } from "@/lib/types";

type ArticleSidebarProps = {
  currentSlug: string;
  categorySlug: string;
  categoryName: string;
  subcategorySlug: string;
  subcategoryName: string;
  mainCategory: MainCategory | null;
  latest: ArticleCardModel[];
  popular: ArticleCardModel[];
};

function MiniArticleCard({ article }: { article: ArticleCardModel }) {
  return (
    <li>
      <Link href={`/articles/${article.slug}`} className="group flex items-start gap-3 rounded-lg p-2 transition hover:bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.heroImage}
          alt={article.title}
          loading="lazy"
          className="h-16 w-24 shrink-0 rounded border border-slate-200 object-cover"
        />
        <h3 className="line-clamp-2 text-sm leading-6 text-slate-800 group-hover:text-slate-950">{article.title}</h3>
      </Link>
    </li>
  );
}

export function ArticleSidebar({
  currentSlug,
  categorySlug,
  categoryName,
  subcategorySlug,
  subcategoryName,
  mainCategory,
  latest,
  popular,
}: ArticleSidebarProps) {
  const latestItems = latest.filter((item) => item.slug !== currentSlug).slice(0, 8);
  const popularItems = popular.filter((item) => item.slug !== currentSlug).slice(0, 8);
  const siblingSubcategories =
    mainCategory?.subcategories.filter((item) => item.slug !== subcategorySlug).slice(0, 10) ?? [];

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-bold text-slate-900">التصنيف الحالي</h2>
        <div className="space-y-2 text-sm">
          <Link href={`/categories/${categorySlug}`} className="block rounded border border-slate-200 px-3 py-2 hover:bg-slate-50">
            {categoryName}
          </Link>
          <Link
            href={`/categories/${categorySlug}/${subcategorySlug}`}
            className="block rounded border border-slate-200 bg-sky-50 px-3 py-2 text-sky-900 hover:bg-sky-100"
          >
            {subcategoryName}
          </Link>
        </div>
      </section>

      {siblingSubcategories.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-bold text-slate-900">تصنيفات ذات صلة</h2>
          <ul className="space-y-2 text-sm">
            {siblingSubcategories.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/categories/${categorySlug}/${item.slug}`}
                  className="block rounded border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-base font-bold text-slate-900">اقرأ أيضًا</h2>
        <ul className="space-y-1">
          {latestItems.map((item) => (
            <MiniArticleCard key={`latest-${item.id}`} article={item} />
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-base font-bold text-slate-900">الأكثر رواجًا</h2>
        <ul className="space-y-1">
          {popularItems.map((item) => (
            <MiniArticleCard key={`popular-${item.id}`} article={item} />
          ))}
        </ul>
      </section>
    </aside>
  );
}

