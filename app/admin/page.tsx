import Link from "next/link";
import { contentRepository } from "@/lib/repositories/content-repository";

export default async function AdminDashboardPage() {
  const [homeData, categories, dbHealth] = await Promise.all([
    contentRepository.getHomeData(),
    contentRepository.getMainCategories(),
    contentRepository.getDbHealth(),
  ]);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">لوحة المعلومات</h2>
        <p className="mt-2 text-sm text-slate-700">إدارة الأقسام، المقالات، السيو، وخيارات النشر.</p>
        <p className="mt-3 inline-flex rounded bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          حالة الاتصال بقاعدة البيانات: {dbHealth.connected ? "متصل" : "غير متصل (وضع بيانات تجريبية)"}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="التصنيفات الرئيسية" value={String(categories.length)} />
        <Card title="مقالات الترند" value={String(homeData.trending.length)} />
        <Card title="الأكثر رواجًا" value={String(homeData.popular.length)} />
        <Card title="أحدث المقالات" value={String(homeData.latest.length)} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-900">مهام سريعة</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/pipeline" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            مراقبة الأتمتة
          </Link>
          <Link href="/admin/categories" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            إضافة قسم
          </Link>
          <Link href="/admin/articles" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            إضافة مقال
          </Link>
          <Link href="/admin/static-pages" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            تحديث الصفحات الثابتة
          </Link>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </article>
  );
}
