import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface SessionUser {
  id: string;
  username: string;
}

const COOKIE_NAME = 'session';
const SECRET_KEY = process.env.SESSION_COOKIE_KEY;

function getKey(): Buffer {
  if (!SECRET_KEY) {
    throw new Error('SESSION_COOKIE_KEY is not set');
  }
  return crypto.createHash('sha256').update(SECRET_KEY).digest();
}

export function encryptSession(user: SessionUser): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = JSON.stringify(user);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decryptSession(token: string): SessionUser | null {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(request?: NextRequest): Promise<SessionUser | null> {
  let token: string | undefined;
  if (request) {
    token = request.cookies.get(COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }
  if (!token) return null;
  return decryptSession(token);
}

export function setSessionCookie(res: NextResponse, user: SessionUser): void {
  const token = encryptSession(user);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 1 day in seconds
    path: '/',
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
