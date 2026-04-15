import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_utils';
import { rollbackMasterDataRelease } from '@/lib/master-data-admin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin(req);
  if (error || !session) return error!;

  try {
    const payload = await rollbackMasterDataRelease(params.id, session.email);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'release rollback에 실패했습니다.'
      },
      { status: 400 }
    );
  }
}
