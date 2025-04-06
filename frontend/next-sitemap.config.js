/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.securaised.net',
  generateRobotsTxt: true, // Enable robots.txt generation
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*', // Apply to all user agents
        allow: '/',     // Allow the root
        disallow: [
          '/passwordchange/',   // Disallow specific paths
          '/securecontent/',
          '/temporarycontent/',
        ],
      },
    ],
    additionalSitemaps: [
      'https://www.securaised.net/sitemap.xml', // Explicitly specify the sitemap URL
    ],
  },
};