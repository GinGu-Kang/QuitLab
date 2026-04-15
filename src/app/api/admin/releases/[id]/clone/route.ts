import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireAdmin } from '@/app/api/admin/_utils';
import { cloneMasterDataRelease } from '@/lib/master-data-admin';
import { releaseCloneSchema } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin(req);
  if (error || !session) return error!;

  try {
    const body = await req.json();
    const parsed = releaseCloneSchema.parse(body);
    const release = await cloneMasterDataRelease(params.id, {
      version: parsed.version,
      notes: parsed.notes,
      createdById: session.email
    });
    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? '잘못된 입력입니다.' }, { status: 400 });
    }
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) || 500 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'release 복제에 실패했습니다.' }, { status });
  }
}
