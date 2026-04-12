import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/auth';
import { buildMarketingCsv } from '@/lib/repository';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csv = await buildMarketingCsv();
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="marketing-customers.csv"'
    }
  });
}
