import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
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

  const { strategy, max_date, password, iv, encoded_content } = await request.json();

  if (!strategy || !max_date || !encoded_content || !iv || !['oneread', 'multipleread'].includes(strategy)) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const identifier = uuidv4();
    const hashedPassword = password ? await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 }) : null;
    const createdAt = new Date();

    const newContent = await TemporaryContentModel.create({
      supabase_user_id: user.id.toString(),
      identifier,
      hashed_password: hashedPassword,
      max_date,
      encoded_content,
      iv,
      strategy,
      created_at: createdAt,
    });

    return NextResponse.json({ success: true, identifier: newContent.identifier });
  } catch (err: unknown) {
    logger.error('Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
