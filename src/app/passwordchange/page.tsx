// src/app/passwordchange/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
// Private account action: must never appear in search results.
import type { Metadata } from "next";
import PasswordChangeContent from "./PasswordChangeContent";

export const metadata: Metadata = {
  title: "Change Password",
  robots: { index: false, follow: false },
};

export default function PasswordChangePage() {
  return <PasswordChangeContent />;
}
