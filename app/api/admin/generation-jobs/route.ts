import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamically import prisma to avoid build-time type errors
    // before `prisma db push` has been run on the server
    const { prisma } = await import('@/lib/prisma');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaAny = prisma as any;

    if (typeof prismaAny.generationJob === 'undefined') {
      return NextResponse.json({ jobs: [], info: 'Table not yet created. Run prisma db push.' });
    }

    const jobs = await prismaAny.generationJob.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        keyword: true,
        sourceType: true,
        targetCountry: true,
        targetLanguage: true,
        aiModelUsed: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[generation-jobs]', error);
    return NextResponse.json({ jobs: [], error: 'فشل جلب البيانات، تأكد من تشغيل prisma db push' }, { status: 200 });
  }
}
