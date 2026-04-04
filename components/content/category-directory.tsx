import Link from "next/link";
import type { MainCategory } from "@/lib/types";

export function CategoryDirectory({ categories }: { categories: MainCategory[] }) {
  return (
    <section id="categories" className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
      <h2 className="mb-4 text-2xl font-black text-slate-900">دليل التصنيفات</h2>
      <div className="space-y-6">
        {categories.map((category) => (
          <article key={category.slug} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="mb-3 text-xl font-bold text-slate-900">
              <Link href={`/categories/${category.slug}`}>{category.name}</Link>
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {category.subcategories.slice(0, 32).map((subcategory) => (
                <li key={subcategory.slug}>
                  <Link
                    href={`/categories/${category.slug}/${subcategory.slug}`}
                    className="block rounded border border-transparent px-2 py-1 text-sm text-slate-700 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                  >
                    {subcategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
