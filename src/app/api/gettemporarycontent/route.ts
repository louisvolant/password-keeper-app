import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { connectToDatabase } from '@/lib/db';
import { TemporaryContentModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get('identifier');
  const password = request.nextUrl.searchParams.get('password');

  if (!identifier) {
    return NextResponse.json({ success: false, error: 'Identifier is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const content = await TemporaryContentModel.findOne({ identifier });

    if (!content) {
      logger.info('Content not found or expired:', { identifier });
      return NextResponse.json({ success: false, error: 'Content not found or expired' }, { status: 404 });
    }

    const now = new Date();
    if (new Date(content.max_date) < now) {
      await TemporaryContentModel.deleteOne({ identifier });
      logger.info('Expired content deleted:', { identifier });
      return NextResponse.json({ success: false, error: 'Content has expired' }, { status: 410 });
    }

    if (content.hashed_password) {
      if (!password) {
        return NextResponse.json({ success: false, error: 'Password required' }, { status: 403 });
      }
      const isValid = await argon2.verify(content.hashed_password, password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 403 });
      }
    }

    const response = {
      success: true,
      content: content.encoded_content,
      iv: content.iv
    };

    if (content.strategy === 'oneread') {
      await TemporaryContentModel.deleteOne({ identifier });
      logger.info('One-read content deleted after access:', { identifier });
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error('Error in gettemporarycontent:', {
      message,
      stack,
      identifier
    });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
