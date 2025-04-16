// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        console.log("Auth check response:", response);
        if (response?.isAuthenticated) {
          setIsAuthenticated(true);
          router.push("/");
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
          <div className="flex flex-col gap-4">
            <Link href="/securecontent">
              <Button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <Lock className="w-4 h-4" />
                Access Secure Content
              </Button>
            </Link>
            <Link href="/temporarycontent">
              <Button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <Lock className="w-4 h-4" />
                Create Temporary Link to share
              </Button>
            </Link>
            <Link href="/passwordchange">
              <Button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                Change password
              </Button>
            </Link>
            <Button
              onClick={handleAccountDeletion}
              disabled={isDeleting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete my account"}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Password Keeper</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Securely store your passwords with AES256 encryption. Please log in or register to get started.
            </p>
          </div>
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