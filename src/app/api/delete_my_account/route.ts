import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { UsersModel, TemporaryContentModel } from '@/lib/userDao';
import { verifyPassword } from '@/lib/password';
import { deleteUserVault, getVaultBucket } from '@/lib/vault';
import { clearSessionCookie } from '@/lib/session';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    logger.info('Attempted account deletion without a valid session');
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in first' }, { status: 401 });
  }

  const { currentpassword } = await request.json();

  if (!currentpassword || typeof currentpassword !== 'string') {
    return NextResponse.json({ success: false, error: 'Current password is required' }, { status: 400 });
  }

  // Destructive, irreversible action: a stolen session cookie must never be
  // enough to wipe every user secret.
  const isValid = await verifyPassword(user.hashed_password, user.password_version, currentpassword);
  if (!isValid) {
    logger.info('Account deletion rejected: invalid current password', { userId: user.id });
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const userId = user.id;

  try {
    await connectToDatabase();
    await TemporaryContentModel.deleteMany({ supabase_user_id: userId });
    const bucket = getVaultBucket();
    if (bucket) {
      await deleteUserVault(bucket, userId);
    }
    await UsersModel.deleteOne({ supabase_id: userId });

    const response = NextResponse.json({
      success: true,
      message: 'Account and all associated data successfully deleted'
    });
    clearSessionCookie(response);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Account deletion failed:', { message, userId });
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 });
  }
}
