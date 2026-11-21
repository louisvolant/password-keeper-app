// e2e/oauth-security.spec.ts
// Verifies the Google OAuth authorization request carries CSRF protections
// (single-use state cookie + PKCE S256), that the callback rejects mismatched
// or missing state before exchanging anything with Google, and that
// session-rotation checks remain compatible with pre-migration accounts.
import { test, expect } from '@playwright/test';
import { isSessionRotationValid } from '../src/lib/auth';

test.describe('Google OAuth state & PKCE hardening', () => {
  test('authorization redirect includes state and S256 code challenge', async ({ request }) => {
    const response = await request.get('/api/auth/google', { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);

    const location = response.headers()['location'];
    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');

    const url = new URL(location);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{64}$/);
    // RFC 7636: base64url-encoded SHA-256 challenge (43 characters).
    expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');

    // The state is bound to a single-use HttpOnly cookie scoped to /api/auth.
    const setCookie = response.headers()['set-cookie'] ?? '';
    expect(setCookie).toContain('google_oauth_state=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/api/auth');
  });

  test('each authorization request uses a fresh state', async ({ request }) => {
    const first = await request.get('/api/auth/google', { maxRedirects: 0 });
    const second = await request.get('/api/auth/google', { maxRedirects: 0 });

    const state1 = new URL(first.headers()['location']).searchParams.get('state');
    const state2 = new URL(second.headers()['location']).searchParams.get('state');

    expect(state1).toBeTruthy();
    expect(state2).toBeTruthy();
    expect(state1).not.toBe(state2);
  });

  test('callback rejects a mismatched state (login-CSRF attempt)', async ({ request }) => {
    // Obtain a legitimate state cookie, then attack with a forged state.
    const authorize = await request.get('/api/auth/google', { maxRedirects: 0 });
    expect(authorize.status()).toBeLessThan(400);

    const callback = await request.get(
      '/api/auth/callback/google?code=forged-code&state=forged-state',
      { maxRedirects: 0 }
    );

    expect(callback.status()).toBe(403);
    const body = await callback.json();
    expect(body.error).toBe('Invalid OAuth state');

    // No session cookie is ever issued on a rejected callback.
    const setCookie = callback.headers()['set-cookie'] ?? '';
    expect(setCookie).not.toContain('session=');
  });

  test('callback without any state cookie is rejected', async ({ request }) => {
    const callback = await request.get(
      '/api/auth/callback/google?code=forged-code&state=whatever',
      { maxRedirects: 0 }
    );

    expect(callback.status()).toBe(403);
    const body = await callback.json();
    expect(body.error).toBe('Invalid OAuth state');
  });

  test('callback without an authorization code is rejected', async ({ request }) => {
    const callback = await request.get('/api/auth/callback/google', { maxRedirects: 0 });
    expect(callback.status()).toBe(400);
  });

  test('session rotation helper accepts pre-migration users and rejects stale sessions', async () => {
    expect(isSessionRotationValid(undefined, undefined)).toBe(true);
    expect(isSessionRotationValid(1, 1)).toBe(true);
    expect(isSessionRotationValid(1, undefined)).toBe(false);
    expect(isSessionRotationValid(undefined, 1)).toBe(false);
    expect(isSessionRotationValid(2, 1)).toBe(false);
  });
});
