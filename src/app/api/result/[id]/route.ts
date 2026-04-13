import { NextResponse } from 'next/server';

import { getResultBySession } from '@/lib/repository';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const result = await getResultBySession(params.id);
  if (!result) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }
  const { ipHash: _, userAgent: __, ...safeResult } = result;
  return NextResponse.json(safeResult);
}
