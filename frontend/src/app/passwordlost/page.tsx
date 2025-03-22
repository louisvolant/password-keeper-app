// src/app/passwordlost/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ClientLayout from "../ClientLayout";
import { requestPasswordReset } from "@/lib/api";

export default function PasswordLostPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await requestPasswordReset(email);
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError(response.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Password reset request failed:", err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <ClientLayout isAuthenticated={false}>
      <main className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input type="hidden" name="csrf_token" value="dummy-csrf" /> {/* Add real CSRF token in production */}
            </div>
            <Button type="submit" className="w-full">
              Request Password Reset
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4">Check your inbox for a password reset link.</p>
            <Button onClick={() => router.push("/")} variant="outline">
              Back to Login
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="error" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </main>
    </ClientLayout>
  );
}