"use client";
import React, { useState } from 'react';

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<'keyword' | 'url'>('keyword');

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h1 className="text-2xl font-black text-slate-900 mb-6">توليد المقالات (AI Article Generator)</h1>

      {/* Tabs */}
      <div className="flex space-x-4 space-x-reverse mb-6 border-b pb-2">
        <button 
          onClick={() => setActiveTab('keyword')}
          className={`font-bold pb-2 px-4 border-b-2 ${activeTab === 'keyword' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          من كلمة مفتاحية (Keyword)
        </button>
        <button 
          onClick={() => setActiveTab('url')}
          className={`font-bold pb-2 px-4 border-b-2 ${activeTab === 'url' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          إعادة صياغة (Rewrite URL)
        </button>
      </div>

      <div className="max-w-3xl">
        {activeTab === 'keyword' ? (
          <form className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <label className="block text-sm font-bold mb-2">الكلمة المفتاحية المستهدفة</label>
              <input type="text" placeholder="مثال: فوائد الزنجبيل" className="w-full border p-2 rounded" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">الدولة المستهدفة (GEO)</label>
                <select className="w-full border p-2 rounded">
                  <option value="SA">السعودية</option>
                  <option value="AE">الإمارات</option>
                  <option value="EG">مصر</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">نية البحث (Search Intent)</label>
                <select className="w-full border p-2 rounded">
                  <option value="informational">معلوماتي (Informational)</option>
                  <option value="commercial">تجاري (Commercial)</option>
                  <option value="navigational">توجيهي (Navigational)</option>
                </select>
              </div>
            </div>

            <button type="button" className="w-full bg-blue-600 text-white font-bold py-3 rounded mt-4 hover:bg-blue-700">
              بدء التحليل والتوليد
            </button>
          </form>
        ) : (
          <form className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div>
              <label className="block text-sm font-bold mb-2">رابط المقال الأصلي (Competitor URL)</label>
              <input type="url" placeholder="https://..." className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الكلمة المفتاحية المستهدفة</label>
              <input type="text" placeholder="مثال: فوائد الزنجبيل" className="w-full border p-2 rounded" />
            </div>
            <button type="button" className="w-full bg-green-600 text-white font-bold py-3 rounded mt-4 hover:bg-green-700">
              قراءة الرابط وإعادة الصياغة
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        <strong>ملاحظة:</strong> لن يتم النشر المباشر. ستُنقل المقالات المولدة إلى لوحة (بانتظار النشر) لمراجعتها وتعديلها يدوياً.
      </div>
    </div>
  );
}
