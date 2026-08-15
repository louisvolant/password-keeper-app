import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { TemporaryContentModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    logger.info('Unauthorized access attempt to temporary content');
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in' }, { status: 401 });
  }

  const { identifier } = await request.json();

  if (!identifier) {
    logger.info('Missing identifier in deleteusertemporarycontent');
    return NextResponse.json({ success: false, error: 'Identifier is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const result = await TemporaryContentModel.deleteOne({
      identifier,
      supabase_user_id: user.id.toString()
    });

    if (result.deletedCount === 0) {
      logger.info('Content not found or unauthorized deletion attempt:', {
        identifier,
        userId: user.id,
      });
      return NextResponse.json({ success: false, error: 'Content not found or unauthorized' }, { status: 404 });
    }

    logger.info('Temporary content deleted successfully:', {
      identifier,
      userId: user.id,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Unexpected error in deleteusertemporarycontent:', {
      message,
      stack,
      userId: user.id,
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
