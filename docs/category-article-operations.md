# Adding Categories and Articles

## من لوحة التحكم
1. افتح `/admin/categories` لإنشاء قسم رئيسي أو فرعي.
2. افتح `/admin/articles` لإنشاء مقال جديد (عنوان + ملخص + تصنيف).
3. افتح `/admin/trending` لضبط خانات المتداول.

## عبر قاعدة البيانات
- أضف records في `Category` مع:
  - `level=1` للأقسام الرئيسية
  - `level=2` مع `parentId` للأقسام الفرعية
- أضف `Article` + `ArticleSection` + `SeoMeta`

## بعد أي تعديل كبير
- أعد فهرسة البحث (إن كان Meilisearch مفعلًا)
- revalidate routes المتأثرة
- راقب sitemap routes
