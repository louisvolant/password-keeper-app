import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UsersModel } from '@/lib/userDao';
import { verifyPassword } from '@/lib/password';
import { setSessionCookie } from '@/lib/session';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

interface LoginUserDoc {
  supabase_id: string;
  username: string;
  hashed_password: string;
  password_version?: number;
  password_rotation?: number;
}

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

    // Use `.lean()` so pre-migration accounts without a persisted `password_rotation`
    // keep `undefined` rather than getting schema `default: 1` hydrated in memory,
    // matching `getAuthenticatedUser()` in src/lib/auth.ts.
    const filter = isEmail
      ? { email: { $regex: new RegExp(`^${username}$`, 'i') } }
      : { username: { $regex: new RegExp(`^${username}$`, 'i') } };
    const userData = await UsersModel.findOne(filter).lean<LoginUserDoc>();

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(
      userData.hashed_password,
      userData.password_version,
      password
    );

    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    // Embed the user's password-rotation counter so the session is revoked
    // automatically when the password next changes (see src/lib/auth.ts).
    setSessionCookie(response, {
      id: userData.supabase_id,
      username: userData.username,
      password_rotation: userData.password_rotation ?? undefined,
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Unexpected error in login route:', { message, stack });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
