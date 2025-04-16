// src/components/LoginModal.tsx
"use client";

import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { googleLogin } from "@/lib/api";

interface LoginModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onRegisterClick?: () => void;
}

export default function LoginModal({ isOpen, setIsOpen, onRegisterClick }: LoginModalProps) {
  const [error, setError] = useState("");

  const handleSuccess = () => {
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError("");
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      // The browser will redirect to Google OAuth, so no further action is needed.
    } catch (err) {
      setError("Failed to initiate Google login");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Login</h3>
        <LoginForm
          onSuccess={handleSuccess}
          onError={setError}
          clearError={() => setError("")}
          onRegisterClick={onRegisterClick}
        />
        <div className="mt-6">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.31 1.08-3.71 1.08-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 2.47 2.18 5.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Log in with Google</span>
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}