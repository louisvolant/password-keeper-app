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
};

if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
}

module.exports = nextConfig;