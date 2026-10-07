// src/app/sitemap.ts
// Native Next.js sitemap: single source of truth, no external generator needed.
// Only lists public, indexable pages (private pages are disallowed in robots.ts).
import type { MetadataRoute } from "next";

const SITE_URL = "https://www.securaised.net";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/confidentiality-rules`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/general-conditions`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/passwordlost`,
      lastModified: new Date(),
    },
  ];
}
