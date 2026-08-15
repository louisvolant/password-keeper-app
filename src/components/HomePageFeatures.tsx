// src/components/HomePageFeatures.tsx
"use client";

import Link from "next/link";
import { useAuthModal } from "@/context/AuthModalContext"; // Import useAuthModal

interface HomePageFeaturesProps {
  isAuthenticated: boolean;
}

export const HomePageFeatures = ({ isAuthenticated }: HomePageFeaturesProps) => {
  const { openLoginModal } = useAuthModal();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Existing Feature 1: Encrypted Files & Folders */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 2.896 2 4zm0 0c0 1.104.896 2 2 2s2-.896 2-2-2-4-2-4-2 2.896-2 4zm-4 6v4h8v-4m-10 0h12a2 2 0 002-2v-9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Encrypted Files & Folders
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Store files and folders encrypted, accessible only with your personal code.
          </p>
          <Link
            href={isAuthenticated ? "/securecontent" : "#"}
            onClick={(e) => {
               if (!isAuthenticated) {
                 e.preventDefault(); // Prevent default navigation
                 openLoginModal(); // Open the login modal from context
               }
            }}
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 transition-colors"
            aria-label={isAuthenticated ? "Organize encrypted files and folders" : "Login to organize encrypted files and folders"} // Update aria-label
          >
            {isAuthenticated ? "Organize Now" : "Login to Organize"} {/* Conditional Button Text */}
          </Link>
        </div>

        {/* Existing Feature 2: Secure Text Sharing */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Secure Text Sharing
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Share encrypted text via link, accessible only with a shared code.
          </p>
          <Link
            href={isAuthenticated ? "/temporarycontent" : "#"}
            onClick={(e) => {
               if (!isAuthenticated) {
                 e.preventDefault();
                 openLoginModal();
               }
            }}
            className="inline-block bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
            aria-label={isAuthenticated ? "Share encrypted text securely" : "Login to share encrypted text securely"}
          >
             {isAuthenticated ? "Share Now" : "Login to Share"}
          </Link>
        </div>

          {/* Coming Soon Feature 1: Secure User Text Sharing */}
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-dashed border-yellow-600/70 dark:border-yellow-500/70">
            <div className="absolute top-2 right-2 bg-yellow-600 dark:bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 pointer-events-none"></div>
            <div className="relative flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v2h5m-2-2c0 .656.126 1.283.356 1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="relative text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Secure User Sharing
            </h3>
            <p className="relative text-gray-600 dark:text-gray-300 mb-4">
              Share encrypted text with authenticated users via secure, temporary links.
            </p>
            <Link
              href="/user-sharing"
              className="relative inline-block bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 transition-colors pointer-events-none opacity-50"
              aria-label="Share encrypted text with users (coming soon)"
            >
              Share Soon
            </Link>
          </div>

          {/* Coming Soon Feature 2: Encrypted Version History */}
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-dashed border-indigo-600/70 dark:border-indigo-500/70">
            <div className="absolute top-2 right-2 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 pointer-events-none"></div>
            <div className="relative flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="relative text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Encrypted Version History
            </h3>
            <p className="relative text-gray-600 dark:text-gray-300 mb-4">
              Store and restore encrypted file versions securely with full confidentiality.
            </p>
            <Link
              href="/version-history"
              className="relative inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors pointer-events-none opacity-50"
              aria-label="Restore encrypted file versions (coming soon)"
            >
              Restore Soon
            </Link>
          </div>

          {/* Coming Soon Feature 3: Encrypted Access Audit */}
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-dashed border-pink-600/70 dark:border-pink-500/70">
            <div className="absolute top-2 right-2 bg-pink-600 dark:bg-pink-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 pointer-events-none"></div>
            <div className="relative flex items-center justify-center w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="relative text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Encrypted Access Audit
            </h3>
            <p className="relative text-gray-600 dark:text-gray-300 mb-4">
              View encrypted logs of account and file access to monitor activity.
            </p>
            <Link
              href="/access-audit"
              className="relative inline-block bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 transition-colors pointer-events-none opacity-50"
              aria-label="Monitor access logs (coming soon)"
            >
              Monitor Soon
            </Link>
          </div>

          {/* Coming Soon Feature 4: Encrypted Retention Policies */}
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-dashed border-teal-600/70 dark:border-teal-500/70">
            <div className="absolute top-2 right-2 bg-teal-600 dark:bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 pointer-events-none"></div>
            <div className="relative flex items-center justify-center w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-teal-600 dark:text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4a2 2 0 012 2v2H8V5a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="relative text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Encrypted Retention Policies
            </h3>
            <p className="relative text-gray-600 dark:text-gray-300 mb-4">
              Set encrypted rules for secure, automatic file deletion after a period.
            </p>
            <Link
              href="/retention-policies"
              className="relative inline-block bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors pointer-events-none opacity-50"
              aria-label="Set retention policies (coming soon)"
            >
              Set Soon
            </Link>
          </div>

          {/* Coming Soon Feature 5: Decoy Function */}
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-dashed border-orange-600/70 dark:border-orange-500/70">
            <div className="absolute top-2 right-2 bg-orange-600 dark:bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 pointer-events-none"></div>
            <div className="relative flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="relative text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Decoy Storage Function
            </h3>
            <p className="relative text-gray-600 dark:text-gray-300 mb-4">
              Create fake storage to protect real encrypted data under coercion.
            </p>
            <Link
              href="/decoy-function"
              className="relative inline-block bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 transition-colors pointer-events-none opacity-50"
              aria-label="Activate decoy storage (coming soon)"
            >
              Activate Soon
            </Link>
          </div>

          {/* Coming Soon Feature 6: Advanced Encryption Options */}
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-dashed border-cyan-600/70 dark:border-cyan-500/70">
            <div className="absolute top-2 right-2 bg-cyan-600 dark:bg-cyan-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 pointer-events-none"></div>
            <div className="relative flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1-1-2-2-2H6c-1 0-2 1-2 2v4c0 1 1 2 2 2h4c1 0 2-1 2-2v-2m8-2h-4c-1 0-2 1-2 2v4c0 1 1 2 2 2h4c1 0 2-1 2-2v-4c0-1-1-2-2-2zm-8-6v2m4-2v2" />
              </svg>
            </div>
            <h3 className="relative text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Advanced Encryption Options
            </h3>
            <p className="relative text-gray-600 dark:text-gray-300 mb-4">
              Choose client-side encryption algorithms like AES-256 or ChaCha20-Poly1305.
            </p>
            <Link
              href="/encryption-options"
              className="relative inline-block bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 transition-colors pointer-events-none opacity-50"
              aria-label="Customize encryption algorithms (coming soon)"
            >
              Customize Soon
            </Link>
          </div>
        </div>
        </>
  );

};