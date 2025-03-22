// src/app/passwordrenew/page.tsx
import { Suspense } from "react";
import ClientLayout from "../ClientLayout";
import PasswordRenewForm from "./PasswordRenewForm";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: "Reset Password",
  description: "Reset your account password",
};

export default function PasswordRenewPage() {
  return (
    <ClientLayout isAuthenticated={false}>
      <main className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Set New Password</h1>
        <Suspense fallback={<div>Loading reset form...</div>}>
          <PasswordRenewForm />
        </Suspense>
      </main>
    </ClientLayout>
  );
}