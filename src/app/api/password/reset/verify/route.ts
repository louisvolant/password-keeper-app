import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { PasswordResetTokensModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const tokenDoc = await PasswordResetTokensModel.findOne({ token });

    if (!tokenDoc || new Date(tokenDoc.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logger.error('Error verifying reset token:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
