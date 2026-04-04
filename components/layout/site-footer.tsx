import Link from "next/link";

const footerLinks = [
  { href: "/contact", label: "اتصل بنا" },
  { href: "/terms", label: "اتفاقية الاستخدام" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/about", label: "عن المنصة" },
  { href: "/about-us", label: "About Us" },
  { href: "/team", label: "فريق التحرير" },
  { href: "/sitemap-html", label: "خريطة الموقع" },
];

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 md:px-6">
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">روابط مهمة</h2>
          <ul className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            {footerLinks.map((item) => (
              <li key={item.href}>
                <Link className="hover:text-slate-900 hover:underline" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">تابعنا</h2>
          <ul className="mb-5 flex items-center gap-3 text-sm font-semibold text-slate-700">
            <li>
              <a className="rounded border border-slate-300 bg-white px-3 py-1.5" href="https://www.facebook.com" rel="noreferrer" target="_blank">
                Facebook
              </a>
            </li>
            <li>
              <a className="rounded border border-slate-300 bg-white px-3 py-1.5" href="https://x.com" rel="noreferrer" target="_blank">
                X
              </a>
            </li>
            <li>
              <a className="rounded border border-slate-300 bg-white px-3 py-1.5" href="https://instagram.com" rel="noreferrer" target="_blank">
                Instagram
              </a>
            </li>
          </ul>
          <p className="text-sm text-slate-600">جميع الحقوق محفوظة © {new Date().getFullYear()} معلومة</p>
        </section>
      </div>
    </footer>
  );
}

