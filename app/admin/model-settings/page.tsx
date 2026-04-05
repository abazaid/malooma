import { saveModelSettingsAction } from "@/app/admin/actions";
import { getModelSettings } from "@/lib/pipeline/model-settings";

export const dynamic = "force-dynamic";

export default async function AdminModelSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const notice = params.notice ? decodeURIComponent(params.notice) : "";
  const error = params.error ? decodeURIComponent(params.error) : "";
  const settings = await getModelSettings();

  return (
    <div className="space-y-5">
      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>
      ) : null}
      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</div> : null}

      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">إعدادات الموديل</h2>
        <p className="mt-2 text-sm text-slate-700">
          عدّل تعليمات النظام التي يلتزم بها الموديل أثناء التحليل والكتابة. يتم تطبيقها تلقائيًا على أي توليد مقالات جديد بعد الحفظ.
        </p>
      </header>

      <form action={saveModelSettingsAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <section className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">إعدادات عامة</h3>
          <p className="text-sm text-slate-600">طريقة العمل العامة للـ pipeline، العزل الموضوعي، الربط الداخلي، وسياسة الجودة.</p>
          <textarea
            name="generalSettings"
            defaultValue={settings.general}
            rows={14}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-7"
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">إعدادات المقالات</h3>
          <p className="text-sm text-slate-600">خطوات إنشاء المقال، نية البحث، الأسلوب، وقواعد SEO لكل مقال.</p>
          <textarea
            name="articleSettings"
            defaultValue={settings.article}
            rows={18}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-7"
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">تحسين المحتوى (Content Optimization Engine)</h3>
          <p className="text-sm text-slate-600">تعليمات تطوير المقالات القديمة ورفع أدائها وترتيبها بشكل دوري.</p>
          <textarea
            name="optimizationSettings"
            defaultValue={settings.optimization}
            rows={18}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm leading-7"
          />
        </section>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800">
            حفظ إعدادات الموديل
          </button>
        </div>
      </form>
    </div>
  );
}
