// src/app/securecontent/page.tsx
"use client";

import Link from "next/link";
import { Lock, Construction, ArrowLeft, Share2 } from "lucide-react";
import ClientLayout from "../ClientLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";

export default function SecureContentPage() {
  return (
    <ProtectedRoute>
      <ClientLayout isLoading={false}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
            {/* Header Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-inner">
              <Construction className="w-8 h-8" />
            </div>

            {/* Badge */}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 mb-3">
              Feature to be built
            </span>

            {/* Title & Description */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Zero-Knowledge Personal Vault
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-8">
              The encrypted file vault and hierarchical note editor is currently scheduled for development. In the meantime, you can securely share expiring, encrypted notes via temporary links.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/temporarycontent" className="w-full sm:w-auto">
                <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  <Share2 className="w-4 h-4" />
                  <span>Create Temporary Link</span>
                </Button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}