import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { TemporaryContentModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getSession(request);
  if (!user) {
    logger.info('Unauthorized access attempt to temporary content');
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const contents = await TemporaryContentModel.find(
      { supabase_user_id: user.id.toString() },
      'identifier max_date'
    );

    const links = contents.map(item => ({
      identifier: item.identifier,
      max_date: item.max_date
    }));

    logger.info('User temporary content fetched successfully:', {
      userId: user.id,
      linkCount: links.length,
    });
    return NextResponse.json({ success: true, links });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Unexpected error in getusertemporarycontent:', {
      message,
      stack,
      userId: user.id,
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
