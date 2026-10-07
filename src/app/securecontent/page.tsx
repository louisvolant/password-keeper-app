// src/app/securecontent/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
// Private vault area: must never appear in search results.
import type { Metadata } from "next";
import VaultContent from "./VaultContent";

export const metadata: Metadata = {
  title: "Secure Vault",
  robots: { index: false, follow: false },
};

export default function SecureContentPage() {
  return <VaultContent />;
}
