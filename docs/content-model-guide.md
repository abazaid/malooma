# Content Model Guide

## Core Entities
- users
- authors
- reviewers
- categories (self-relation for parent/child)
- articles
- article_sections
- article_faqs
- article_sources
- article_related
- static_pages
- trending_slots
- popular_articles
- media
- seo_meta
- redirects
- audit_logs

## Article Blocks
مدعوم في renderer:
- paragraph
- heading
- image
- list
- quote
- note
- faq
- table
- source list
- related articles
- callout

## Publishing Flow
1. Draft
2. Review
3. Publish/Schedule
4. Update with versioned audit logs

## SEO Fields
- meta title
- meta description
- canonical
- noindex flag
- schema json (optional override)
