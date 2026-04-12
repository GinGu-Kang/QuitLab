import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ADMIN_COOKIE_NAME, createAdminSessionToken, getAdminCookieOptions } from '@/lib/auth';
import { getAdminUser } from '@/lib/repository';
import { adminLoginSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.parse(body);
    const admin = await getAdminUser(parsed.email);
    if (!admin) {
      return NextResponse.json({ error: '등록된 관리자 계정이 없습니다.' }, { status: 401 });
    }

    const passwordHash = 'passwordHash' in admin ? admin.passwordHash : '';
    const matched = await bcrypt.compare(parsed.password, passwordHash);
    if (!matched) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(parsed.email), getAdminCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || '잘못된 입력입니다.' }, { status: 400 });
    }
    return NextResponse.json({ error: '로그인에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
