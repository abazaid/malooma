"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type GenerationJob = {
  id: string;
  title: string | null;
  keyword: string;
  sourceType: string;
  targetCountry: string;
  targetLanguage: string;
  aiModelUsed: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT:             { label: 'مسودة',              color: 'bg-slate-100 text-slate-700' },
  WAITING_REVIEW:    { label: 'بانتظار المراجعة',   color: 'bg-yellow-100 text-yellow-800' },
  NEEDS_MODIFICATION:{ label: 'يحتاج تعديل',         color: 'bg-orange-100 text-orange-800' },
  APPROVED:          { label: 'معتمد',              color: 'bg-green-100 text-green-800' },
  PUBLISHED:         { label: 'منشور',              color: 'bg-blue-100 text-blue-800' },
};

export default function WaitingForPublishPage() {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/generation-jobs')
      .then(r => r.json())
      .then(data => {
        if (data.jobs) setJobs(data.jobs);
        else setError(data.error || 'خطأ غير معروف');
      })
      .catch(() => setError('تعذّر الاتصال بالخادم'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-900">بانتظار النشر</h1>
        <Link href="/admin/generator" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
          + توليد مقال جديد
        </Link>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-500">جار التحميل...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 text-sm font-bold text-slate-600">العنوان</th>
                <th className="p-3 text-sm font-bold text-slate-600">الكلمة المفتاحية</th>
                <th className="p-3 text-sm font-bold text-slate-600">المصدر</th>
                <th className="p-3 text-sm font-bold text-slate-600">الحالة</th>
                <th className="p-3 text-sm font-bold text-slate-600">النموذج</th>
                <th className="p-3 text-sm font-bold text-slate-600">تاريخ الإنشاء</th>
                <th className="p-3 text-sm font-bold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    لا توجد مقالات بعد — اذهب إلى صفحة التوليد لبدء العمل.
                  </td>
                </tr>
              ) : (
                jobs.map(job => {
                  const st = STATUS_LABELS[job.status] ?? { label: job.status, color: 'bg-slate-100 text-slate-700' };
                  return (
                    <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm font-semibold">{job.title ?? 'قيد المعالجة...'}</td>
                      <td className="p-3 text-sm">{job.keyword}</td>
                      <td className="p-3 text-sm">{job.sourceType === 'KEYWORD' ? 'كلمة مفتاحية' : 'رابط (URL)'}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="p-3 text-sm text-slate-500">{job.aiModelUsed}</td>
                      <td className="p-3 text-sm text-slate-500">
                        {new Date(job.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-3 text-sm flex gap-2">
                        <Link href={`/admin/waiting-for-publish/${job.id}`} className="text-blue-600 hover:underline font-bold">مراجعة</Link>
                        <button className="text-red-600 hover:underline font-bold">حذف</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
