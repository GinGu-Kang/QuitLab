import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_utils';
import { publishMasterDataRelease } from '@/lib/master-data-admin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = requireAdmin(req);
  if (error || !session) return error!;

  try {
    const payload = await publishMasterDataRelease(params.id, session.email);
    return NextResponse.json(payload);
  } catch (error) {
    const maybeReport = error as Error & { report?: unknown };
    return NextResponse.json(
      {
        error: maybeReport.message || 'release publish에 실패했습니다.',
        report: maybeReport.report ?? null
      },
      { status: 400 }
    );
  }
}
