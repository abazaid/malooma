import Link from "next/link";
import { Prisma } from "@prisma/client";
import {
  addTopicToQueueAction,
  importAllReferenceTopicsAction,
  publishDueNowAction,
  runPipelineNowAction,
} from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  QUEUED: "bg-amber-50 text-amber-800 border-amber-200",
  CLEANED: "bg-sky-50 text-sky-800 border-sky-200",
  OUTLINED: "bg-indigo-50 text-indigo-800 border-indigo-200",
  WRITTEN: "bg-violet-50 text-violet-800 border-violet-200",
  SCHEDULED: "bg-cyan-50 text-cyan-800 border-cyan-200",
  PUBLISHED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  SKIPPED: "bg-rose-50 text-rose-800 border-rose-200",
  REJECTED: "bg-red-50 text-red-800 border-red-200",
};

function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function badgeClass(status: string) {
  return STATUS_STYLES[status] ?? "bg-slate-50 text-slate-700 border-slate-200";
}

export default async function AdminPipelinePage() {
  type RecentTopic = Prisma.TopicQueueGetPayload<{
    include: {
      article: { select: { id: true; slug: true; status: true; publishedAt: true } };
      mainCategory: { select: { name: true } };
      subCategory: { select: { name: true } };
    };
  }>;
  type RecentEvent = Prisma.PipelineEventGetPayload<{
    include: {
      topic: { select: { rawTitle: true } };
      article: { select: { slug: true } };
    };
  }>;
  type RecentJob = Prisma.PublishingJobGetPayload<Record<string, never>>;

  let topicCounts: Array<{ status: string; _count: { _all: number } }> = [];
  let recentTopics: RecentTopic[] = [];
  let recentEvents: RecentEvent[] = [];
  let jobs: RecentJob[] = [];
  let dbError = "";

  try {
    [topicCounts, recentTopics, recentEvents, jobs] = await Promise.all([
      prisma.topicQueue.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.topicQueue.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
        include: {
          article: { select: { id: true, slug: true, status: true, publishedAt: true } },
          mainCategory: { select: { name: true } },
          subCategory: { select: { name: true } },
        },
      }),
      prisma.pipelineEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
        include: {
          topic: { select: { rawTitle: true } },
          article: { select: { slug: true } },
        },
      }),
      prisma.publishingJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);
  } catch {
    dbError = "تعذر الاتصال بقاعدة البيانات. تأكد من DATABASE_URL وتطبيق prisma db push.";
  }

  const countMap = new Map(topicCounts.map((item) => [item.status, item._count._all]));
  const lastPipelineRun = recentEvents.find((event) => event.stage === "PIPELINE_RUN_COMPLETED");
  const isHealthy = Boolean(lastPipelineRun);
  const topicStatuses = ["QUEUED", "CLEANED", "WRITTEN", "SCHEDULED", "PUBLISHED", "SKIPPED", "REJECTED"] as const;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-black text-slate-900">مراقبة نظام إنتاج المحتوى</h2>
        <p className="mt-2 text-sm text-slate-700">عرض مباشر لحالة queue، وتتبع مراحل كل مقالة، وتشغيل يدوي للـ pipeline.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded border px-2 py-1 font-bold ${isHealthy ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
            حالة التشغيل اليومي: {isHealthy ? "نشط (آخر تشغيل خلال 36 ساعة)" : "يحتاج تحقق من Cron"}
          </span>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
            آخر تشغيل: {formatDate(lastPipelineRun?.createdAt)}
          </span>
        </div>
        {dbError ? <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{dbError}</p> : null}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {topicStatuses.map((status) => (
          <article key={status} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-500">{status}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{countMap.get(status) ?? 0}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <form action={addTopicToQueueAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">إضافة موضوع يدويًا</h3>
          <input
            name="title"
            required
            placeholder="اكتب عنوان الموضوع الجديد..."
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white">
            إضافة إلى Queue
          </button>
        </form>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-bold text-slate-900">تشغيل مباشر</h3>
          <p className="text-sm text-slate-700">استيراد جميع مواضيع المنافسين من `reference-data` وتشغيل النظام Cluster Mode (5 مقالات).</p>
          <div className="flex flex-wrap gap-2">
            <form action={importAllReferenceTopicsAction}>
              <button type="submit" className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                استيراد كل المواضيع من reference-data
              </button>
            </form>
            <form action={runPipelineNowAction}>
              <button type="submit" className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                تشغيل Pipeline الآن
              </button>
            </form>
            <form action={publishDueNowAction}>
              <button type="submit" className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                نشر المستحق الآن
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-lg font-bold text-slate-900">المواضيع وحالاتها</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2">الموضوع</th>
                <th className="px-2 py-2">الحالة</th>
                <th className="px-2 py-2">التصنيف</th>
                <th className="px-2 py-2">المقال</th>
                <th className="px-2 py-2">الإضافة</th>
                <th className="px-2 py-2">المعالجة</th>
              </tr>
            </thead>
            <tbody>
              {recentTopics.map((topic) => (
                <tr key={topic.id} className="border-b border-slate-100 align-top">
                  <td className="px-2 py-2 text-slate-800">{topic.rawTitle}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex rounded border px-2 py-1 text-xs font-bold ${badgeClass(topic.status)}`}>{topic.status}</span>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-700">
                    {topic.mainCategory?.name ?? "-"} / {topic.subCategory?.name ?? "-"}
                  </td>
                  <td className="px-2 py-2 text-xs">
                    {topic.article ? (
                      <Link href={`/articles/${topic.article.slug}`} className="text-sky-700 hover:underline">
                        {topic.article.slug}
                      </Link>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-600">{formatDate(topic.createdAt)}</td>
                  <td className="px-2 py-2 text-xs text-slate-600">{formatDate(topic.processedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-lg font-bold text-slate-900">سجل مراحل التنفيذ لكل مقالة</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2">الوقت</th>
                <th className="px-2 py-2">المرحلة</th>
                <th className="px-2 py-2">الحالة</th>
                <th className="px-2 py-2">الموضوع</th>
                <th className="px-2 py-2">المقال</th>
                <th className="px-2 py-2">ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((event) => (
                <tr key={event.id} className="border-b border-slate-100 align-top">
                  <td className="px-2 py-2 text-xs text-slate-600">{formatDate(event.createdAt)}</td>
                  <td className="px-2 py-2 text-xs font-semibold text-slate-900">{event.stage}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex rounded border px-2 py-1 text-xs font-bold ${badgeClass(event.status === "SUCCESS" ? "PUBLISHED" : event.status === "WARNING" ? "SKIPPED" : event.status === "ERROR" ? "REJECTED" : "CLEANED")}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-700">{event.topic?.rawTitle ?? "-"}</td>
                  <td className="px-2 py-2 text-xs text-slate-700">{event.article?.slug ?? "-"}</td>
                  <td className="px-2 py-2 text-xs text-slate-600">{event.message ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-3 text-lg font-bold text-slate-900">سجل وظائف الجدولة والنشر</h3>
        <ul className="space-y-2 text-sm">
          {jobs.map((job) => (
            <li key={job.id} className="rounded border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded border px-2 py-1 text-xs font-bold ${badgeClass(job.status === "DONE" ? "PUBLISHED" : job.status === "FAILED" ? "REJECTED" : "SCHEDULED")}`}>
                  {job.status}
                </span>
                <span className="text-slate-700">runAt: {formatDate(job.runAt)}</span>
                <span className="text-slate-700">batch: {job.batchSize}</span>
                <span className="text-slate-700">completed: {job.completedCount}</span>
              </div>
              {job.errorMessage ? <p className="mt-2 text-xs text-rose-700">{job.errorMessage}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
