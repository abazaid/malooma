# AI Article Generator System (SEO + GEO + AIO)

## Goal
Create a web app that generates, rewrites, reviews, and prepares articles before publishing. The system must use ChatGPT models and DataForSEO API to analyze Google top results.

## Main Features

### 1. Article from Keyword
Generates a fully optimized article starting from a single keyword.

**User inputs:**
- Main keyword
- Target country
- Target language
- Article type
- Search intent
- Preferred AI model
- OpenAI API key
- DataForSEO API credentials

**System Workflow:**
1. Search Google top 10 results using DataForSEO.
2. Analyze competitors:
   - Titles
   - Meta descriptions
   - Headings
   - Word count
   - FAQs
   - Content gaps
   - Search intent
   - Featured snippet opportunities
   - People Also Ask questions if available
3. Generate a new original article optimized for SEO, GEO, and AIO.

### 2. Rewrite from URL
Rewrites an existing article or competitor's page.

**User inputs:**
- Article URL
- Target keyword
- Target country
- Target language
- Preferred AI model

**System Workflow:**
1. Extract/read the URL content.
2. Analyze the original page.
3. Search top 10 Google results with DataForSEO.
4. Rewrite the article in a better, original, SEO-safe version.
5. Improve structure, clarity, search intent, and conversion value.
6. Strictly avoid copying exact sentences.

---

## AI Model & System Settings
Admins/Users must be able to configure and securely save:
- **OpenAI API key**
- **Model selection**, supporting dynamic or predefined names (e.g., GPT-4.1, GPT-4.1 mini, GPT-5.5 Thinking, or manual input).
- **DataForSEO credentials** (username/password or API key).
- **Localization:** Select country/location for Google results and select language.

---

## Output Optimization Standards

### SEO Requirements
Every generated article must include:
- SEO title (under 60 characters)
- Meta description (under 150 characters)
- Clean slug
- H1 heading
- H2/H3 structure
- Short, engaging introduction
- Strong topical coverage
- Internal linking suggestions
- External citation suggestions if needed
- FAQ section
- Key takeaways & Conclusion
- Suggested schema markup (Article schema, FAQ schema, Breadcrumb schema)
- Natural keyword usage without stuffing
- Accurate search intent match
- Better content depth than top competitors
- Clear answer-first paragraphs optimized for Google snippets.

### GEO (Generative Engine Optimization) Requirements
- Write clear factual answers that AI search engines can easily quote.
- Use direct definitions and concise summaries.
- Add comparison sections when relevant.
- Add entity-rich content.
- Mention related brands, categories, locations, and concepts naturally.
- Use structured sections that are easy for AI crawlers to understand.
- Include specific semantic blocks: “best for”, “who should use”, “how to choose”, and “common mistakes”.

### AIO (AI Overviews) Requirements
- Answer the main query early and concisely.
- Add FAQ-style answers.
- Use short paragraphs and trusted-source style wording.
- Avoid vague claims; add specific numbers, steps, and comparisons.
- Cover related sub-questions directly from SERP/PAA.
- Make the article helpful, complete, and easy to summarize.

---

## Review Workflow & Dashboard
**CRITICAL: Generated articles must NOT publish automatically.**

All results must appear in a dashboard page called: **“Waiting for Publish”**

**Dashboard Table/Cards must show:**
- Article title
- Keyword
- Source type: Keyword / URL Rewrite
- Target country
- Language
- AI model used
- Status: `Draft`, `Waiting for Review`, `Needs Modification`, `Approved`, `Published`
- Created date
- Actions: `View`, `Edit`, `Regenerate`, `Approve`, `Publish`, `Delete`

**Pre-Publishing Capabilities:**
- Review the full article.
- Edit title, meta, headings, body, FAQ, slug manually.
- Regenerate only selected sections if needed.
- Approve or reject the content.
- Publish manually only after approval.

**Publishing Options:**
- Save as draft only.
- Export as HTML.
- Export as Markdown.
- Copy article.
- Future integration ready for WordPress/Salla/custom CMS APIs.

---

## Article Output Format
The final generated object should be structured to include:
1. SEO Title
2. Meta Description
3. Slug
4. Main Keyword
5. Secondary Keywords
6. Search Intent
7. Competitor Summary
8. Content Gap Analysis
9. Full Article content
10. FAQ array
11. Internal Link Suggestions
12. Schema Markup JSON-LD
13. GEO/AIO Optimization Notes

---

## Important Rules & Constraints
1. Content must be 100% original. Do not copy competitors.
2. Use competitor SERP ONLY for research and analysis.
3. Make the article better, clearer, and more complete than the source material.
4. Maintain a professional SEO writing style.
5. Fully support Arabic and English.
6. The system must be scalable for a large volume of articles.
7. All generated articles must be stored in the database.
8. API keys must be kept encrypted and secure.
9. Implement strict error handling for API failures (DataForSEO / OpenAI).
10. Display a robust loading status/progress indicator while generation is running.
