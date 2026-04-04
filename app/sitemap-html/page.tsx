import Link from "next/link";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";

export const metadata = buildMetadata({
  title: "خريطة الموقع",
  description: "خريطة HTML تساعد المستخدم ومحركات البحث في استكشاف جميع أقسام المنصة.",
  path: "/sitemap-html",
});

export default async function SitemapHtmlPage() {
  const [categories, latest, popular] = await Promise.all([
    contentRepository.getMainCategories(),
    contentRepository.getLatestArticles(1),
    contentRepository.getPopularArticles(1),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: "خريطة الموقع" }]} />
      <h1 className="text-3xl font-black text-slate-900">خريطة الموقع</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900">صفحات رئيسية</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["/latest", "أجدد المقالات"],
            ["/popular", "الأكثر رواجًا"],
            ["/search", "البحث"],
            ["/about", "عن المنصة"],
            ["/editorial-standards", "معايير التدقيق"],
            ["/contact", "اتصل بنا"],
            ["/privacy", "سياسة الخصوصية"],
            ["/terms", "اتفاقية الاستخدام"],
            ["/team", "فريق التحرير"],
          ].map(([href, label]) => (
            <li key={href}>
              <Link className="text-sky-700 hover:underline" href={href}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900">التصنيفات</h2>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.slug}>
              <h3 className="font-bold text-slate-900">
                <Link href={`/categories/${category.slug}`} className="hover:underline">
                  {category.name}
                </Link>
              </h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {category.subcategories.slice(0, 24).map((subcategory) => (
                  <li key={subcategory.slug}>
                    <Link className="text-sm text-slate-700 hover:underline" href={`/categories/${category.slug}/${subcategory.slug}`}>
                      {subcategory.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900">روابط مقالات مختارة</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[...latest.items.slice(0, 25), ...popular.items.slice(0, 25)].map((article) => (
            <li key={`${article.slug}-sitemap`}>
              <Link href={`/articles/${article.slug}`} className="text-sm text-slate-700 hover:underline">
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
