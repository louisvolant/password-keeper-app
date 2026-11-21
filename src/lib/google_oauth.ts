// Shared OAuth 2.0 hardening helpers for the Google sign-in flow.
//
// CSRF / login-CSRF protection: the authorization request carries a random
// `state` echoed by Google and validated against a single-use HttpOnly
// cookie. Without this check an attacker can force a victim into the
// attacker's own Google session (login CSRF) and harvest whatever secrets
// the victim then stores in the account.
//
// PKCE (RFC 7636, S256): the authorization code is cryptographically bound
// to a `code_verifier` kept server-side in the same cookie, preventing
// authorization-code interception even if the code leaks through a referrer
// or a misconfigured redirect.

import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

// Single-use cookie binding an authorization request to the browser that
// initiated it. Scoped to /api/auth so it is never sent to other routes.
export const OAUTH_STATE_COOKIE_NAME = 'google_oauth_state';
export const OAUTH_STATE_COOKIE_MAX_AGE = 600; // seconds (10 minutes)

/** Build cookie attributes consistent across state issuance and clearing. */
export function oauthStateCookieOptions(request: NextRequest, maxAge: number) {
  const isHttps =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https';
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax' as const,
    maxAge,
    path: '/api/auth',
  };
}

/** Clear the single-use OAuth state cookie on responses leaving the callback. */
export function withClearedOAuthStateCookie(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', oauthStateCookieOptions(request, 0));
  return response;
}

export interface OAuthSession {
  state: string;
  codeVerifier: string;
}

export function generateOAuthSession(): OAuthSession {
  return {
    state: crypto.randomBytes(32).toString('hex'),
    // 48 random bytes base64url-encoded: within the 43-128 character
    // range required by RFC 7636 and from the unreserved character set.
    codeVerifier: crypto.randomBytes(48).toString('base64url'),
  };
}

export function serializeOAuthSession({ state, codeVerifier }: OAuthSession): string {
  return `${state}.${codeVerifier}`;
}

export function parseOAuthSession(value: string | undefined | null): OAuthSession | null {
  if (!value) {
    return null;
  }
  const separator = value.indexOf('.');
  if (separator <= 0) {
    return null;
  }
  return { state: value.slice(0, separator), codeVerifier: value.slice(separator + 1) };
}

// S256 code challenge derived from the verifier (RFC 7636 section 4.2).
export function codeChallengeS256(codeVerifier: string): string {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

// Constant-time comparison for the state echoed back by Google.
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}
