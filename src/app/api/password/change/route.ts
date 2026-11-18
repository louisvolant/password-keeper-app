import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { UsersModel } from '@/lib/userDao';
import { verifyPassword, hashPassword } from '@/lib/password';
import { setSessionCookie } from '@/lib/session';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Minimum length for account passwords, consistent with registration.
const NEW_PASSWORD_MIN_LENGTH = 15;

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    logger.info('Attempted password change without a valid session');
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in first' }, { status: 401 });
  }

  const { currentpassword, newpassword } = await request.json();

  if (!currentpassword || !newpassword) {
    return NextResponse.json(
      { success: false, error: 'Current password and new password are required' },
      { status: 400 }
    );
  }

  if (typeof newpassword !== 'string' || newpassword.length < NEW_PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { success: false, error: `New password must be at least ${NEW_PASSWORD_MIN_LENGTH} characters long` },
      { status: 400 }
    );
  }

  // Re-verify identity: a stolen session cookie must never be enough to
  // take over the account permanently.
  const isValidCurrent = await verifyPassword(user.hashed_password, user.password_version, currentpassword);
  if (!isValidCurrent) {
    logger.info('Password change rejected: invalid current password', { userId: user.id });
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { hash: hashedPassword, version: passwordVersion } = await hashPassword(newpassword);

    // Increment the rotation counter: every other session (including any
    // stolen cookie) is revoked by the check in src/lib/auth.ts.
    const updatedUser = await UsersModel.findOneAndUpdate(
      { supabase_id: user.id },
      {
        hashed_password: hashedPassword,
        password_version: passwordVersion,
        $inc: { password_rotation: 1 },
      },
      { new: true }
    );

    if (!updatedUser) {
      logger.info('No user found for update:', user.id);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Re-issue the caller's own session with the new rotation so the
    // current browser stays logged in.
    const response = NextResponse.json({ success: true });
    setSessionCookie(response, {
      id: user.id,
      username: user.username,
      password_rotation: updatedUser.password_rotation ?? undefined,
    });
    return response;
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
