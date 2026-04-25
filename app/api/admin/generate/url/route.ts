import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getSettings,
  fetchSerpResults,
  readUrlContent,
  buildArticlePrompt,
} from '@/lib/ai-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sourceUrl,
      keyword,
      targetCountry,
      targetLanguage,
      aiModel: bodyModel,
    } = body;

    if (!sourceUrl || !keyword) {
      return NextResponse.json({ error: 'الرابط والكلمة المفتاحية مطلوبان' }, { status: 400 });
    }

    const settings = await getSettings();
    const apiKey   = settings.openai_api_key;
    const model    = bodyModel || settings.openai_model || 'gpt-4o';
    const country  = targetCountry  || settings.default_country  || 'SA';
    const language = targetLanguage || settings.default_language || 'ar';

    if (!apiKey) {
      return NextResponse.json({ error: 'لم يتم إعداد مفتاح OpenAI API. اذهب إلى الإعدادات.' }, { status: 400 });
    }

    // 1. Read source URL content + Fetch SERP (in parallel)
    const [sourceContent, serp] = await Promise.all([
      readUrlContent(sourceUrl),
      fetchSerpResults(keyword, country, language, settings),
    ]);

    // 2. Build prompt with source content
    const prompt = buildArticlePrompt({
      keyword,
      language,
      country,
      intent: 'rewrite',
      articleType: 'rewrite',
      serp,
      sourceContent,
    });

    // 3. Call OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      return NextResponse.json({ error: `OpenAI Error: ${err}` }, { status: 502 });
    }

    const openaiData = await openaiRes.json();
    const rawContent = openaiData.choices?.[0]?.message?.content ?? '{}';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json({ error: 'فشل تحليل رد OpenAI. حاول مرة أخرى.' }, { status: 502 });
    }

    // 4. Save to DB
    const job = await prisma.generationJob.create({
      data: {
        keyword,
        sourceType:        'URL',
        sourceUrl,
        targetCountry:     country,
        targetLanguage:    language,
        aiModelUsed:       model,
        status:            'WAITING_REVIEW',
        title:             (parsed.seoTitle as string) || keyword,
        seoTitle:          parsed.seoTitle as string,
        metaDescription:   parsed.metaDescription as string,
        slug:              parsed.slug as string,
        content:           parsed.article as string,
        faqs:              parsed.faqs as object,
        internalLinks:     parsed.internalLinkSuggestions as object,
        schemaJson:        parsed.schemaMarkup as object,
        geoAioNotes:       { notes: parsed.geoAioNotes },
        competitorAnalysis: {
          serp,
          competitorSummary:  parsed.competitorSummary,
          contentGapAnalysis: parsed.contentGapAnalysis,
          secondaryKeywords:  parsed.secondaryKeywords,
          searchIntent:       parsed.searchIntent,
        },
      },
    });

    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (error) {
    console.error('[generate-url]', error);
    return NextResponse.json({ error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
