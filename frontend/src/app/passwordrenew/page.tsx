// src/app/passwordrenew/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ClientLayout from "../ClientLayout";
import { verifyResetToken, resetPassword } from "@/lib/api";

export default function PasswordRenewPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid reset link");
        return;
      }
      try {
        const response = await verifyResetToken(token);
        setIsValidToken(response.success);
        if (!response.success) {
          setError("Invalid or expired reset link");
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        setError("An error occurred verifying the reset link");
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const response = await resetPassword(token!, newPassword);
      if (response.success) {
        setIsSubmitted(true);
      } else {
        setError(response.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      setError("An error occurred. Please try again.");
    }
  };

  if (!token || !isValidToken) {
    return (
      <ClientLayout isAuthenticated={false}>
        <main className="container mx-auto p-4 max-w-md">
          <Alert variant="error">
            <AlertDescription>{error || "Invalid reset link"}</AlertDescription>
          </Alert>
        </main>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout isAuthenticated={false}>
      <main className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Set New Password</h1>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4">Password successfully reset!</p>
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