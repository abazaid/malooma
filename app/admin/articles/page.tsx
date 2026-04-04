import Link from "next/link";
import { createArticleAction, toggleArticleStatusAction, updateUnpublishedArticleAction } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { contentRepository } from "@/lib/repositories/content-repository";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const notice = params.notice ? decodeURIComponent(params.notice) : "";
  const error = params.error ? decodeURIComponent(params.error) : "";

  const [latest, categories, unpublished] = await Promise.all([
    contentRepository.getLatestArticles(1),
    contentRepository.getMainCategories(),
    prisma.article.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED", "ARCHIVED"] } },
      orderBy: [{ createdAt: "desc" }],
      take: 80,
      include: {
        category: { include: { parent: true } },
        heroMedia: { select: { url: true } },
      },
    }),
  ]);

  const subcategories = categories.flatMap((category) =>
    category.subcategories.map((sub) => ({
      slug: sub.slug,
      label: `${category.name} / ${sub.name}`,
    })),
  );

  return (
    <div className="space-y-5">
      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>
      ) : null}
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div> : null}

      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">إدارة المقالات</h2>
        <p className="mt-2 text-sm text-slate-700">إنشاء وتحرير المقالات مع دعم slug وحقول السيو وتاريخ النشر.</p>
      </header>

      <form action={createArticleAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <input name="title" placeholder="عنوان المقال" required className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <select name="categorySlug" required className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">اختر التصنيف</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="excerpt"
          required
          rows={3}
          placeholder="ملخص المقال"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          إنشاء مقال
        </button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-lg font-bold text-slate-900">المقالات غير المنشورة</h3>
        <p className="mb-4 text-xs text-slate-600">هنا تقدر تعدل المقال كاملًا قبل النشر: العنوان، الملخص، التصنيف، صورة المقال، والحالة.</p>
        <div className="space-y-3">
          {unpublished.length === 0 ? <p className="text-sm text-slate-500">لا يوجد مقالات غير منشورة حاليًا.</p> : null}
          {unpublished.map((article) => (
            <article key={article.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="rounded border border-slate-300 bg-slate-50 px-2 py-1 font-bold text-slate-700">{article.status}</span>
                <span className="text-slate-500">{article.slug}</span>
              </div>

              <form action={updateUnpublishedArticleAction} className="grid gap-2 md:grid-cols-2">
                <input type="hidden" name="articleId" value={article.id} />
                <input
                  name="title"
                  defaultValue={article.title}
                  required
                  className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                  placeholder="عنوان المقال"
                />
                <textarea
                  name="excerpt"
                  defaultValue={article.excerpt}
                  required
                  rows={3}
                  className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                  placeholder="ملخص المقال"
                />
                <select name="categorySlug" defaultValue={article.category.slug} className="rounded border border-slate-300 px-3 py-2 text-sm">
                  {subcategories.map((sub) => (
                    <option key={sub.slug} value={sub.slug}>
                      {sub.label}
                    </option>
                  ))}
                </select>
                <input
                  name="heroImageUrl"
                  defaultValue={article.heroMedia?.url ?? ""}
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="رابط صورة المقال (اختياري)"
                />
                <div className="md:col-span-2">
                  <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                    حفظ التعديلات
                  </button>
                </div>
              </form>

              <div className="mt-2 flex flex-wrap gap-2">
                <form action={toggleArticleStatusAction}>
                  <input type="hidden" name="articleId" value={article.id} />
                  <input type="hidden" name="nextStatus" value="PUBLISHED" />
                  <button type="submit" className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    نشر الآن
                  </button>
                </form>
                <form action={toggleArticleStatusAction}>
                  <input type="hidden" name="articleId" value={article.id} />
                  <input type="hidden" name="nextStatus" value="DRAFT" />
                  <button type="submit" className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                    تحويل لمسودة
                  </button>
                </form>
                <Link href={`/articles/${article.slug}`} className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50">
                  معاينة
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-lg font-bold text-slate-900">أحدث المقالات المنشورة</h3>
        <ul className="space-y-2">
          {latest.items.slice(0, 25).map((article) => (
            <li key={article.slug} className="flex items-center justify-between rounded border border-slate-100 px-3 py-2 text-sm">
              <span className="line-clamp-1">{article.title}</span>
              <Link href={`/articles/${article.slug}`} className="text-sky-700 hover:underline">
                معاينة
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
