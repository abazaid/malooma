# Implementation Plan

## Project Goal
Build a production-ready Arabic knowledge platform inspired by high-scale content sites in architecture and UX logic, with strong SEO and scalability.

## Selected Stack
- Framework: Next.js (App Router) + TypeScript
- Styling: Tailwind CSS (RTL-first)
- Database: PostgreSQL + Prisma ORM
- Cache/session acceleration: Redis (optional fallback-safe integration)
- Search: Meilisearch adapter (with graceful DB fallback)
- Rendering strategy: SSR + ISR hybrid

Why this stack:
- Next.js App Router gives server components, route handlers, metadata APIs, and excellent SEO rendering.
- Prisma + PostgreSQL supports complex editorial schema and scale-friendly data access patterns.
- Redis + Meilisearch provide scalable performance and search quality for large content archives.

## Phase Breakdown

### Phase 1: Discovery and Documentation
- Finalize reference architecture extraction
- Write `docs/reference-analysis.md`
- Write this execution plan

### Phase 2: Foundation
- Bootstrap app architecture
- Define core folder boundaries (`lib`, `components`, `features`, `app/(public|admin)`)
- Configure environment contracts (`.env.example`)
- Add Prisma schema for all required entities
- Add migration + seed pipeline

### Phase 3: Public IA and Core Pages
- Global layout (header, footer, navigation)
- Homepage sections:
  - hero intro
  - trending strip
  - popular cards
  - category directory (main + sub)
- Category routes:
  - main category archive
  - subcategory archive
- Latest + popular pages

### Phase 4: Article + Search + Static Trust Pages
- Article route with block renderer
- Breadcrumbs and related content
- Search page and results page
- Author page and editorial team page
- Static pages:
  - about
  - editorial standards
  - contact
  - privacy
  - terms
- HTML sitemap page for users
- 404 page

### Phase 5: Admin/CMS Layer
- Admin route group with basic protection
- CRUD flows:
  - categories/subcategories
  - articles
  - static pages
  - authors/reviewers
  - trending and popular slots
- editorial metadata fields (seo/canonical/schema inputs)
- preview and publish states

### Phase 6: Technical SEO
- Dynamic metadata per route
- Canonical tags
- Open Graph + Twitter
- JSON-LD builders:
  - Organization
  - WebSite
  - BreadcrumbList
  - CollectionPage
  - Article
  - FAQPage (conditional)
- `robots.txt`
- Sitemap index + segmented sitemaps
- RSS feed

### Phase 7: Performance + Reliability + Docs
- Caching strategy (route/data/cache headers)
- ISR policies by page type
- Query optimization and pagination strategy
- Accessibility pass
- Final docs set:
  - ADR
  - SEO checklist
  - deployment guide
  - content model guide
  - category/article expansion guide
  - sitemap scaling guide
  - cache strategy guide
  - production tuning guide

## Data and Content Strategy
- Import category references from extracted list (`reference-data/mawdoo3_categories.txt`).
- Use original placeholder seed content for articles/authors/static pages.
- Provide enough seeded records to exercise all templates and route types.

## Risks and Mitigations
1. Massive taxonomy volume:
- Use paginated category APIs and lazy loading in admin.

2. Search availability:
- Implement Meilisearch adapter with DB fallback.

3. Sitemap growth:
- Split by entity type and chunk size.

4. Editorial complexity:
- Keep block-based content model normalized and type-safe.

## Definition of Done
- Public site and admin both runnable.
- DB schema and seed complete.
- Required page templates implemented.
- SEO and sitemap pipeline active.
- Documentation package delivered.
