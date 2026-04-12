import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recordAnalyticsEvent } from '@/lib/repository';

const analyticsSchema = z.object({
  name: z.enum([
    'landing_view',
    'step1_start',
    'step1_complete',
    'step2_complete',
    'step3_complete',
    'ad_watched',
    'result_view',
    'share_click_kakao',
    'share_click_copy',
    'email_submit'
  ]),
  sessionId: z.string().optional(),
  params: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = analyticsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordAnalyticsEvent(parsed.data.sessionId || 'anonymous', parsed.data.name, parsed.data.params);
  return NextResponse.json({ ok: true });
}
