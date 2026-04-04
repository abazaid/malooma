import { createStaticPageAction } from "@/app/admin/actions";

export default function AdminStaticPagesPage() {
  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">إدارة الصفحات الثابتة</h2>
        <p className="mt-2 text-sm text-slate-700">تعديل صفحات: عن المنصة، معايير التدقيق، الخصوصية، الشروط، التواصل.</p>
      </header>

      <form action={createStaticPageAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <input name="slug" required placeholder="slug (example: about)" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="title" required placeholder="عنوان الصفحة" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <textarea name="body" rows={8} required placeholder="محتوى الصفحة" className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          حفظ الصفحة
        </button>
      </form>
    </div>
  );
}
