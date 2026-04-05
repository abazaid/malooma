import Link from "next/link";
import type { ArticleModel } from "@/lib/types";

function parseMarkdownLinks(content: string) {
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines
    .map((line) => line.match(/\[([^\]]+)\]\(([^)]+)\)/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ label: m[1], href: m[2] }));
}

function renderBlock(section: ArticleModel["sections"][number]) {
  switch (section.blockType) {
    case "heading":
      return <h2 className="mt-8 text-2xl font-bold text-slate-900">{section.heading}</h2>;
    case "list":
      return (
        <ul className="my-4 list-disc space-y-2 pr-5 text-base leading-8 text-slate-700">
          {section.content
            .split("\n")
            .map((line) => line.replace(/^-\s*/, "").trim())
            .filter(Boolean)
            .map((line, idx) => (
              <li key={`${section.id}-${idx}`}>{line}</li>
            ))}
        </ul>
      );
    case "note":
      return (
        <aside className="my-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">{section.heading}</p>
          <p className="mt-1 text-sm leading-7 text-amber-900/90">{section.content}</p>
        </aside>
      );
    case "quote":
      return (
        <blockquote className="my-5 border-r-4 border-slate-300 pr-4 text-lg leading-8 text-slate-700">
          {section.content}
        </blockquote>
      );
    case "table": {
      const payload = section.payload as { headers?: string[]; rows?: string[][] } | undefined;
      return (
        <div className="my-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-right text-sm">
            <thead className="bg-slate-100">
              <tr>
                {payload?.headers?.map((header) => (
                  <th key={header} className="border border-slate-200 px-3 py-2 font-bold text-slate-800">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload?.rows?.map((row, rowIndex) => (
                <tr key={`${section.id}-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${section.id}-cell-${cellIndex}`} className="border border-slate-200 px-3 py-2 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case "related_articles": {
      const links = parseMarkdownLinks(section.content);
      if (links.length === 0) return null;
      return (
        <section className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-base font-bold text-slate-900">{section.heading || "مقالات مرتبطة"}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {links.map((link) => (
              <li key={`${section.id}-${link.href}`}>
                <Link href={link.href} className="block rounded border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-100">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      );
    }
    default:
      return (
        <section className="my-4">
          {section.heading ? <h2 className="mb-2 text-2xl font-bold text-slate-900">{section.heading}</h2> : null}
          <p className="text-base leading-8 text-slate-700">{section.content}</p>
        </section>
      );
  }
}

export function ArticleBody({ article }: { article: ArticleModel }) {
  return (
    <>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
        <p className="text-sm font-bold">ملخص سريع</p>
        <p className="mt-1 text-sm leading-7">{article.excerpt}</p>
      </div>

      <section className="my-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-bold text-slate-900">محتويات المقال</h2>
        <ol className="list-decimal space-y-1 pr-5 text-sm text-slate-700">
          {article.sections
            .filter((section) => section.heading)
            .map((section) => (
              <li key={`toc-${section.id}`}>
                <a href={`#${section.id}`} className="hover:text-slate-900 hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
        </ol>
      </section>

      <div className="prose prose-slate max-w-none prose-p:leading-8">
        {article.sections.map((section) => (
          <div id={section.id} key={section.id}>
            {renderBlock(section)}
          </div>
        ))}
      </div>

      <section className="my-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900">أسئلة شائعة</h2>
        <div className="space-y-3">
          {article.faqs.map((faq) => (
            <details key={faq.question} className="rounded border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer font-semibold text-slate-800">{faq.question}</summary>
              <p className="mt-2 text-sm leading-7 text-slate-700">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="my-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900">المصادر</h2>
        <ul className="list-disc space-y-2 pr-5 text-sm text-slate-700">
          {article.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} className="text-sky-700 hover:underline" rel="noreferrer" target="_blank">
                {source.title}
              </a>
              {source.publisher ? <span> - {source.publisher}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="my-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-bold text-slate-900">مواضيع ذات صلة</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {article.relatedArticles.map((related) => (
            <li key={related.slug}>
              <Link href={`/articles/${related.slug}`} className="block overflow-hidden rounded border border-slate-200 hover:bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={related.heroImage} alt={related.title} loading="lazy" className="h-24 w-full object-cover" />
                <div className="px-3 py-2 text-sm">{related.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
