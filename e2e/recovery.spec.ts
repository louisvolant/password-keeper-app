// e2e/recovery.spec.ts
// Test for the recovery route intercepting stale browser-cached /:path* redirects.
import { test, expect } from '@playwright/test';

test.describe('Stale redirect recovery route', () => {
  test('intercepts /:path* and sends Clear-Site-Data header with auto-redirect', async ({ request }) => {
    const response = await request.get('/:path*', { maxRedirects: 0 });
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['clear-site-data']).toBe('"cache"');
    expect(headers['cache-control']).toContain('no-store');

    const html = await response.text();
    expect(html).toContain('cache_cleared');
    expect(html).toContain('serviceWorker');
  });

  test('intercepts encoded /%3Apath* as well', async ({ request }) => {
    const response = await request.get('/%3Apath*', { maxRedirects: 0 });
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['clear-site-data']).toBe('"cache"');
  });

  test('returns 404 for unrelated non-existent paths', async ({ request }) => {
    const response = await request.get('/non-existent-random-route-98765', { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });

  test('browser navigating to /:path* lands cleanly on homepage', async ({ page }) => {
    await page.goto('/:path*');
    // Wait for the client-side redirect to land on home
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
    await expect(page.locator('h2:has-text("Secure Your Digital Life")')).toBeVisible();
    expect(page.url()).toMatch(/^https?:\/\/[^/]+\/(\?cache_cleared=\d+)?$/);
  });
});
