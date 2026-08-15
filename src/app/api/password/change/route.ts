import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UsersModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const hashPasswordArgon2 = async (password: string) => {
  return await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
};

export async function POST(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    logger.info('Attempted password change without authentication');
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in first' }, { status: 401 });
  }

  const { newpassword } = await request.json();

  if (!newpassword) {
    return NextResponse.json({ success: false, error: 'New password is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const hashedPassword = await hashPasswordArgon2(newpassword);

    const updatedUser = await UsersModel.findOneAndUpdate(
      { supabase_id: user.id },
      { hashed_password: hashedPassword, password_version: 1 },
      { new: true }
    );

    if (!updatedUser) {
      logger.info('No user found for update:', user.id);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    logger.info('Password changed successfully for user:', user.username);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Unexpected error in changepassword route:', {
      message,
      stack,
      userId: user.id
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
