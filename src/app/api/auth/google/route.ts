import { NextRequest, NextResponse } from 'next/server';
import {
  OAUTH_STATE_COOKIE_MAX_AGE,
  OAUTH_STATE_COOKIE_NAME,
  codeChallengeS256,
  generateOAuthSession,
  oauthStateCookieOptions,
  serializeOAuthSession,
} from '@/lib/google_oauth';

export const runtime = 'nodejs';

// Start the Google OAuth 2.0 authorization-code flow. The request is
// CSRF-protected with a random `state` bound to a single-use HttpOnly
// cookie, and PKCE (S256) binds the eventual authorization code to a
// code_verifier kept server-side (see src/lib/google_oauth.ts).
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google sign-in is not configured' }, { status: 501 });
  }

  const oauthSession = generateOAuthSession();
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/google`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    state: oauthSession.state,
    code_challenge: codeChallengeS256(oauthSession.codeVerifier),
    code_challenge_method: 'S256',
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const response = NextResponse.redirect(url);
  response.cookies.set(
    OAUTH_STATE_COOKIE_NAME,
    serializeOAuthSession(oauthSession),
    oauthStateCookieOptions(request, OAUTH_STATE_COOKIE_MAX_AGE)
  );
  return response;
}
