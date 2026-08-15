import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { UsersModel } from '@/lib/userDao';
import { setSessionCookie } from '@/lib/session';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const hashPasswordSha256 = (password: string) => {
  const salt = process.env.SALT_SHA_256_HASHING || 'SALT-SHA-256';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
};

const verifyPassword = async (password: string, hash: string) => {
  return await argon2.verify(hash, password);
};

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(username);

    let userData;
    if (isEmail) {
      userData = await UsersModel.findOne({ email: { $regex: new RegExp(`^${username}$`, 'i') } });
    } else {
      userData = await UsersModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    }

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = userData.password_version === 1
      ? await verifyPassword(password, userData.hashed_password)
      : hashPasswordSha256(password) === userData.hashed_password;

    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    setSessionCookie(response, { id: userData.supabase_id, username: userData.username });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Unexpected error in login route:', { message, stack });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
