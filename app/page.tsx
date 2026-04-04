import Link from "next/link";
import { ArticleCard } from "@/components/content/article-card";
import { CategoryDirectory } from "@/components/content/category-directory";
import { SectionHeader } from "@/components/content/section-header";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";

export const metadata = buildMetadata({
  title: "الرئيسية",
  description:
    "منصة عربية معرفية ضخمة تضم مقالات مصنفة ضمن أقسام رئيسية وفرعية مع تجربة تصفح سريعة ومرنة.",
  path: "/",
});

export default async function HomePage() {
  const home = await contentRepository.getHomeData();

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-l from-teal-700 to-cyan-700 p-6 text-white md:p-8">
        <p className="text-sm font-semibold text-cyan-100">منصة محتوى عربية عالية التنظيم</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">مكتبة معرفية ضخمة بتجربة تصفح عملية وسريعة</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-cyan-50 md:text-base">
          نعيد تنظيم المعرفة العربية ضمن تصنيفات رئيسية وفرعية واضحة، مع صفحات مقالات محسّنة لمحركات البحث وتجربة قراءة مناسبة
          للموبايل أولًا.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link className="rounded bg-white px-4 py-2 text-slate-900" href="/latest">
            ابدأ بأحدث المقالات
          </Link>
          <Link className="rounded border border-cyan-200 px-4 py-2" href="/popular">
            تصفح الأكثر رواجًا
          </Link>
        </div>
      </section>

      <section>
        <SectionHeader title="متداول الآن" description="مواضيع عالية الاهتمام مرتبة للتصفح السريع" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {home.trending.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="الأكثر رواجًا"
          description="أكثر الصفحات قراءة خلال الفترة الحالية"
          action={
            <Link href="/popular" className="text-sm font-bold text-sky-700 hover:underline">
              عرض الكل
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {home.popular.slice(0, 9).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="أحدث المقالات"
          description="تحديثات يومية عبر جميع الأقسام"
          action={
            <Link href="/latest" className="text-sm font-bold text-sky-700 hover:underline">
              عرض الكل
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {home.latest.slice(0, 9).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>

      <CategoryDirectory categories={home.categories} />
    </div>
  );
}
