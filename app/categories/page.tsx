import { CategoryDirectory } from "@/components/content/category-directory";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "التصنيفات",
  description: "دليل تصنيفات معلومة الرئيسية والفرعية للوصول السريع إلى المقالات العربية المنظمة.",
  path: "/categories",
});

export default async function CategoriesPage() {
  const categories = await contentRepository.getMainCategories();

  return (
    <div className="space-y-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "التصنيفات",
          url: absoluteUrl("/categories"),
          description: "دليل تصنيفات معلومة الرئيسية والفرعية.",
          inLanguage: "ar",
        }}
      />
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: "التصنيفات" }]} />
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">التصنيفات</h1>
        <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-700">
          تصفح أقسام معلومة الرئيسية والفرعية للوصول إلى المقالات حسب الموضوع.
        </p>
      </header>
      <CategoryDirectory categories={categories} />
    </div>
  );
}
