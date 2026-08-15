import { NextRequest, NextResponse } from 'next/server';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/db';
import { UsersModel, UserFileTreeModel, UserContentModel } from '@/lib/userDao';
import { setSessionCookie } from '@/lib/session';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const hashPasswordArgon2 = async (password: string) => {
  return await argon2.hash(password, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });
};

export async function POST(request: NextRequest) {
  const { username, email, password } = await request.json();

  if (!username || !email || !password || password.length < 15) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const existingUser = await UsersModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPasswordArgon2(password);
    const createdAt = new Date();
    const userId = uuidv4();
    const defaultFileUUID = uuidv4();

    await UsersModel.create({
      supabase_id: userId,
      username,
      email,
      hashed_password: hashedPassword,
      password_version: 1,
      created_at: createdAt,
    });

    await UserFileTreeModel.findOneAndUpdate(
      { supabase_user_id: userId },
      {
        supabase_user_id: userId,
        file_tree: '["default"]',
        created_at: createdAt,
        updated_at: createdAt,
      },
      { upsert: true, new: true }
    );

    await UserContentModel.findOneAndUpdate(
      { supabase_user_id: userId, file_path: 'default' },
      {
        supabase_user_id: userId,
        file_path: 'default',
        file_uuid: defaultFileUUID,
        encoded_content: '',
        created_at: createdAt,
        updated_at: createdAt,
      },
      { upsert: true, new: true }
    );

    const response = NextResponse.json({ success: true });
    setSessionCookie(response, { id: userId, username });
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Registration error:', error);
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 });
  }
}
