import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { contentRepository } from "@/lib/repositories/content-repository";

export async function renderStaticPage(slug: string) {
  const page = await contentRepository.getStaticPage(slug);
  if (!page) notFound();

  return {
    metadata: buildMetadata({
      title: page.title,
      description: page.description,
      path: `/${slug}`,
    }),
    node: (
      <div className="space-y-6">
        <Breadcrumbs items={[{ href: "/", label: "الرئيسية" }, { label: page.title }]} />
        <article className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <h1 className="text-3xl font-black text-slate-900">{page.title}</h1>
          <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">{page.body}</p>
        </article>
      </div>
    ),
  };
}
