// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { checkAuth } from "@/lib/api";
import ClientLayout from '@/app/ClientLayout';
import { HomePageFeatures } from "@/components/HomePageFeatures";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuth();
        setIsAuthenticated(response.authenticated);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const handleFeatureClick = () => {
    if (!isAuthenticated) {
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading...</div>;
  }

  return (
    <ClientLayout isAuthenticated={false}>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Secure Your Digital Life
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Store, share, and manage sensitive data with advanced encryption technology.
          </p>
        </section>

        <HomePageFeatures isAuthenticated={isAuthenticated} />
      </div>
    </div>
    </ClientLayout>
  );
}