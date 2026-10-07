// src/app/securelinkview/[id]/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
// One-time secret view: private by design, must never appear in search results.
import type { Metadata } from "next";
import SecureLinkViewContent from "./SecureLinkViewContent";

export const metadata: Metadata = {
  title: "Secure Link",
  robots: { index: false, follow: false },
};

export default function SecureLinkViewPage() {
  return <SecureLinkViewContent />;
}
