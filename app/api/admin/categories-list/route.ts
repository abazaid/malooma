import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where:   { isActive: true },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      select:  { id: true, name: true, level: true, parentId: true },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[categories list]', error);
    return NextResponse.json({ categories: [] });
  }
}
