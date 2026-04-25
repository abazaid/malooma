import React from 'react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function WaitingForPublishPage() {
  // Try to fetch jobs safely in case the DB is not fully synced yet
  let jobs = [];
  try {
    jobs = await prisma.generationJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error("Schema not synced yet", error);
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black text-slate-900">بانتظار النشر (Waiting for Publish)</h1>
        <Link href="/admin/generator" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">
          + توليد مقال جديد
        </Link>
      </div>

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
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  لا توجد مقالات بانتظار المراجعة. اذهب إلى صفحة التوليد لبدء العمل.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 text-sm font-semibold">{job.title || 'قيد المعالجة...'}</td>
                  <td className="p-3 text-sm">{job.keyword}</td>
                  <td className="p-3 text-sm">{job.sourceType === 'KEYWORD' ? 'كلمة مفتاحية' : 'رابط (URL)'}</td>
                  <td className="p-3 text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-bold">
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-slate-500">{job.aiModelUsed}</td>
                  <td className="p-3 text-sm text-slate-500">{new Date(job.createdAt).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3 text-sm flex gap-2">
                    <Link href={`/admin/waiting-for-publish/${job.id}`} className="text-blue-600 hover:underline font-bold">
                      مراجعة
                    </Link>
                    <button className="text-red-600 hover:underline font-bold">حذف</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
