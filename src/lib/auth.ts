import crypto from 'crypto';
import os from 'os';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'quit-admin-session';
let warnedAboutAdminSecret = false;

function getSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET;
  if (configuredSecret) return configuredSecret;

  const fingerprint = [
    process.cwd(),
    os.hostname(),
    os.userInfo().username,
    process.env.VERCEL_URL,
    process.env.HOSTNAME
  ]
    .filter(Boolean)
    .join(':');

  if (!warnedAboutAdminSecret) {
    warnedAboutAdminSecret = true;
    console.warn('ADMIN_SESSION_SECRET is not configured. Falling back to a machine-local development secret.');
  }

  return crypto.createHash('sha256').update(`quit-codex-admin:${fingerprint}`).digest('hex');
}

function shouldUseSecureCookie() {
  if (process.env.NODE_ENV !== 'production') return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const url = new URL(appUrl);
    const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
    return !(url.protocol === 'http:' && isLocalHost);
  } catch {
    return true;
  }
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function createAdminSessionToken(email: string) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      issuedAt: Date.now()
    })
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string) {
  const lastSeparator = token.lastIndexOf('.');
  if (lastSeparator === -1) return null;

  const payload = token.slice(0, lastSeparator);
  const signature = token.slice(lastSeparator + 1);
  if (!payload || !signature) return null;
  if (sign(payload) !== signature) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string;
      issuedAt?: number;
    };

    if (!parsed.email || typeof parsed.issuedAt !== 'number') return null;
    return { email: parsed.email, issuedAt: parsed.issuedAt };
  } catch {
    return null;
  }
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: shouldUseSecureCookie(),
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
