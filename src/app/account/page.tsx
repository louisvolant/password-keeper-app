// src/app/account/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
// Private user hub: must never appear in search results.
import type { Metadata } from "next";
import AccountContent from "./AccountContent";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountContent />;
}
