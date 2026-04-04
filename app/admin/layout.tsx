import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "لوحة المعلومات" },
  { href: "/admin/pipeline", label: "مراقبة الأتمتة" },
  { href: "/admin/categories", label: "الأقسام" },
  { href: "/admin/articles", label: "المقالات" },
  { href: "/admin/static-pages", label: "الصفحات الثابتة" },
  { href: "/admin/trending", label: "الترند والأكثر رواجًا" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
        <h1 className="mb-3 text-xl font-black text-slate-900">لوحة التحكم</h1>
        <ul className="space-y-2">
          {adminLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="block rounded border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <section>{children}</section>
    </div>
  );
}
