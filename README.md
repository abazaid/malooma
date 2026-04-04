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

