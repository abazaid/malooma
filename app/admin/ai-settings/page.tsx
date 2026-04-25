"use client";
import React, { useEffect, useState } from 'react';

export default function AISettingsPage() {
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    openai_api_key:      '',
    openai_model:        'gpt-4o',
    dataforseo_login:    '',
    dataforseo_password: '',
    default_country:     'SA',
    default_language:    'ar',
  });

  useEffect(() => {
    fetch('/api/admin/ai-settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setForm(prev => ({ ...prev, ...data.settings }));
        }
      });
  }, []);

  function set(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h1 className="text-2xl font-black text-slate-900 mb-2">إعدادات الذكاء الاصطناعي</h1>
      <p className="text-slate-500 text-sm mb-6">تُحفظ الإعدادات بشكل آمن في قاعدة البيانات وتُستخدم في جميع عمليات التوليد.</p>

      {saved && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded text-sm">✅ تم الحفظ بنجاح!</div>}
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">{error}</div>}

      <form onSubmit={handleSave} className="max-w-2xl space-y-8">
        {/* OpenAI */}
        <section className="space-y-4 border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">🤖 إعدادات OpenAI</h2>
          <div>
            <label className="block text-sm font-semibold mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={form.openai_api_key}
              onChange={e => set('openai_api_key', e.target.value)}
              placeholder="sk-..."
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none font-mono text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">تحصل عليه من platform.openai.com</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">النموذج الافتراضي</label>
            <select value={form.openai_model} onChange={e => set('openai_model', e.target.value)} className="w-full border p-2 rounded">
              <option value="gpt-4o">GPT-4o (موصى به)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (أسرع وأرخص)</option>
              <option value="o1-preview">o1-Preview (تفكير متقدم)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
        </section>

        {/* DataForSEO */}
        <section className="space-y-4 border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">📊 إعدادات DataForSEO</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">البريد الإلكتروني / Login</label>
              <input
                type="email"
                value={form.dataforseo_login}
                onChange={e => set('dataforseo_login', e.target.value)}
                placeholder="user@example.com"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">كلمة المرور / API Key</label>
              <input
                type="password"
                value={form.dataforseo_password}
                onChange={e => set('dataforseo_password', e.target.value)}
                placeholder="********"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">تحصل عليهما من app.dataforseo.com — تُستخدم لتحليل نتائج Google</p>
        </section>

        {/* Default GEO */}
        <section className="space-y-4 border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">🌍 إعدادات الدولة واللغة الافتراضية</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">الدولة الافتراضية</label>
              <select value={form.default_country} onChange={e => set('default_country', e.target.value)} className="w-full border p-2 rounded">
                <option value="SA">السعودية (SA)</option>
                <option value="AE">الإمارات (AE)</option>
                <option value="EG">مصر (EG)</option>
                <option value="US">الولايات المتحدة (US)</option>
                <option value="GB">المملكة المتحدة (GB)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">اللغة الافتراضية</label>
              <select value={form.default_language} onChange={e => set('default_language', e.target.value)} className="w-full border p-2 rounded">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '⏳ جار الحفظ...' : '💾 حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
}
