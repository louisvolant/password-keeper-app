// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['argon2', 'mongoose', 'node-mailjet', 'winston'],
  redirects: async () => [
    // Legacy "coming soon" feature pages that never shipped (Search Console 404s).
    { source: '/access-audit', destination: '/', permanent: true },
    { source: '/version-history', destination: '/', permanent: true },
  ],
  headers: async () => [
    {
      // Public indexable and static informational pages: cache at Cloudflare Edge
      // - Cloudflare CDN caches for 24h (s-maxage=86400, CDN-Cache-Control)
      // - Browsers must revalidate (max-age=0, must-revalidate) so client refreshes always receive current build
      source: '/:path(confidentiality-rules|general-conditions|passwordlost|temporarycontent)?',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, s-maxage=86400, must-revalidate',
        },
        {
          key: 'CDN-Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=3600',
        },
        {
          key: 'Cloudflare-CDN-Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=3600',
        },
      ],
    },
    {
      // Static metadata routes
      source: '/:file(robots\\.txt|sitemap\\.xml|manifest\\.webmanifest)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=0, s-maxage=86400, must-revalidate',
        },
        {
          key: 'CDN-Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=3600',
        },
        {
          key: 'Cloudflare-CDN-Cache-Control',
          value: 'public, max-age=86400, stale-while-revalidate=3600',
        },
      ],
    },
    {
      // Dynamic API routes: must NEVER be cached by any edge CDN or browser
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
        {
          key: 'CDN-Cache-Control',
          value: 'no-store',
        },
        {
          key: 'Cloudflare-CDN-Cache-Control',
          value: 'no-store',
        },
      ],
    },
  ],
};

if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
}

module.exports = nextConfig;
