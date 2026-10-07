// src/app/general-conditions/page.tsx
// Server entry owning SEO metadata; the visible page body is client-rendered.
import type { Metadata } from "next";
import GeneralConditionsContent from "./GeneralConditionsContent";

export const metadata: Metadata = {
  title: "General Conditions",
  description:
    "Terms and conditions for using the Securaised application.",
  alternates: {
    canonical: "/general-conditions",
  },
};

export default function GeneralConditionsPage() {
  return <GeneralConditionsContent />;
}
