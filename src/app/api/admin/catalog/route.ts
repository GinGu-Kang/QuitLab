import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireAdmin } from '@/app/api/admin/_utils';
import { createCatalogItem, listCatalogItems } from '@/lib/master-data-admin';
import { catalogItemSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const releaseId = req.nextUrl.searchParams.get('releaseId');
  if (!releaseId) {
    return NextResponse.json({ error: 'releaseId가 필요합니다.' }, { status: 400 });
  }

  const category = req.nextUrl.searchParams.get('category') ?? undefined;
  const rowStatus = (req.nextUrl.searchParams.get('status') as 'active' | 'inactive' | 'all' | null) ?? 'all';
  const items = await listCatalogItems({ releaseId, category, rowStatus });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { session, error } = requireAdmin(req);
  if (error || !session) return error!;

  try {
    const body = await req.json();
    const releaseId = String(body.releaseId ?? '');
    if (!releaseId) {
      return NextResponse.json({ error: 'releaseId가 필요합니다.' }, { status: 400 });
    }
    const parsed = catalogItemSchema.parse(body.item);
    const item = await createCatalogItem(releaseId, parsed, session.email);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? '잘못된 입력입니다.' }, { status: 400 });
    }
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) || 500 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : '업종 생성에 실패했습니다.' }, { status });
  }
}
