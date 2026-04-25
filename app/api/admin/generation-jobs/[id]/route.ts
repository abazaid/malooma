import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single job
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job = await (prisma as any).generationJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ job });
  } catch (error) {
    console.error('[job GET]', error);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

// PATCH - update status / fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }  = await params;
    const body    = await req.json();
    const allowed = ['status', 'title', 'seoTitle', 'metaDescription', 'slug', 'content', 'faqs'];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (body[k] !== undefined) data[k] = body[k];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma as any).generationJob.update({ where: { id }, data });
    return NextResponse.json({ ok: true, job: updated });
  } catch (error) {
    console.error('[job PATCH]', error);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).generationJob.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[job DELETE]', error);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
