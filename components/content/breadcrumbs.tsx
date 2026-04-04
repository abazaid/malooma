import Link from "next/link";

type Crumb = {
  href?: string;
  label: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسار التنقل" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-600 md:text-sm">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href ? (
              <Link className="hover:text-slate-900 hover:underline" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800">{item.label}</span>
            )}
            {index < items.length - 1 ? <span>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
