// src/app/passwordrenew/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import ClientLayout from "../ClientLayout";
import PasswordRenewForm from "./PasswordRenewForm";

// Private reset flow: must never appear in search results.
export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your account password",
  robots: { index: false, follow: false },
};

export default function PasswordRenewPage() {
  return (
    <ClientLayout isLoading={false}>
      <main className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Set New Password</h1>
        <Suspense fallback={<div>Loading reset form...</div>}>
          <PasswordRenewForm />
        </Suspense>
      </main>
    </ClientLayout>
  );
}