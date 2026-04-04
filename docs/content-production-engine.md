# Content Production Engine

## Pipeline Stages
1. **Topic Intake Engine**
- المصدر: `reference-data/mawdoo3_topic_links_from_categories.txt`
- الإدخال إلى `TopicQueue`

2. **Cleaning & Deduplication**
- normalization + hash
- similarity filtering (Jaccard)
- anti-duplicate ضد المقالات الحالية وذاكرة المحتوى

3. **Topic Classification Engine**
- تصنيف تلقائي لقسم رئيسي وفرعي
- إنشاء تصنيف فرعي fallback عند الحاجة

4. **Outline Generator**
- Search intent
- H1 + H2 + H3
- FAQ + key points + conclusion

5. **Article Writer**
- إنتاج مقال عربي أصلي بتركيب 800-1500 كلمة
- مقدمة + أقسام + نقاط + FAQ + خاتمة

6. **SEO Optimization Engine**
- slug
- meta title
- meta description
- canonical
- LSI keywords
- schema payload

7. **Internal Linking Engine**
- اختيار 3–8 روابط ذات صلة
- إنشاء `ArticleRelated`
- إضافة block `related_articles`
- backfill للمقالات القديمة بعد النشر

8. **Image Prompt Generator**
- prompt + negative prompt
- تخزين في `GeneratedImagePrompt` + `Article.imagePrompt` (بدون انتظار توليد الصورة)

9. **Async Image Worker**
- يقرأ prompts المعلقة
- يولد الصورة عبر `gpt-image-1.5` بجودة `low` لتقليل التكلفة
- يربط الصورة بالمقال لاحقًا دون تعطيل الكتابة/النشر

9. **Publishing Scheduler**
- جدولة 5 مقالات يوميًا فقط (Cluster واحد)
- توزيع على ساعات اليوم
- حالات DRAFT -> SCHEDULED -> PUBLISHED

10. **Content Memory System**
- تخزين عنوان/slug/keywords/summary/categoryPath
- دعم منع التكرار والربط الداخلي

## Files
- `lib/pipeline/topic-intake.ts`
- `lib/pipeline/classifier.ts`
- `lib/pipeline/outline-generator.ts`
- `lib/pipeline/article-writer.ts`
- `lib/pipeline/seo-engine.ts`
- `lib/pipeline/internal-linking.ts`
- `lib/pipeline/image-prompt.ts`
- `lib/pipeline/scheduler.ts`
- `lib/pipeline/memory.ts`
- `lib/pipeline/engine.ts`
- `lib/pipeline/events.ts`

## Commands
- `npm run pipeline:run`
- `npm run pipeline:publish`
- `npm run pipeline:images`
- `npm run pipeline:article -- "عنوان"`
- `npm run pipeline:cron`

## Coolify Automation
- Cron Job 1 (daily): `npm run pipeline:run`
- Cron Job 2 (every 15 min): `npm run pipeline:publish`

## Quality Notes
- المحتوى مولد أصليًا ولا ينسخ نص المنافس.
- dedupe guard يمنع كتابة نفس الفكرة مرتين.
- في حال التشابه العالي، يتم وسم الموضوع `SKIPPED` مع توصية تحديث المقال الحالي.
- Cluster Mode إجباري:
- يتم إنشاء 1 Core + 4 Supporting يوميًا فقط.
- كل مقال يرتبط بالمقالات الأربعة الأخرى داخل نفس الـCluster.
- عند عدم اكتمال Cluster، يتم إيقاف الجدولة تلقائيًا.
- يوجد سجل مراحل تفصيلي في جدول `PipelineEvent` ويظهر في `/admin/pipeline`.
