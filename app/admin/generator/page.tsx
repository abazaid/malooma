"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: 'SA', name: 'السعودية' },
  { code: 'AE', name: 'الإمارات' },
  { code: 'EG', name: 'مصر' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
];

const MODELS = ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'gpt-4-turbo'];
const INTENTS = ['informational', 'commercial', 'navigational', 'transactional'];

export default function GeneratorPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'keyword' | 'url'>('keyword');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Keyword form
  const [keyword, setKeyword]       = useState('');
  const [country, setCountry]       = useState('SA');
  const [language, setLanguage]     = useState('ar');
  const [intent, setIntent]         = useState('informational');
  const [model, setModel]           = useState('gpt-4o');
  const [articleType, setArticleType] = useState('informational');

  // URL form
  const [sourceUrl, setSourceUrl]   = useState('');
  const [urlKeyword, setUrlKeyword] = useState('');

  async function handleKeywordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/generate/keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, targetCountry: country, targetLanguage: language, searchIntent: intent, articleType, aiModel: model }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'فشل التوليد');
      router.push(`/admin/waiting-for-publish/${data.jobId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceUrl.trim() || !urlKeyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/generate/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl, keyword: urlKeyword, targetCountry: country, targetLanguage: language, aiModel: model }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'فشل التوليد');
      router.push(`/admin/waiting-for-publish/${data.jobId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h1 className="text-2xl font-black text-slate-900 mb-2">توليد المقالات (AI Article Generator)</h1>
      <p className="text-slate-500 mb-6 text-sm">تحليل المنافسين عبر DataForSEO + كتابة مقال SEO/GEO/AIO بالذكاء الاصطناعي</p>

      {/* Tabs */}
      <div className="flex space-x-4 space-x-reverse mb-6 border-b">
        {(['keyword', 'url'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'keyword' ? '🔑 من كلمة مفتاحية' : '🔗 إعادة صياغة (URL)'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>
      )}

      {/* Shared settings */}
      <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="block text-xs font-bold mb-1 text-slate-600">الدولة</label>
          <select value={country} onChange={e => setCountry(e.target.value)} className="w-full border p-2 rounded text-sm">
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-slate-600">اللغة</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full border p-2 rounded text-sm">
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1 text-slate-600">نموذج الـ AI</label>
          <select value={model} onChange={e => setModel(e.target.value)} className="w-full border p-2 rounded text-sm">
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="max-w-3xl">
        {activeTab === 'keyword' ? (
          <form onSubmit={handleKeywordSubmit} className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <label className="block text-sm font-bold mb-1">الكلمة المفتاحية الرئيسية *</label>
              <input
                required
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="مثال: فوائد الزنجبيل للصحة"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-300 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">نية البحث</label>
                <select value={intent} onChange={e => setIntent(e.target.value)} className="w-full border p-2 rounded">
                  {INTENTS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">نوع المقال</label>
                <select value={articleType} onChange={e => setArticleType(e.target.value)} className="w-full border p-2 rounded">
                  <option value="informational">معلوماتي</option>
                  <option value="listicle">قائمة</option>
                  <option value="how-to">كيفية</option>
                  <option value="comparison">مقارنة</option>
                  <option value="review">مراجعة</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ جار التحليل والتوليد (قد يستغرق دقيقة)...' : '🚀 بدء التحليل والتوليد'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUrlSubmit} className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <label className="block text-sm font-bold mb-1">رابط المقال المنافس *</label>
              <input
                required
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">الكلمة المفتاحية المستهدفة *</label>
              <input
                required
                type="text"
                value={urlKeyword}
                onChange={e => setUrlKeyword(e.target.value)}
                placeholder="مثال: أفضل لابتوب للطلاب"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-green-300 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ جار القراءة والإعادة (قد يستغرق دقيقة)...' : '✍️ قراءة الرابط وإعادة الصياغة'}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
        <strong>⚠️ تنبيه:</strong> لن يتم النشر مباشرة. ستُرسل المقالة إلى لوحة &quot;بانتظار النشر&quot; لمراجعتها وتعديلها قبل النشر.
      </div>
    </div>
  );
}
