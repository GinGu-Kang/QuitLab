import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireAdmin } from '@/app/api/admin/_utils';
import { getCatalogItem, updateCatalogItem } from '@/lib/master-data-admin';
import { catalogItemUpdateSchema } from '@/lib/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const item = await getCatalogItem(params.id);
  if (!item) {
    return NextResponse.json({ error: '업종을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin(req);
  if (error || !session) return error!;

  try {
    const body = await req.json();
    const parsed = catalogItemUpdateSchema.parse(body);
    const item = await updateCatalogItem(params.id, parsed, session.email);
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? '잘못된 입력입니다.' }, { status: 400 });
    }
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) || 500 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : '업종 수정에 실패했습니다.' }, { status });
  }
}
