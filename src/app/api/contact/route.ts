import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { createResultEmail } from '@/lib/email-template';
import { encryptPhone, hashIp, hashPhone } from '@/lib/crypto';
import { getResultBySession, saveContact } from '@/lib/repository';
import { resend } from '@/lib/resend';
import { contactInputSchema } from '@/lib/validation';
import { createId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactInputSchema.parse(body);
    const result = await getResultBySession(parsed.sessionId);

    if (!result) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 404 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const now = new Date().toISOString();

    const contact = await saveContact(parsed, {
      userResultId: result.id,
      sessionId: parsed.sessionId,
      name: parsed.name,
      email: parsed.email,
      phoneEncrypted: encryptPhone(parsed.phone),
      phoneHash: hashPhone(parsed.phone),
      privacyConsent: parsed.privacyConsent,
      privacyConsentAt: now,
      marketingConsent: parsed.marketingConsent,
      marketingConsentAt: parsed.marketingConsent ? now : null,
      consentIpHash: hashIp(ip),
      consentUserAgent: req.headers.get('user-agent'),
      unsubscribedAt: null,
      unsubscribeToken: createId('unsub')
    });

    if (contact && resend) {
      const email = createResultEmail(contact, result);
      try {
        await resend.emails.send({
          from: 'Quit Codex <onboarding@resend.dev>',
          to: parsed.email,
          subject: email.subject,
          html: email.html
        });
      } catch (emailError) {
        console.error('Failed to send result email:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || '잘못된 입력입니다.' }, { status: 400 });
    }
    return NextResponse.json({ error: '결과 저장에 실패했습니다.' }, { status: 500 });
  }
}
