import { createCategoryAction, deleteCategoryAction, importReferenceTaxonomyAction, updateCategoryAction } from "@/app/admin/actions";
import { contentRepository } from "@/lib/repositories/content-repository";

export default async function AdminCategoriesPage() {
  const categories = await contentRepository.getMainCategories();

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">إدارة الأقسام</h2>
        <p className="mt-2 text-sm text-slate-700">يمكنك إنشاء قسم رئيسي أو قسم فرعي وربطه بالقسم الأب.</p>
      </header>

      <form action={createCategoryAction} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3">
        <input name="name" placeholder="اسم القسم" required className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <input name="parentSlug" placeholder="parent slug (اختياري)" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          حفظ
        </button>
      </form>

      <form action={importReferenceTaxonomyAction} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">استيراد كامل التصنيفات والفروع من `reference-data` وإرجاع البنية الكبيرة كما كانت.</p>
          <button type="submit" className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            استيراد كل التصنيفات الآن
          </button>
        </div>
      </form>

      <section className="space-y-4">
        {categories.map((category) => (
          <article key={category.slug} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
                <p className="mt-1 text-xs text-slate-500">slug: {category.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={updateCategoryAction} className="flex items-center gap-2">
                  <input type="hidden" name="slug" value={category.slug} />
                  <input
                    name="name"
                    defaultValue={category.name}
                    className="w-44 rounded border border-slate-300 px-2 py-1 text-xs"
                    required
                  />
                  <button type="submit" className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                    تعديل
                  </button>
                </form>
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="slug" value={category.slug} />
                  <button type="submit" className="rounded border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                    حذف
                  </button>
                </form>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-600">عدد الفروع: {category.subcategories.length.toLocaleString("ar-SA")}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {category.subcategories.map((subcategory) => (
                <li key={subcategory.slug} className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{subcategory.name}</span>
                    <span className="text-[11px] text-slate-500">({subcategory.slug})</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
