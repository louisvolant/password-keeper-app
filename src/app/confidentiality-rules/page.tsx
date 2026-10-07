// src/app/confidentiality-rules/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
import type { Metadata } from "next";
import ConfidentialityRulesContent from "./ConfidentialityRulesContent";

export const metadata: Metadata = {
  title: "Confidentiality Rules",
  description:
    "How Securaised handles your data: encryption, storage and privacy rules.",
  alternates: {
    canonical: "/confidentiality-rules",
  },
};

export default function ConfidentialityRulesPage() {
  return <ConfidentialityRulesContent />;
}
