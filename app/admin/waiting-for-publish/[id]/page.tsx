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

type Category = { id: string; name: string; level: number; parentId: string | null };

const STATUS_OPTIONS = [
  { value: 'DRAFT',               label: 'مسودة' },
  { value: 'WAITING_REVIEW',     label: 'بانتظار المراجعة' },
  { value: 'NEEDS_MODIFICATION', label: 'يحتاج تعديل' },
  { value: 'APPROVED',           label: 'معتمد' },
  { value: 'PUBLISHED',          label: 'منشور' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT:               'bg-slate-100 text-slate-700',
  WAITING_REVIEW:     'bg-yellow-100 text-yellow-800',
  NEEDS_MODIFICATION: 'bg-orange-100 text-orange-800',
  APPROVED:           'bg-green-100 text-green-800',
  PUBLISHED:          'bg-blue-100 text-blue-800',
};

export default function JobReviewPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [job,  setJob]    = useState<Job | null>(null);
  const [loading, setL]   = useState(true);
  const [saving,  setSv]  = useState(false);
  const [error,   setErr] = useState('');
  const [saved,   setSvd] = useState(false);

  // Editable fields
  const [title,    setTitle]   = useState('');
  const [seoTitle, setSeo]     = useState('');
  const [metaDesc, setMeta]    = useState('');
  const [slug,     setSlug]    = useState('');
  const [content,  setContent] = useState('');
  const [status,   setStatus]  = useState('WAITING_REVIEW');

  // Publish modal
  const [showPublish,   setShowPublish]  = useState(false);
  const [categories,    setCategories]   = useState<Category[]>([]);
  const [categoryId,    setCategoryId]   = useState('');
  const [publishing,    setPublishing]   = useState(false);
  const [publishError,  setPublishError] = useState('');

  // Load job
  useEffect(() => {
    fetch(`/api/admin/generation-jobs/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.job) {
          const j = d.job;
          setJob(j);
          setTitle(j.title || '');
          setSeo(j.seoTitle || '');
          setMeta(j.metaDescription || '');
          setSlug(j.slug || '');
          setContent(j.content || '');
          setStatus(j.status || 'WAITING_REVIEW');
        }
      })
      .catch(() => setErr('فشل جلب المقالة'))
      .finally(() => setL(false));
  }, [id]);

  // Load categories when publish modal opens
  useEffect(() => {
    if (!showPublish || categories.length > 0) return;
    fetch('/api/admin/categories-list')
      .then(r => r.json())
      .then(d => {
        setCategories(d.categories || []);
        if (d.categories?.length > 0) setCategoryId(d.categories[0].id);
      });
  }, [showPublish, categories.length]);

  async function handleSave() {
    setSv(true); setSvd(false); setErr('');
    try {
      const res  = await fetch(`/api/admin/generation-jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, seoTitle, metaDescription: metaDesc, slug, content, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'فشل الحفظ');
      setSvd(true);
    } catch (e) { setErr((e as Error).message); }
    finally { setSv(false); }
  }

  async function handlePublish() {
    if (!categoryId) { setPublishError('اختر قسماً أولاً'); return; }
    setPublishing(true); setPublishError('');
    try {
      const res  = await fetch(`/api/admin/generation-jobs/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'فشل النشر');
      router.push(`/articles/${data.slug}`);
    } catch (e) { setPublishError((e as Error).message); }
    finally { setPublishing(false); }
  }

  async function handleDelete() {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    await fetch(`/api/admin/generation-jobs/${id}`, { method: 'DELETE' });
    router.push('/admin/waiting-for-publish');
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(content);
    alert('تم نسخ المقالة كـ Markdown!');
  }

  if (loading) return <div className="p-10 text-center text-slate-400">جار التحميل...</div>;
  if (!job)    return <div className="p-10 text-center text-red-500">{error || 'المقالة غير موجودة'}</div>;

  const statusStyle = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700';
  const isPublished = job.status === 'PUBLISHED';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">مراجعة المقالة</h1>
          <p className="text-slate-400 text-sm mt-1">
            {job.sourceType === 'KEYWORD' ? '🔑 كلمة مفتاحية' : '🔗 إعادة صياغة'} •
            {' '}{job.aiModelUsed} • {job.targetCountry} •
            {' '}{new Date(job.createdAt).toLocaleDateString('ar-SA')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyMarkdown}   className="px-3 py-2 border rounded text-sm font-bold hover:bg-slate-50">📋 نسخ MD</button>
          {!isPublished && (
            <button
              onClick={() => setShowPublish(true)}
              className="px-4 py-2 bg-green-600 text-white rounded font-bold text-sm hover:bg-green-700"
            >
              🚀 نشر على الموقع
            </button>
          )}
          {isPublished && (
            <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded font-bold text-sm">✅ منشور</span>
          )}
          <button onClick={handleDelete}   className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded font-bold text-sm hover:bg-red-100">🗑 حذف</button>
        </div>
      </div>

      {saved  && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm">✅ تم الحفظ!</div>}
      {error  && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

      {/* Status bar */}
      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border flex-wrap">
        <label className="text-sm font-bold">الحالة:</label>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle}`}>
          {STATUS_OPTIONS.find(o => o.value === status)?.label || status}
        </span>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border p-1.5 rounded text-sm"
          disabled={isPublished}
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={handleSave}
          disabled={saving || isPublished}
          className="mr-auto bg-blue-600 text-white font-bold px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {saving ? '⏳...' : '💾 حفظ'}
        </button>
      </div>

      {/* SEO fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            SEO Title <span className={seoTitle.length > 60 ? 'text-red-500' : 'text-slate-400'}>({seoTitle.length}/60)</span>
          </label>
          <input value={seoTitle} onChange={e => setSeo(e.target.value)}
            className={`w-full border p-2 rounded text-sm ${seoTitle.length > 60 ? 'border-red-400 bg-red-50' : ''}`}
            disabled={isPublished} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            className="w-full border p-2 rounded text-sm font-mono" disabled={isPublished} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Meta Description <span className={metaDesc.length > 150 ? 'text-red-500' : 'text-slate-400'}>({metaDesc.length}/150)</span>
          </label>
          <textarea value={metaDesc} onChange={e => setMeta(e.target.value)} rows={2}
            className={`w-full border p-2 rounded text-sm ${metaDesc.length > 150 ? 'border-red-400 bg-red-50' : ''}`}
            disabled={isPublished} />
        </div>
      </div>

      {/* Article content */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">محتوى المقالة (Markdown)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={28}
          disabled={isPublished}
          className="w-full border p-3 rounded text-sm font-mono leading-relaxed focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-slate-50"
        />
      </div>

      {/* FAQ preview */}
      {Array.isArray(job.faqs) && job.faqs.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-800 mb-3">📋 الأسئلة الشائعة</h3>
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
      {job.schemaJson && Object.keys(job.schemaJson).length > 0 && (
        <div className="border border-slate-200 rounded-xl p-5">
          <h3 className="font-bold text-slate-800 mb-2">🔧 Schema Markup (JSON-LD)</h3>
          <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto max-h-40">{JSON.stringify(job.schemaJson, null, 2)}</pre>
        </div>
      )}

      {!isPublished && (
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50">
          {saving ? '⏳ جار الحفظ...' : '💾 حفظ جميع التعديلات'}
        </button>
      )}

      {/* ── Publish Modal ───────────────────────────────────────────── */}
      {showPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-xl font-black text-slate-900">🚀 نشر المقالة على الموقع</h2>
            <p className="text-slate-500 text-sm">
              سيتم إنشاء مقالة جديدة في قاعدة البيانات وستظهر فوراً على موقع malooma.org
            </p>

            {publishError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{publishError}</div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">اختر القسم المناسب *</label>
              {categories.length === 0 ? (
                <p className="text-slate-400 text-sm">جار تحميل الأقسام...</p>
              ) : (
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full border p-3 rounded text-sm focus:ring-2 focus:ring-green-300 outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.level === 1 ? '' : '  └ '}{c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded text-xs">
              <strong>تنبيه:</strong> بعد النشر لن تتمكن من تعديل المقالة من هذه الصفحة.
              يمكنك تعديلها من لوحة المقالات.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPublish(false); setPublishError(''); }}
                className="flex-1 border py-2.5 rounded font-bold text-sm hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !categoryId}
                className="flex-1 bg-green-600 text-white py-2.5 rounded font-bold text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {publishing ? '⏳ جار النشر...' : '✅ تأكيد النشر'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
