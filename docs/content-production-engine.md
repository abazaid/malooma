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
- إنتاج مقال عربي أصلي بتركيب طويل (1200+ كلمة)
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
- تخزين في `GeneratedImagePrompt` + `Article.imagePrompt`

9. **Publishing Scheduler**
- جدولة 10 مقالات يوميًا
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

## Commands
- `npm run pipeline:run`
- `npm run pipeline:publish`
- `npm run pipeline:article -- "عنوان"`
- `npm run pipeline:cron`

## Coolify Automation
- Cron Job 1 (daily): `npm run pipeline:run`
- Cron Job 2 (every 15 min): `npm run pipeline:publish`

## Quality Notes
- المحتوى مولد أصليًا ولا ينسخ نص المنافس.
- dedupe guard يمنع كتابة نفس الفكرة مرتين.
- في حال التشابه العالي، يتم وسم الموضوع `SKIPPED` مع توصية تحديث المقال الحالي.
