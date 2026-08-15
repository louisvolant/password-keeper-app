// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['argon2', '@swc/core', 'mongoose', 'node-mailjet', 'winston']
  // Other settings
};

module.exports = nextConfig;