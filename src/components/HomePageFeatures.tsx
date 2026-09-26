// src/components/HomePageFeatures.tsx
"use client";

import Link from "next/link";
import { Share2, ShieldCheck, Construction, ArrowRight } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";

interface HomePageFeaturesProps {
  isAuthenticated: boolean;
}

export const HomePageFeatures = ({ isAuthenticated }: HomePageFeaturesProps) => {
  const { openLoginModal } = useAuthModal();

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Implemented Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Feature 1: Ephemeral Secret Sharing */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-2xl mb-6 text-green-600 dark:text-green-400">
              <Share2 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Ephemeral Secret Sharing
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              Share sensitive credentials, passwords, and private text via secure, self-destructing links. Choose between single-read (&quot;Burn After Read&quot;) or timed expiration, with optional password protection.
            </p>
          </div>

          <div>
            <Link
              href={isAuthenticated ? "/temporarycontent" : "#"}
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  openLoginModal();
                }
              }}
              className="inline-flex items-center justify-center w-full bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-3 rounded-xl transition-colors shadow-sm"
              aria-label={isAuthenticated ? "Create temporary secret link" : "Login to share encrypted text"}
            >
              <span>{isAuthenticated ? "Create Temporary Link" : "Login to Share"}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Feature 2: Account & Identity Security */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl mb-6 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Account & Identity Security
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              Strong security with Argon2id password hashing, Google OAuth authentication, encrypted session cookies, self-service password recovery, and complete GDPR-compliant account deletion.
            </p>
          </div>

          <div>
            <Link
              href={isAuthenticated ? "/account" : "#"}
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  openLoginModal();
                }
              }}
              className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 rounded-xl transition-colors shadow-sm"
              aria-label={isAuthenticated ? "Manage account and security" : "Login to manage account"}
            >
              <span>{isAuthenticated ? "My Account" : "Login / Register"}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Roadmap Teaser for Zero-Knowledge Vault */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800/80 dark:to-gray-800/40 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Construction className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Zero-Knowledge Personal Vault
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                In Development
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              End-to-end client-encrypted file storage and notes organization is currently planned.
            </p>
          </div>
        </div>

        <Link
          href={isAuthenticated ? "/securecontent" : "#"}
          onClick={(e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              openLoginModal();
            }
          }}
          className="shrink-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          <span>View Status</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};