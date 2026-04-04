# Arabic Knowledge Platform

منصة محتوى عربية ضخمة (RTL-first) مبنية بـ Next.js App Router ومصممة بمنهج SEO-first وقابلية توسع عالية، مع لوحة إدارة وقاعدة بيانات قابلة للتشغيل الإنتاجي.

## Highlights
- Next.js 16 + TypeScript + Tailwind CSS
- PostgreSQL + Prisma schema متكامل
- هيكل IA مشابه فلسفيًا للمواقع العربية المعرفية الكبيرة
- صفحات عامة كاملة:
  - الرئيسية
  - التصنيفات الرئيسية والفرعية
  - المقال
  - أحدث المقالات
  - الأكثر رواجًا
  - البحث + نتائج البحث
  - الكاتب
  - فريق التحرير
  - الصفحات الثابتة (عن/معايير/اتصل/خصوصية/شروط)
  - 404
  - HTML sitemap
- SEO تقني:
  - metadata ديناميكي
  - canonical
  - Open Graph/Twitter
  - JSON-LD (Organization, WebSite, Breadcrumb, Article, FAQ, Collection)
  - robots.txt
  - sitemap index + article/category/image sitemaps
  - RSS feed
- لوحة تحكم `/admin` (محميّة بـ Basic Auth اختياريًا)

## Reference Analysis
- `docs/reference-analysis.md`
- `docs/implementation-plan.md`

## Quick Start
1. تثبيت الحزم:
```bash
npm install
```
2. نسخ البيئة:
```bash
cp .env.example .env
```
3. توليد Prisma Client:
```bash
npm run prisma:generate
```
4. إنشاء migration:
```bash
npm run prisma:migrate
```
5. تعبئة بيانات أولية:
```bash
npm run seed
```
6. تشغيل التطوير:
```bash
npm run dev
```

## Build & Quality
```bash
npm run lint
npm run build
```

## Routes Overview
- Public:
  - `/`
  - `/categories/[categorySlug]`
  - `/categories/[categorySlug]/[subcategorySlug]`
  - `/articles/[slug]`
  - `/latest`
  - `/popular`
  - `/search`
  - `/search/results?q=...`
  - `/authors/[slug]`
  - `/team`
  - `/about`
  - `/editorial-standards`
  - `/contact`
  - `/privacy`
  - `/terms`
  - `/sitemap-html`
  - `/sitemap.xml`
  - `/sitemaps/articles.xml`
  - `/sitemaps/categories.xml`
  - `/sitemaps/images.xml`
  - `/rss.xml`
- Admin:
  - `/admin`
  - `/admin/categories`
  - `/admin/articles`
  - `/admin/static-pages`
  - `/admin/trending`

## Data Model
راجع:
- `prisma/schema.prisma`
- `docs/content-model-guide.md`

## Required Docs
- Architecture Decision Record: `docs/architecture-decision-record.md`
- SEO Checklist: `docs/seo-checklist.md`
- Deployment Guide: `docs/deployment-guide.md`
- Content Model Guide: `docs/content-model-guide.md`
- Adding Categories/Articles: `docs/category-article-operations.md`
- Sitemap Scaling: `docs/sitemap-scaling-guide.md`
- Cache Strategy: `docs/cache-strategy.md`
- Production Settings: `docs/production-settings.md`

## Notes
- المشروع يستخدم fallback data من `reference-data/` عند غياب قاعدة البيانات، لضمان عمل القوالب مباشرة.
- ملفات المرجع (`reference-data/*`) ناتجة من crawl داخلي وتُستخدم كبذرة تصنيفية فقط.

# Content Production Engine

## الهدف
محرك إنتاج محتوى تلقائي ينفذ:
1. Topic intake from `reference-data/`
2. Cleaning + dedupe + anti-duplicate
3. Auto classification (main/sub category)
4. Stage 1 Analysis (keyword + intent + user problem)
5. Stage 2 Outline (H2/H3 + FAQ + logical flow)
6. Stage 3 Execution (1200+ words, practical examples)
7. SEO optimization (slug/meta/canonical/LSI)
8. Internal linking (2–5 links)
9. Image prompt generation (async image pipeline)
10. Async image generation via `gpt-image-1`
11. Random author assignment from AI-generated pool (20+ authors)
12. Scheduling (5/day, single cluster mode)
13. Publishing + content memory update

## أوامر التشغيل
```bash
# 1) إدخال المواضيع + تنظيف + كتابة Cluster واحد (1 رئيسي + 4 داعمة) + جدولة
npm run pipeline:run

# 2) نشر المقالات المجدولة التي حان وقتها
npm run pipeline:publish

# 3) معالجة الصور المعلقة بشكل غير متزامن
npm run pipeline:images

# 4) إنشاء مقالة واحدة يدويًا من عنوان
npm run pipeline:article -- "فوائد تنظيم الوقت في بيئة العمل"

# 5) worker دوري (يمكن ربطه بـ Coolify cron)
npm run pipeline:cron

# 6) حذف كل المقالات/المواضيع التجريبية المولدة من الـpipeline
npm run pipeline:reset
```

## جداول قاعدة البيانات المضافة
- `TopicQueue`
- `ContentMemory`
- `PublishingJob`
- `GeneratedImagePrompt`
- `PipelineEvent` (تتبع مراحل التنفيذ لكل مقال)

## لوحة الأدمن للأتمتة
- صفحة المتابعة: `/admin/pipeline`
- تعرض:
- حالات المواضيع بالألوان (بانتظار/منشور/متجاوز...)
- سجل مراحل التنفيذ لكل مقالة
- آخر وظائف الجدولة والنشر
- تشغيل يدوي: استيراد مواضيع `reference-data` + تشغيل Pipeline + نشر المستحق
- إضافة موضوع جديد يدويًا للـQueue

## بعد التحديث
نفّذ مرة واحدة:
```bash
npx prisma db push
```

## Cron مقترح (Coolify)
- `pipeline:run` مرة يوميًا (مثل 01:00)
- `pipeline:publish` كل 15 دقيقة
- `pipeline:images` كل 10-15 دقيقة

## سياسة النشر الحالية
- حد يومي ثابت: `5` مقالات فقط.
- النمط: `Cluster Mode` فقط (موضوع محوري واحد + 4 مقالات داعمة).
- عند فشل تكوين Cluster كامل: لا يتم النشر ولا الجدولة.

## Model Selection (Final Workflow)
- كتابة المقال: `LLM_MODEL_WRITER=qwen3:8b`
- مهام خفيفة (تحليل/هيكل/SEO/اقتراح روابط): `LLM_MODEL_LIGHT=qwen3:4b`
- توليد الصور (خارجي Async): `OPENAI_IMAGE_MODEL=gpt-image-1`

## ملاحظة
المواضيع المصدرية تُستخدم كأفكار فقط، والمحتوى الناتج يتم توليده أصليًا داخل المحرك.
