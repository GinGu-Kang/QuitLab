import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { getAdminStats } from '@/lib/repository';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
