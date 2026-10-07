// src/app/page.tsx
// Server entry for the home page. Owns SEO metadata so crawlers always get a
// canonical URL (fixes "Duplicate without user-selected canonical" in Search Console).
import type { Metadata } from "next";
import HomeContent from "./HomeContent";

export const metadata: Metadata = {
  title: "Securaised - Secure Password Keeper & Secret Sharing",
  description:
    "Store passwords in an AES-256 encrypted vault and share self-destructing secret links. Zero-knowledge, encrypted client-side.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <HomeContent />;
}
