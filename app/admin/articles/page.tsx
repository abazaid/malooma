import Link from "next/link";
import { createArticleAction } from "@/app/admin/actions";
import { contentRepository } from "@/lib/repositories/content-repository";

export default async function AdminArticlesPage() {
  const [latest, categories] = await Promise.all([
    contentRepository.getLatestArticles(1),
    contentRepository.getMainCategories(),
  ]);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">إدارة المقالات</h2>
        <p className="mt-2 text-sm text-slate-700">إنشاء وتحرير المقالات مع دعم slug وحقول السيو وتاريخ النشر.</p>
      </header>

      <form action={createArticleAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <input name="title" placeholder="عنوان المقال" required className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <select name="categorySlug" required className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="">اختر التصنيف</option>
            {categories.flatMap((category) => category.subcategories.slice(0, 20)).map((subcategory) => (
              <option key={subcategory.slug} value={subcategory.slug}>
                {subcategory.name}
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
        <h3 className="mb-3 text-lg font-bold text-slate-900">أحدث المقالات</h3>
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
