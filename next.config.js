// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['argon2', 'mongoose', 'node-mailjet', 'winston'],
};

if (process.env.NODE_ENV === 'development') {
  import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
}

module.exports = nextConfig;