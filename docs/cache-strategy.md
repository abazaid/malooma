# Cache Strategy

## Layers
1. CDN/Edge cache
2. Next route cache
3. Data cache (Redis optional)
4. Browser cache headers

## Route Policies
- Home/category: `s-maxage=1800`, `stale-while-revalidate=86400`
- Article: `s-maxage=1800`, `stale-while-revalidate=86400`
- Sitemap/RSS: `s-maxage=86400`

## Invalidation
- عند نشر/تعديل مقال:
  - revalidate `/`
  - revalidate category/subcategory route
  - revalidate `/latest`, `/popular`
  - revalidate sitemap endpoints

## Redis Usage (optional)
- hot lists: latest, popular, trending
- search suggestions cache
