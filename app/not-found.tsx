import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p className="text-sm font-semibold text-slate-500">404</p>
      <h1 className="mt-2 text-3xl font-black text-slate-900">الصفحة غير موجودة</h1>
      <p className="mt-3 text-sm leading-7 text-slate-700">قد يكون الرابط غير صحيح أو تم نقل الصفحة. يمكنك العودة للرئيسية أو تصفح الأقسام.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white">
          العودة للرئيسية
        </Link>
        <Link href="/sitemap-html" className="rounded border border-slate-300 px-4 py-2 text-sm font-bold">
          خريطة الموقع
        </Link>
      </div>
    </div>
  );
}
