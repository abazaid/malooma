# Deployment Guide

## 1) Requirements
- Node.js 20+
- PostgreSQL 15+
- (اختياري) Redis
- (اختياري) Meilisearch

## 2) Environment
- انسخ `.env.example` إلى `.env`
- اضبط:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - `ADMIN_BASIC_AUTH_USER`
  - `ADMIN_BASIC_AUTH_PASS`

## 3) Build Pipeline
```bash
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run build
npm run start
```

## 4) Reverse Proxy
- فعّل gzip/brotli
- cache static assets طويل المدى
- مرّر HTTPS headers بشكل صحيح

## 5) Post Deploy
- تحقق من:
  - `/robots.txt`
  - `/sitemap.xml`
  - `/rss.xml`
  - routes الأساسية
- أرسل sitemap إلى Search Console

## 6) Coolify Deployment
1. ارفع المشروع إلى Git repository (GitHub/GitLab).
2. في Coolify:
- New Resource -> Application
- Source: Git repository
- Build Pack: Dockerfile
- Port: `3000`
3. Environment Variables (Production):
- `NEXT_PUBLIC_SITE_URL=https://malooma.org`
- `DATABASE_URL=postgresql://...`
- `ADMIN_BASIC_AUTH_USER=admin`
- `ADMIN_BASIC_AUTH_PASS=...`
- (اختياري) `REDIS_URL`, `MEILI_HOST`, `MEILI_API_KEY`
4. Deploy.
5. بعد أول تشغيل:
- نفّذ migration وseed داخل السيرفر (One-off command):
```bash
npm run prisma:migrate
npm run seed
```
