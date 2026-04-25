import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/ai-settings
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      // Mask sensitive keys
      if (['openai_api_key', 'dataforseo_password'].includes(s.key)) {
        map[s.key] = s.value ? '***' + s.value.slice(-4) : '';
      } else {
        map[s.key] = s.value;
      }
    }
    return NextResponse.json({ settings: map });
  } catch (error) {
    console.error('[ai-settings GET]', error);
    return NextResponse.json({ error: 'فشل جلب الإعدادات' }, { status: 500 });
  }
}

// POST /api/admin/ai-settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const allowed = [
      'openai_api_key',
      'openai_model',
      'dataforseo_login',
      'dataforseo_password',
      'default_country',
      'default_language',
    ];

    for (const key of allowed) {
      if (body[key] !== undefined && body[key] !== '') {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: body[key] },
          create: { key, value: body[key] },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[ai-settings POST]', error);
    return NextResponse.json({ error: 'فشل حفظ الإعدادات' }, { status: 500 });
  }
}
