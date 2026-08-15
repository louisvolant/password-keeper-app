import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import argon2 from 'argon2';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { UsersModel } from '@/lib/userDao';
import { setSessionCookie } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const redirectUri = process.env.REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback/google`;

    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }
    );

    const { access_token } = tokenResponse.data;

    const userInfo = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email } = userInfo.data;

    let userData = await UsersModel.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!userData) {
      const randomStr = Math.random().toString(36).substring(2, 10);
      const username = `user_${randomStr}`;
      const password = Math.random().toString(36).slice(-15);
      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      userData = await UsersModel.create({
        email,
        username,
        hashed_password: hashedPassword,
        password_version: 1,
        supabase_id: crypto.randomUUID(),
      });
    }

    const frontendCallbackUrl = `${request.nextUrl.origin}/account`;
    const response = NextResponse.redirect(frontendCallbackUrl);
    setSessionCookie(response, { id: userData.supabase_id, username: userData.username });
    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
