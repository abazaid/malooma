# Sitemap Scaling Guide

## Current Structure
- `/sitemap.xml` (index)
- `/sitemaps/articles.xml`
- `/sitemaps/categories.xml`
- `/sitemaps/images.xml`

## Scaling Strategy
1. عند تجاوز 50k URL لنوع معين:
- قسّم ملفات sitemap إلى chunks:
  - articles-1.xml
  - articles-2.xml
  - ...
2. حدّث sitemap index لإدراج كل chunk.
3. استخدم `lastmod` واقعي لتقليل crawl waste.

## Suggested Automation
- batch generator cron يومي
- delta sitemap للمحتوى الجديد آخر 48 ساعة
- cache headers طويلة مع stale-while-revalidate
