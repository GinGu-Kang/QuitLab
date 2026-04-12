import { NextResponse } from 'next/server';

import { unsubscribeContact } from '@/lib/repository';

export async function POST(_: Request, { params }: { params: { token: string } }) {
  const success = await unsubscribeContact(params.token);
  if (!success) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
