import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { PasswordResetTokensModel, UsersModel } from '@/lib/userDao';
import { hashPassword } from '@/lib/password';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { token, newpassword } = await request.json();

  if (!token || !newpassword) {
    return NextResponse.json({ success: false, error: 'Token and new password are required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const tokenDoc = await PasswordResetTokensModel.findOne({ token });

    if (!tokenDoc || new Date(tokenDoc.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
    }

    const { hash: hashedPassword, version: passwordVersion } = await hashPassword(newpassword);

    const userUpdate = await UsersModel.findOneAndUpdate(
      { supabase_id: tokenDoc.supabase_user_id },
      { hashed_password: hashedPassword, password_version: passwordVersion },
      { new: true }
    );

    if (!userUpdate) {
      logger.error('Failed to update password: User not found');
      return NextResponse.json({ success: false, error: 'Failed to reset password' }, { status: 500 });
    }

    await PasswordResetTokensModel.deleteOne({ token });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logger.error('Error in password reset:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
