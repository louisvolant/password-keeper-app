import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Mailjet from 'node-mailjet';
import { connectToDatabase } from '@/lib/db';
import { UsersModel, PasswordResetTokensModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY || '',
  apiSecret: process.env.MAILJET_API_SECRET || ''
});

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await UsersModel.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await PasswordResetTokensModel.findOneAndUpdate(
      { supabase_user_id: user.supabase_id, token },
      {
        supabase_user_id: user.supabase_id,
        token,
        expires_at: expiresAt,
        created_at: new Date()
      },
      { upsert: true, new: true }
    );

    const baseUrl = process.env.FRONTEND_URL || request.nextUrl.origin;
    const resetUrl = `${baseUrl}/passwordrenew?token=${token}`;

    if (process.env.MAILJET_API_KEY && process.env.MAILJET_API_SECRET) {
      await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [{
          From: {
            Email: process.env.MAILJET_SENDER_EMAIL || 'contact@securaised.net',
            Name: "Your App"
          },
          To: [{ Email: email }],
          Subject: "Password Reset Request",
          TextPart: `Click this link to reset your password: ${resetUrl}`,
          HTMLPart: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 24 hours.</p>`
        }]
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    logger.error('Error in password reset request:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
