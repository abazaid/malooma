import { prisma } from '@/lib/prisma';

export interface Settings {
  openai_api_key: string;
  openai_model: string;
  dataforseo_login: string;
  dataforseo_password: string;
  default_country: string;
  default_language: string;
}

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.systemSetting.findMany();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    openai_api_key:      map.openai_api_key      || process.env.OPENAI_API_KEY || '',
    openai_model:        map.openai_model        || 'gpt-4o',
    dataforseo_login:    map.dataforseo_login    || '',
    dataforseo_password: map.dataforseo_password || '',
    default_country:     map.default_country     || 'SA',
    default_language:    map.default_language    || 'ar',
  };
}

// ─── DataForSEO: Fetch top-10 Google results ──────────────────────────────────
export async function fetchSerpResults(
  keyword: string,
  country: string,
  language: string,
  settings: Settings
): Promise<{ title: string; url: string; description: string }[]> {
  if (!settings.dataforseo_login || !settings.dataforseo_password) return [];

  const locationMap: Record<string, number> = {
    SA: 2682, AE: 2784, EG: 2818, US: 2840, GB: 2826,
  };
  const languageMap: Record<string, string> = {
    ar: 'Arabic', en: 'English',
  };

  const locationCode  = locationMap[country]  ?? 2682;
  const languageName  = languageMap[language] ?? 'Arabic';

  const auth = Buffer.from(
    `${settings.dataforseo_login}:${settings.dataforseo_password}`
  ).toString('base64');

  try {
    const res = await fetch(
      'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
      {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keyword, location_code: locationCode, language_name: languageName, depth: 10 }]),
      }
    );

    const data = await res.json();
    const items = data?.tasks?.[0]?.result?.[0]?.items ?? [];

    return items
      .filter((i: { type: string }) => i.type === 'organic')
      .slice(0, 10)
      .map((i: { title?: string; url?: string; description?: string }) => ({
        title:       i.title       ?? '',
        url:         i.url         ?? '',
        description: i.description ?? '',
      }));
  } catch {
    return [];
  }
}

// ─── Read URL content ─────────────────────────────────────────────────────────
export async function readUrlContent(url: string): Promise<string> {
  try {
    const res  = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(15000) });
    const html = await res.text();
    // Very basic strip
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 8000);
  } catch {
    return '';
  }
}

// ─── Build prompt ─────────────────────────────────────────────────────────────
export function buildArticlePrompt(opts: {
  keyword: string;
  language: string;
  country: string;
  intent: string;
  articleType: string;
  serp: { title: string; url: string; description: string }[];
  sourceContent?: string;
}): string {
  const serpSummary = opts.serp.length
    ? opts.serp.map((r, i) => `${i + 1}. ${r.title} — ${r.description}`).join('\n')
    : 'No SERP data available';

  const sourceSection = opts.sourceContent
    ? `\nORIGINAL ARTICLE TO REWRITE:\n${opts.sourceContent}\n`
    : '';

  return `You are a professional SEO & GEO content writer. Write a complete article in ${opts.language === 'ar' ? 'Arabic' : 'English'} for the target country ${opts.country}.

MAIN KEYWORD: "${opts.keyword}"
SEARCH INTENT: ${opts.intent}
ARTICLE TYPE: ${opts.articleType}
${sourceSection}
TOP 10 GOOGLE COMPETITORS (for research only, DO NOT copy):
${serpSummary}

REQUIREMENTS:
- Write a 100% ORIGINAL article, never copy competitor sentences
- Structure: H1 → short intro → H2/H3 sections → FAQ → conclusion
- SEO Title: under 60 characters
- Meta Description: under 150 characters
- Natural keyword usage, no stuffing
- GEO: Include entity-rich content, clear factual answers AI can quote
- AIO: Answer the main query in the first paragraph, use short paragraphs
- Include at least 5 FAQ questions with direct answers

Respond ONLY with a valid JSON object (no markdown code block) in this exact shape:
{
  "seoTitle": "...",
  "metaDescription": "...",
  "slug": "...",
  "mainKeyword": "...",
  "secondaryKeywords": ["..."],
  "searchIntent": "...",
  "competitorSummary": "...",
  "contentGapAnalysis": "...",
  "article": "FULL ARTICLE IN MARKDOWN",
  "faqs": [{"question":"...","answer":"..."}],
  "internalLinkSuggestions": ["..."],
  "schemaMarkup": {},
  "geoAioNotes": "..."
}`;
}
