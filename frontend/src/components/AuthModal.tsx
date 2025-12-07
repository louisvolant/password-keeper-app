// src/components/AuthModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { googleLogin, register } from "@/lib/api";

interface AuthModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({ isOpen, setIsOpen, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateUsername = (value: string) => {
    if (value.length <= 6) {
      setUsernameError("Username must be more than 6 characters");
    } else {
      setUsernameError("");
    }
  };

  const validateEmail = (value: string) => {
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (value: string) => {
    if (value.length < 15) {
      setPasswordError("Password must be at least 15 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleLoginSuccess = () => {
    setIsOpen(false);
    router.push("/account");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    validateUsername(username);
    validateEmail(email);
    validatePassword(password);

    if (usernameError || emailError || passwordError || !username || !email || !password) {
      setError("Please fix the errors above before submitting");
      return;
    }

    try {
      await register(username, email, password);
      setIsOpen(false);
      router.push("/account");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      // Redirects to Google OAuth, so no further action needed.
    } catch {
      setError("Failed to initiate Google login");
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError("");
    setUsernameError("");
    setEmailError("");
    setPasswordError("");
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
      onClick={handleOutsideClick}
    >
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full max-w-md">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {mode === "login" ? "Login" : "Register"}
        </h3>
        {mode === "login" ? (
          <>
            <LoginForm
              onSuccess={handleLoginSuccess}
              onError={setError}
              clearError={() => setError("")}
              onRegisterClick={() => setMode("register")}
            />
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 shadow-sm transition-all duration-300"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M17.6996 9.20184C17.6996 8.57234 17.6432 7.96706 17.5382 7.38599H9.17725V10.82H13.955C13.7492 11.9297 13.1237 12.8699 12.1835 13.4994V15.7268H15.0525C16.7312 14.1813 17.6996 11.9054 17.6996 9.20184Z" fill="#4285F4"></path>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.1774 17.8775C11.5743 17.8775 13.5839 17.0826 15.0527 15.7268L12.1836 13.4993C11.3887 14.032 10.3718 14.3467 9.1774 14.3467C6.86521 14.3467 4.90813 12.7851 4.21003 10.6868H1.24414V12.9868C2.70489 15.8882 5.7071 17.8775 9.1774 17.8775Z" fill="#34A853"></path>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.20994 10.687C4.03239 10.1543 3.93151 9.58534 3.93151 9.00023C3.93151 8.41512 4.03239 7.84616 4.20994 7.31351V5.01343H1.24405C0.642799 6.21189 0.299805 7.56773 0.299805 9.00023C0.299805 10.4327 0.642799 11.7886 1.24405 12.987L4.20994 10.687Z" fill="#FBBC05"></path>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M9.1774 3.65338C10.4808 3.65338 11.651 4.10129 12.571 4.98097L15.1173 2.43474C13.5798 1.00224 11.5703 0.122559 9.1774 0.122559C5.7071 0.122559 2.70489 2.11193 1.24414 5.01326L4.21003 7.31334C4.90813 5.21502 6.86521 3.65338 9.1774 3.65338Z" fill="#EA4335"></path>
                </svg>
                <span>Log in with Google</span>
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                }}
                className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                required
              />
              {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                required
              />
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                required
              />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white"
                disabled={!!usernameError || !!emailError || !!passwordError}
              >
                Register
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("login")}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Back to Login
              </Button>
            </div>
          </form>
        )}
        {mode === "login" && error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        {mode === "login" && (
          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}