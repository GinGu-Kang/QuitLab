import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ZodError } from 'zod';

import { hashIp } from '@/lib/crypto';
import { getPublishedMasterData } from '@/lib/master-data';
import { MATCHING_ENGINE_VERSION } from '@/lib/matching-engine';
import { matchStartups } from '@/lib/matching';
import { saveResult } from '@/lib/repository';
import { diagnoseInputSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = diagnoseInputSchema.parse(body);
    const masterData = await getPublishedMasterData();
    const results = matchStartups(parsed, masterData);
    const sessionId = crypto.randomUUID();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    await saveResult(parsed, sessionId, results, {
      userAgent: req.headers.get('user-agent'),
      ipHash: hashIp(ip),
      masterDataReleaseId: masterData.releaseId,
      masterDataVersion: masterData.version,
      matchingEngineVersion: MATCHING_ENGINE_VERSION
    });

    return NextResponse.json({ sessionId, results });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
