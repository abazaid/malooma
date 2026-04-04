import Link from "next/link";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";

export const metadata = buildMetadata({
  title: "فريق التحرير",
  description: "تعرف على الكتّاب والمدققين المشرفين على جودة المحتوى.",
  path: "/team",
});

export default async function TeamPage() {
  const authors = await contentRepository.getAuthors();

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: "فريق التحرير" }]} />
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-black text-slate-900">فريق التحرير</h1>
        <p className="mt-2 text-sm text-slate-700">فريق متعدد الاختصاصات يعمل على إعداد وتحرير وتدقيق المحتوى.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {authors.map((author) => (
          <article key={author.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold text-slate-900">{author.name}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">{author.bio}</p>
            <Link href={`/authors/${author.slug}`} className="mt-4 inline-block text-sm font-bold text-sky-700 hover:underline">
              عرض صفحة الكاتب
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
