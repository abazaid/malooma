import Link from "next/link";

export function Pagination({
  basePath,
  page,
  totalPages,
  query,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  query?: Record<string, string | number | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildLink = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === "") continue;
        params.set(key, String(value));
      }
    }
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav aria-label="التنقل بين الصفحات" className="mt-8 flex items-center justify-center gap-2 text-sm">
      {page > 1 ? (
        <Link className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50" href={buildLink(page - 1)}>
          السابق
        </Link>
      ) : null}
      <span className="rounded bg-slate-900 px-3 py-1.5 font-semibold text-white">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-50" href={buildLink(page + 1)}>
          التالي
        </Link>
      ) : null}
    </nav>
  );
}
