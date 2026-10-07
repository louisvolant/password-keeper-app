// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['argon2', 'mongoose', 'node-mailjet', 'winston'],
  redirects: async () => [
    // Legacy "coming soon" feature pages that never shipped (Search Console 404s).
    { source: '/access-audit', destination: '/', permanent: true },
    { source: '/version-history', destination: '/', permanent: true },
    // Canonical host: apex must redirect to the www domain used in
    // metadataBase, sitemap.xml and robots.txt.
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'securaised.net' }],
      destination: 'https://www.securaised.net/:path*',
      permanent: true,
    },
  ],
};

if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
}

module.exports = nextConfig;