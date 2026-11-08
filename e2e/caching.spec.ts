// e2e/caching.spec.ts
// Contract tests verifying edge caching headers for public pages, static metadata, and API routes.
import { test, expect } from '@playwright/test';

test.describe('Edge Caching Headers', () => {
  test('public pages expose Cloudflare edge caching headers', async ({ request }) => {
    const publicPaths = [
      '/',
      '/confidentiality-rules',
      '/general-conditions',
      '/passwordlost',
      '/temporarycontent',
    ];

    for (const path of publicPaths) {
      const response = await request.get(path);
      expect(response.status(), `GET ${path}`).toBe(200);

      const headers = response.headers();
      expect(headers['cdn-cache-control'], `CDN-Cache-Control on ${path}`).toBe(
        'public, max-age=86400, stale-while-revalidate=3600'
      );
      expect(headers['cloudflare-cdn-cache-control'], `Cloudflare-CDN-Cache-Control on ${path}`).toBe(
        'public, max-age=86400, stale-while-revalidate=3600'
      );
      // In production and Cloudflare Edge, Cache-Control specifies s-maxage=86400.
      // In dev server, Next.js forces no-cache for fast refresh/HMR, but preserves CDN headers.
      if (headers['cache-control'] && !headers['cache-control'].includes('no-cache')) {
        expect(headers['cache-control']).toContain('s-maxage=86400');
        expect(headers['cache-control']).toContain('must-revalidate');
      }
    }
  });

  test('static metadata routes expose edge caching headers', async ({ request }) => {
    const metaPaths = ['/robots.txt', '/sitemap.xml', '/manifest.webmanifest'];

    for (const path of metaPaths) {
      const response = await request.get(path);
      expect(response.status(), `GET ${path}`).toBe(200);

      const headers = response.headers();
      expect(headers['cdn-cache-control'], `CDN-Cache-Control on ${path}`).toBe(
        'public, max-age=86400, stale-while-revalidate=3600'
      );
      expect(headers['cloudflare-cdn-cache-control'], `Cloudflare-CDN-Cache-Control on ${path}`).toBe(
        'public, max-age=86400, stale-while-revalidate=3600'
      );
      expect(headers['cache-control'], `Cache-Control on ${path}`).toContain('s-maxage=86400');
    }
  });

  test('dynamic API routes enforce no-store at edge and browser', async ({ request }) => {
    const response = await request.post('/api/check-auth');
    const headers = response.headers();

    expect(headers['cache-control'], 'API Cache-Control').toContain('no-store');
    expect(headers['cdn-cache-control'], 'API CDN-Cache-Control').toBe('no-store');
    expect(headers['cloudflare-cdn-cache-control'], 'API Cloudflare-CDN-Cache-Control').toBe('no-store');
  });
});
