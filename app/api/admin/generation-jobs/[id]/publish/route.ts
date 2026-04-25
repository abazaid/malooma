import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }       = await params;
    const { categoryId } = await req.json();

    if (!categoryId) {
      return NextResponse.json({ error: 'يجب اختيار قسم للنشر' }, { status: 400 });
    }

    // 1. Fetch the GenerationJob
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job = await (prisma as any).generationJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: 'المقالة غير موجودة' }, { status: 404 });
    if (job.status === 'PUBLISHED') {
      return NextResponse.json({ error: 'هذه المقالة منشورة مسبقاً' }, { status: 400 });
    }

    // 2. Ensure category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: 'القسم غير موجود' }, { status: 404 });

    // 3. Get or create a default author
    let author = await prisma.author.findFirst();
    if (!author) {
      author = await prisma.author.create({
        data: { slug: 'admin-author', displayName: 'فريق التحرير' },
      });
    }

    // 4. Build a clean slug (avoid duplicates by appending timestamp if needed)
    const rawSlug     = (job.slug as string)?.replace(/[^a-z0-9\u0600-\u06FF-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `article-${Date.now()}`;
    const slugExists  = await prisma.article.findUnique({ where: { slug: rawSlug } });
    const finalSlug   = slugExists ? `${rawSlug}-${Date.now()}` : rawSlug;

    // 5. Split markdown content into sections (split by H2 headings)
    const content     = (job.content as string) || '';
    const rawSections = content.split(/(?=^## )/m).filter(Boolean);

    const sections = rawSections.map((block: string, idx: number) => {
      const lines    = block.trim().split('\n');
      const heading  = lines[0].startsWith('## ') ? lines[0].replace('## ', '') : undefined;
      const body     = heading ? lines.slice(1).join('\n').trim() : block.trim();
      return { orderNo: idx + 1, blockType: 'MARKDOWN', heading, content: body };
    });

    // Ensure at least one section
    if (sections.length === 0) {
      sections.push({ orderNo: 1, blockType: 'MARKDOWN', heading: undefined, content });
    }

    // 6. Parse FAQs
    const rawFaqs = Array.isArray(job.faqs) ? job.faqs as { question: string; answer: string }[] : [];

    // 7. Create the Article with all related records
    const article = await prisma.article.create({
      data: {
        title:          job.title   || job.seoTitle || job.keyword,
        slug:           finalSlug,
        excerpt:        (job.metaDescription as string) || job.keyword,
        status:         'PUBLISHED',
        publishedAt:    new Date(),
        readingMinutes: Math.max(3, Math.round(content.split(' ').length / 200)),
        authorId:       author.id,
        categoryId,
        keywords:       [],
        searchIntent:   'informational',
        generationJobId: job.id,

        sections: {
          create: sections,
        },

        faqs: {
          create: rawFaqs.map((faq, i) => ({
            orderNo:  i + 1,
            question: faq.question,
            answer:   faq.answer,
          })),
        },

        seoMeta: {
          create: {
            metaTitle:       String(job.seoTitle || job.title || job.keyword).slice(0, 60),
            metaDescription: String(job.metaDescription || '').slice(0, 150),
            canonicalUrl:    null,
            schemaJson:      (job.schemaJson ?? {}) as object,
          },
        },
      },
      select: { id: true, slug: true },
    });

    // 8. Mark the GenerationJob as PUBLISHED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).generationJob.update({
      where: { id },
      data:  { status: 'PUBLISHED' },
    });

    return NextResponse.json({ ok: true, articleId: article.id, slug: article.slug });
  } catch (error) {
    console.error('[publish]', error);
    return NextResponse.json({ error: `خطأ أثناء النشر: ${(error as Error).message}` }, { status: 500 });
  }
}
