// e2e/pwa.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PWA & Mobile Viewport', () => {
  test('manifest.webmanifest serves valid PWA manifest', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('Securaised - Password Keeper');
    expect(manifest.short_name).toBe('Securaised');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    const sizes = manifest.icons.map((i: { sizes?: string }) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  test('PWA icons and favicon are accessible', async ({ request }) => {
    const icons = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/icon-192.png',
      '/icon-512.png',
      '/icon-maskable-192.png',
      '/icon-maskable-512.png',
    ];

    for (const icon of icons) {
      const response = await request.get(icon);
      expect(response.status(), `GET ${icon}`).toBe(200);
      const buffer = await response.body();
      expect(buffer.length, `${icon} should not be empty`).toBeGreaterThan(100);
    }
  });

  test('service worker sw.js is accessible', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    const content = await response.text();
    expect(content).toContain('CACHE_NAME');
    expect(content).toContain('addEventListener');
  });

  test('home page includes required PWA and iOS meta tags', async ({ page }) => {
    await page.goto('/');

    // Web manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);

    // Apple touch icon
    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveCount(1);
    await expect(appleIcon).toHaveAttribute('href', expect.stringContaining('apple-touch-icon.png'));

    // Apple web app capable
    const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleCapable).toHaveAttribute('content', 'yes');

    // Apple status bar style
    const appleStatus = page.locator('meta[name="apple-mobile-web-app-status-bar-style"]');
    await expect(appleStatus).toHaveAttribute('content', 'default');

    // Viewport tag with viewport-fit=cover
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', expect.stringContaining('viewport-fit=cover'));
  });

  test('no horizontal scroll on mobile viewport', async ({ page }) => {
    // Test on iPhone standard viewport (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const isHorizontalScrollPresent = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isHorizontalScrollPresent).toBe(false);

    // Test on extra small screen (320x568)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.reload();

    const isHorizontalScrollPresent320 = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isHorizontalScrollPresent320).toBe(false);
  });
});
