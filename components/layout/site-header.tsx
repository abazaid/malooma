import Link from "next/link";

const navItems = [
  { href: "/#categories", label: "التصنيفات" },
  { href: "/latest", label: "أجدد المقالات" },
  { href: "/popular", label: "الأكثر رواجًا" },
  { href: "/editorial-standards", label: "معايير التدقيق" },
  { href: "/about", label: "عن المنصة" },
  { href: "/contact", label: "اتصل بنا" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="text-xl font-black text-slate-900">
          معلومة
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
          <ul className="flex items-center gap-4 text-sm font-semibold text-slate-700">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link className="rounded px-2 py-1 hover:bg-slate-100 hover:text-slate-900" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/search"
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
        >
          بحث
        </Link>
      </div>

      <nav className="border-t border-slate-100 bg-slate-50 lg:hidden" aria-label="التنقل للجوال">
        <ul className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 text-xs font-semibold text-slate-700 md:px-6">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link className="whitespace-nowrap rounded border border-slate-200 bg-white px-3 py-1.5" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

