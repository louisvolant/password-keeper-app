import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { TemporaryContentModel } from '@/lib/userDao';
import { hashContentPassword } from '@/lib/password';
import { sealTemporaryContent } from '@/lib/temporary_content_crypto';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Maximum accepted plaintext size for a single secret. Generous for shared
// snippets and tokens while protecting MongoDB from oversized payloads.
const CONTENT_MAX_BYTES = 256 * 1024;

// Passwords protecting an individual link. Matches the client-side policy.
const CONTENT_PASSWORD_MIN_LENGTH = 8;

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    logger.info('Unauthorized access attempt to temporary content');
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in' }, { status: 401 });
  }

  const { strategy, max_date, password, content } = await request.json();

  if (
    !strategy ||
    !max_date ||
    !content ||
    !['oneread', 'multipleread'].includes(strategy) ||
    typeof content !== 'string' ||
    content.length === 0 ||
    Buffer.byteLength(content, 'utf8') > CONTENT_MAX_BYTES
  ) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
  }

  // The plaintext is encrypted server-side before it ever touches MongoDB.
  if (password !== null && password !== undefined) {
    if (typeof password !== 'string' || password.length < CONTENT_PASSWORD_MIN_LENGTH) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 400 });
    }
  }

  const expiresAt = new Date(max_date);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ success: false, error: 'Invalid expiration date' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const identifier = uuidv4();
    const hashedPassword = password ? await hashContentPassword(password) : null;
    const sealed = sealTemporaryContent(content);
    const createdAt = new Date();

    const newContent = await TemporaryContentModel.create({
      supabase_user_id: user.id.toString(),
      identifier,
      hashed_password: hashedPassword,
      max_date: expiresAt,
      encrypted_content: sealed.encryptedContent,
      iv: sealed.iv,
      auth_tag: sealed.authTag,
      strategy,
      created_at: createdAt,
    });

    return NextResponse.json({ success: true, identifier: newContent.identifier });
  } catch (err: unknown) {
    logger.error('Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
