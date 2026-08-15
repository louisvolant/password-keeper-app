import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession, clearSessionCookie } from '@/lib/session';
import { UsersModel, UserContentModel, UserFileTreeModel, TemporaryContentModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    logger.info('Attempted account deletion without authentication');
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in first' }, { status: 401 });
  }

  const userId = user.id;

  try {
    await connectToDatabase();
    await TemporaryContentModel.deleteMany({ supabase_user_id: userId });
    await UserContentModel.deleteMany({ supabase_user_id: userId });
    await UserFileTreeModel.deleteMany({ supabase_user_id: userId });
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
    return NextResponse.json({ success: false, error: 'Failed to delete account', details: message }, { status: 500 });
  }
}
