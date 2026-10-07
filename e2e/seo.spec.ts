// e2e/seo.spec.ts
// SEO contract tests: canonical tags on indexable pages, noindex on private
// pages, sitemap/robots output, and legacy redirect cleanup.
import { test, expect } from '@playwright/test';

const SITE_URL = 'https://www.securaised.net';

test.describe('SEO metadata', () => {
  test('home page declares its canonical URL', async ({ page }) => {
    await page.goto('/');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', SITE_URL);
    await expect(canonical).not.toHaveAttribute('href', 'http://');
  });

  test('indexable pages declare canonical HTTPS www URLs', async ({ request }) => {
    const paths = ['/', '/confidentiality-rules', '/general-conditions', '/passwordlost'];
    for (const path of paths) {
      const response = await request.get(path);
      expect(response.status(), `GET ${path}`).toBe(200);
      const html = await response.text();
      // Next.js normalizes the root canonical without a trailing slash.
      const expectedHref = path === '/' ? SITE_URL : `${SITE_URL}${path}`;
      expect(html, `canonical for ${path}`).toContain(`<link rel="canonical" href="${expectedHref}"`);
      expect(html, `canonical must be https://www for ${path}`).not.toContain('rel="canonical" href="http://');
    }
  });

  test('private pages are marked noindex', async ({ request }) => {
    const paths = [
      '/account',
      '/passwordchange',
      '/passwordrenew',
      '/securecontent',
      '/temporarycontent',
      '/securelinkview/00000000-0000-0000-0000-000000000000',
    ];
    for (const path of paths) {
      const response = await request.get(path);
      expect(response.status(), `GET ${path}`).toBe(200);
      const html = await response.text();
      expect(html, `noindex for ${path}`).toContain('name="robots" content="noindex');
    }
  });
});

test.describe('SEO sitemap & robots', () => {
  test('sitemap.xml lists only indexable pages', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<loc>https://www.securaised.net</loc>');
    for (const path of ['/confidentiality-rules', '/general-conditions', '/passwordlost']) {
      expect(body).toContain(`<loc>${SITE_URL}${path}</loc>`);
    }
    // private pages must never be invited into the sitemap
    for (const path of ['/account', '/passwordchange', '/securecontent', '/temporarycontent']) {
      expect(body).not.toContain(`<loc>${SITE_URL}${path}</loc>`);
    }
  });

  test('robots.txt disallows private pages and exposes the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Sitemap: https://www.securaised.net/sitemap.xml');
    for (const path of ['/account', '/passwordchange', '/securecontent', '/temporarycontent']) {
      expect(body).toContain(`Disallow: ${path}`);
    }
  });
});
