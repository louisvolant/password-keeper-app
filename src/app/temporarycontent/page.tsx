// src/app/temporarycontent/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
// Private link-creation area: must never appear in search results.
import type { Metadata } from "next";
import TemporaryLinkContent from "./TemporaryLinkContent";

export const metadata: Metadata = {
  title: "Temporary Link",
  robots: { index: false, follow: false },
};

export default function TemporaryContentPage() {
  return <TemporaryLinkContent />;
}
