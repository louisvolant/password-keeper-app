import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { UsersModel } from '@/lib/userDao';
import { hashPassword } from '@/lib/password';
import { setSessionCookie } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`;

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
      const randomStr = crypto.randomBytes(4).toString('hex');
      const username = `user_${randomStr}`;
      const password = crypto.randomBytes(32).toString('hex');
      const { hash: hashedPassword, version: passwordVersion } = await hashPassword(password);

      userData = await UsersModel.create({
        email,
        username,
        hashed_password: hashedPassword,
        password_version: passwordVersion,
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
