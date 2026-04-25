import React from 'react';

export default function AISettingsPage() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h1 className="text-2xl font-black text-slate-900 mb-6">إعدادات الذكاء الاصطناعي (API Keys)</h1>
      
      <form className="max-w-2xl space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">1. إعدادات OpenAI</h2>
          <div>
            <label className="block text-sm font-semibold mb-2">OpenAI API Key</label>
            <input type="password" placeholder="sk-..." className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">النموذج الافتراضي (Model)</label>
            <select className="w-full border p-2 rounded">
              <option value="gpt-4o">GPT-4o (Recommended)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Fast/Cheap)</option>
              <option value="o1-preview">o1-Preview (Advanced Reasoning)</option>
            </select>
          </div>
        </div>

        <hr className="my-6" />

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">2. إعدادات DataForSEO</h2>
          <div>
            <label className="block text-sm font-semibold mb-2">Login / Email</label>
            <input type="text" placeholder="user@example.com" className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Password / API Key</label>
            <input type="password" placeholder="********" className="w-full border p-2 rounded" />
          </div>
        </div>

        <hr className="my-6" />

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">3. إعدادات اللغة والدولة (GEO)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">الدولة الافتراضية</label>
              <select className="w-full border p-2 rounded">
                <option value="SA">Saudi Arabia (SA)</option>
                <option value="AE">United Arab Emirates (AE)</option>
                <option value="EG">Egypt (EG)</option>
                <option value="US">United States (US)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">اللغة الافتراضية</label>
              <select className="w-full border p-2 rounded">
                <option value="ar">Arabic (ar)</option>
                <option value="en">English (en)</option>
              </select>
            </div>
          </div>
        </div>

        <button type="button" className="mt-6 bg-blue-600 text-white font-bold py-2 px-6 rounded hover:bg-blue-700">
          حفظ الإعدادات
        </button>
      </form>
    </div>
  );
}
