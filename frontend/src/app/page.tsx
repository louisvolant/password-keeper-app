// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { checkAuth, logout } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import ClientLayout from "./ClientLayout";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="flex flex-col gap-4"> {/* Flexbox container */}
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
          </div>
        ) : (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onError={setError}
            clearError={() => setError("")}
          />
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