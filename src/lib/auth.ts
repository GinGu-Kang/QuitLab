import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'quit-admin-session';

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ENCRYPTION_KEY || 'quit-codex-admin-secret';
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function createAdminSessionToken(email: string) {
  const payload = `${email}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string) {
  const [email, ts, signature] = token.split('.');
  if (!email || !ts || !signature) return null;
  const payload = `${email}.${ts}`;
  if (sign(payload) !== signature) return null;
  return { email, issuedAt: Number(ts) };
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  };
}

export function setAdminSession(email: string) {
  cookies().set(COOKIE_NAME, createAdminSessionToken(email), getAdminCookieOptions());
}

export function clearAdminSession() {
  cookies().delete(COOKIE_NAME);
}

export function getAdminSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
