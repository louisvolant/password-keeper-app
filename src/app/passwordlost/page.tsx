// src/app/passwordlost/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
import type { Metadata } from "next";
import PasswordLostContent from "./PasswordLostContent";

export const metadata: Metadata = {
  title: "Forgot Password",
  description:
    "Request a password reset link for your Securaised account.",
  alternates: {
    canonical: "/passwordlost",
  },
};

export default function PasswordLostPage() {
  return <PasswordLostContent />;
}
