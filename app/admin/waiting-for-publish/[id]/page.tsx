"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Job = {
  id: string;
  title: string;
  keyword: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  content: string;
  faqs: { question: string; answer: string }[];
  status: string;
  sourceType: string;
  aiModelUsed: string;
  targetCountry: string;
  targetLanguage: string;
  competitorAnalysis: Record<string, unknown>;
  schemaJson: Record<string, unknown>;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: 'DRAFT',              label: 'مسودة' },
  { value: 'WAITING_REVIEW',    label: 'بانتظار المراجعة' },
  { value: 'NEEDS_MODIFICATION',label: 'يحتاج تعديل' },
  { value: 'APPROVED',          label: 'معتمد' },
  { value: 'PUBLISHED',         label: 'منشور' },
];

export default function JobReviewPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [job, setJob]       = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  // editable fields
  const [title, setTitle]             = useState('');
  const [seoTitle, setSeoTitle]       = useState('');
  const [metaDesc, setMetaDesc]       = useState('');
  const [slug, setSlug]               = useState('');
  const [content, setContent]         = useState('');
  const [status, setStatus]           = useState('WAITING_REVIEW');

  useEffect(() => {
    fetch(`/api/admin/generation-jobs/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.job) {
          const j = data.job;
          setJob(j);
          setTitle(j.title || '');
          setSeoTitle(j.seoTitle || '');
          setMetaDesc(j.metaDescription || '');
          setSlug(j.slug || '');
          setContent(j.content || '');
          setStatus(j.status || 'WAITING_REVIEW');
        }
      })
      .catch(() => setError('فشل جلب المقالة'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await fetch(`/api/admin/generation-jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, seoTitle, metaDescription: metaDesc, slug, content, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'فشل الحفظ');
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكد من حذف هذه المقالة؟')) return;
    await fetch(`/api/admin/generation-jobs/${id}`, { method: 'DELETE' });
    router.push('/admin/waiting-for-publish');
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(content);
    alert('تم نسخ المقالة كـ Markdown!');
  }

  if (loading) return <div className="p-8 text-center text-slate-500">جار التحميل...</div>;
  if (!job)    return <div className="p-8 text-center text-red-500">{error || 'لم يتم العثور على المقالة'}</div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-900">مراجعة المقالة</h1>
          <p className="text-slate-400 text-sm mt-1">
            {job.sourceType === 'KEYWORD' ? '🔑 من كلمة مفتاحية' : '🔗 إعادة صياغة'} •
            {job.aiModelUsed} • {job.targetCountry} • {new Date(job.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyMarkdown} className="px-4 py-2 border rounded font-bold text-sm hover:bg-slate-50">📋 نسخ Markdown</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded font-bold text-sm hover:bg-red-100">🗑 حذف</button>
        </div>
      </div>

      {saved  && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm">✅ تم الحفظ بنجاح!</div>}
      {error  && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

      {/* Status */}
      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border">
        <label className="text-sm font-bold">الحالة:</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border p-2 rounded text-sm font-bold">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={handleSave} disabled={saving} className="mr-auto bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? '⏳ حفظ...' : '💾 حفظ التعديلات'}
        </button>
      </div>

      {/* SEO Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">SEO Title ({seoTitle.length}/60)</label>
          <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
            className={`w-full border p-2 rounded text-sm ${seoTitle.length > 60 ? 'border-red-400' : ''}`} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full border p-2 rounded text-sm font-mono" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1">Meta Description ({metaDesc.length}/150)</label>
          <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} rows={2}
            className={`w-full border p-2 rounded text-sm ${metaDesc.length > 150 ? 'border-red-400' : ''}`} />
        </div>
      </div>

      {/* Article content */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">محتوى المقالة (Markdown)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={25}
          className="w-full border p-3 rounded text-sm font-mono leading-relaxed focus:ring-2 focus:ring-blue-200 outline-none"
        />
      </div>

      {/* FAQ Preview */}
      {Array.isArray(job.faqs) && job.faqs.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-800 mb-3">📋 الأسئلة الشائعة (FAQ)</h3>
          <div className="space-y-3">
            {job.faqs.map((faq, i) => (
              <div key={i} className="bg-slate-50 p-3 rounded">
                <p className="font-semibold text-sm">{faq.question}</p>
                <p className="text-sm text-slate-600 mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schema */}
      {job.schemaJson && (
        <div className="border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-800 mb-2">🔧 Schema Markup (JSON-LD)</h3>
          <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto max-h-48">{JSON.stringify(job.schemaJson, null, 2)}</pre>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50">
        {saving ? '⏳ جار الحفظ...' : '💾 حفظ جميع التعديلات'}
      </button>
    </div>
  );
}
