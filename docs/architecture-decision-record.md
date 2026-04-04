# Architecture Decision Record (ADR)

## ADR-0001: Stack and Rendering Strategy

### Status
Accepted

### Context
نحتاج منصة عربية معرفية ضخمة قادرة على:
- التوسع إلى عدد كبير من المقالات
- SEO تقني قوي
- تجربة RTL-first ممتازة
- إدارة تحريرية مع نموذج محتوى مرن

### Decision
- Framework: Next.js App Router + TypeScript
- Data layer: PostgreSQL + Prisma
- Rendering:
  - SSR للمحتوى المتغير
  - SSG/ISR للصفحات الثابتة وشبه الثابتة
- Search adapter: Meilisearch مع fallback
- Caching: Redis اختياري + cache headers + revalidation

### Consequences
- أداء ممتاز مع تحكم دقيق في الكاش والسيو
- سهولة بناء routes ديناميكية metadata-aware
- قابلية عالية للتوسع الهيكلي في المحتوى والإدارة

## ADR-0002: Taxonomy-first IA

### Decision
اعتماد هيكل تصنيفي ثنائي المستوى (رئيسي/فرعي) كعمود تنقّل أساسي، مع ربط داخلي كثيف من المقالات والصفحات الأرشيفية.

### Consequences
- تحسين اكتشاف المحتوى للمستخدم والزاحف
- رفع عمق التصفح الداخلي وتقليل الصفحات المعزولة

## ADR-0003: SEO Routes as First-class Citizens

### Decision
بناء:
- `robots.txt`
- `sitemap index`
- `article/category/image sitemaps`
- `rss.xml`

من داخل التطبيق نفسه عبر route handlers.

### Consequences
- مرونة أعلى في التحديث
- سيطرة كاملة على التقسيم والتوسع لاحقًا
