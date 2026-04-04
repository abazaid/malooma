import { setTrendingAction } from "@/app/admin/actions";
import { contentRepository } from "@/lib/repositories/content-repository";

export default async function AdminTrendingPage() {
  const [popular, latest] = await Promise.all([
    contentRepository.getPopularArticles(1),
    contentRepository.getLatestArticles(1),
  ]);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">إدارة التريند والأكثر رواجًا</h2>
        <p className="mt-2 text-sm text-slate-700">حدد المقالات التي تظهر في خانات الترند والأكثر قراءة.</p>
      </header>

      <form action={setTrendingAction} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3">
        <input name="articleSlug" required placeholder="slug المقال" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input name="slotKey" placeholder="slot key (مثال hero-1)" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          تعيين
        </button>
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-bold text-slate-900">أكثر رواجًا (حاليًا)</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {popular.items.slice(0, 12).map((item) => (
              <li key={item.slug} className="rounded border border-slate-100 px-3 py-2">
                {item.title}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 font-bold text-slate-900">أحدث المقالات (مرشحة للترند)</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {latest.items.slice(0, 12).map((item) => (
              <li key={item.slug} className="rounded border border-slate-100 px-3 py-2">
                {item.title}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
