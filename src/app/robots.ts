// src/app/robots.ts
// Native Next.js robots.txt: allow crawling of public pages, block private
// application areas, and point crawlers at the sitemap.
import type { MetadataRoute } from "next";

const SITE_URL = "https://www.securaised.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/passwordchange",
          "/passwordrenew",
          "/securecontent",
          "/securelinkview",
          "/temporarycontent",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
