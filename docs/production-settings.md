# Production Settings

## Next.js
- `NODE_ENV=production`
- تفعيل standalone output إذا كانت بيئة containerized مطلوبة
- استخدام reverse proxy مع HTTP/2

## Database
- pooled connections
- index tuning للأعمدة:
  - article(status,publishedAt)
  - article(categoryId,publishedAt)
  - category(parentId,level)

## Media
- ضغط الصور قبل الرفع
- فرض alt text
- استخدام CDN للملفات الثابتة

## Security
- تفعيل Admin Basic Auth على الأقل
- استخدام secrets manager للمتغيرات الحساسة
- تقييد CORS لمسارات API الداخلية

## Observability
- تفعيل logs منظمة
- مراقبة uptime + latency + error rate
- تتبع Core Web Vitals
