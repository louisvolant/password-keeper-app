import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { UsersModel } from '@/lib/userDao';
import { hashPassword } from '@/lib/password';
import { setSessionCookie } from '@/lib/session';
import {
  OAUTH_STATE_COOKIE_NAME,
  parseOAuthSession,
  safeEqual,
} from '@/lib/google_oauth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Clear the single-use OAuth state cookie on every response leaving the
// callback, whatever the outcome.
function withClearedStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/api/auth',
  });
  return response;
}

// Finish the Google OAuth 2.0 flow. Before anything is exchanged with
// Google, the echoed `state` must match the single-use HttpOnly cookie set
// at /api/auth/google; otherwise this is a CSRF / login-CSRF attempt or a
// replayed callback and the request is rejected without any code exchange.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const oauthSession = parseOAuthSession(request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value);

  if (!code) {
    return withClearedStateCookie(
      NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
    );
  }

  if (!oauthSession || !state || !safeEqual(oauthSession.state, state)) {
    logger.info('Google OAuth callback rejected: invalid state');
    return withClearedStateCookie(
      NextResponse.json({ error: 'Invalid OAuth state' }, { status: 403 })
    );
  }

  try {
    await connectToDatabase();
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`;

    // The code_verifier completes the PKCE proof: Google only releases
    // tokens when it matches the S256 challenge from the authorize request.
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: oauthSession.codeVerifier,
      }
    );

    const { access_token } = tokenResponse.data;

    const userInfo = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const { email } = userInfo.data;
    if (!email || userInfo.data.verified_email === false) {
      return withClearedStateCookie(
        NextResponse.json({ error: 'Google account email is not verified' }, { status: 403 })
      );
    }

    // Case-insensitive exact match via collation. Never build a RegExp
    // from externally sourced input.
    let userData = await UsersModel.findOne({ email }).collation({ locale: 'en', strength: 2 });

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
    // Embed the user's password-rotation counter so the session is revoked
    // automatically when the password next changes (see src/lib/auth.ts).
    setSessionCookie(response, {
      id: userData.supabase_id,
      username: userData.username,
      password_rotation: userData.password_rotation ?? 1,
    });
    return withClearedStateCookie(response);
  } catch (error) {
    logger.error('Google OAuth error:', { error });
    return withClearedStateCookie(
      NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    );
  }
}
