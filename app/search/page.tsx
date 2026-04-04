import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "البحث",
  description: "ابحث داخل المحتوى العربي حسب الكلمة المفتاحية والتصنيف.",
  path: "/search",
});

export default function SearchPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
      <h1 className="text-3xl font-black text-slate-900">البحث داخل المنصة</h1>
      <p className="mt-3 text-sm leading-8 text-slate-700">يدعم البحث المطابقة الجزئية وإظهار النتائج المرتبطة بالتصنيفات.</p>

      <form action="/search/results" className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="q">
          اكتب عبارة البحث
        </label>
        <div className="flex gap-2">
          <input
            id="q"
            name="q"
            required
            placeholder="مثال: فوائد فيتامين د"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none ring-sky-300 focus:ring"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            بحث
          </button>
        </div>
      </form>
    </section>
  );
}
