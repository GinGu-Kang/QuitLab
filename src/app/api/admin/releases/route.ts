import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { requireAdmin } from '@/app/api/admin/_utils';
import { createMasterDataRelease, getPublishedReleaseDetail, listMasterDataReleases } from '@/lib/master-data-admin';
import { releaseCreateSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const [releases, published] = await Promise.all([
    listMasterDataReleases(),
    getPublishedReleaseDetail()
  ]);

  return NextResponse.json({
    releases,
    publishedReleaseId: published?.release.id ?? null
  });
}

export async function POST(req: NextRequest) {
  const { session, error } = requireAdmin(req);
  if (error || !session) return error!;

  try {
    const body = await req.json();
    const parsed = releaseCreateSchema.parse(body);
    const release = await createMasterDataRelease({
      version: parsed.version,
      notes: parsed.notes,
      baseReleaseId: parsed.baseReleaseId,
      createdById: session.email
    });
    return NextResponse.json(release, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? '잘못된 입력입니다.' }, { status: 400 });
    }
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status?: number }).status) || 500 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'release 생성에 실패했습니다.' }, { status });
  }
}
