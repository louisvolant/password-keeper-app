// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { checkAuth, logout, deleteMyAccount } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import ClientLayout from "./ClientLayout";
import { ConfirmationModal } from "@/components/ConfirmationModal";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuth();
        if (response?.isAuthenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  const handleLoginSuccess = () => {
    setError("");
    setIsAuthenticated(true);
    router.push("/");
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  };

  const handleAccountDeletion = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmAccountDeletion = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteMyAccount();
      if (response.success) {
        setIsAuthenticated(false);
        router.push("/");
      } else {
        setError(response.error || "Failed to delete account");
      }
    } catch (err) {
      console.error("Account deletion failed:", err);
      setError("An error occurred while deleting your account");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <ClientLayout isAuthenticated={false}>
        <div className="container mx-auto p-4 max-w-2xl">Loading...</div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout
      isAuthenticated={isAuthenticated ?? false}
      onLogout={handleLogout}
    >
      <main className="container mx-auto p-4 max-w-2xl">
        {isAuthenticated === true ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/securecontent">
                <Button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                  <Lock className="w-4 h-4" />
                  Access Secure Content
                </Button>
              </Link>
              <Link href="/temporarycontent">
                <Button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                  <Lock className="w-4 h-4" />
                  Create Temporary Link
                </Button>
              </Link>
              <Link href="/passwordchange">
                <Button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                  Change Password
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleAccountDeletion}
                disabled={isDeleting}
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600 rounded-lg py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete My Account"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <LoginForm
              onSuccess={handleLoginSuccess}
              onError={setError}
              clearError={() => setError("")}
            />
            <Button
              onClick={handleGoogleLogin}
              className="w-full mt-4 bg-white text-black border border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.31 1.08-3.71 1.08-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 2.47 2.18 5.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Log in with Google
            </Button>
          </>
        )}

        {error && (
          <Alert variant="error" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmAccountDeletion}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
          confirmText={isDeleting ? "Deleting..." : "Yes, Delete"}
          cancelText="No, Cancel"
        />
      </main>
    </ClientLayout>
  );
}