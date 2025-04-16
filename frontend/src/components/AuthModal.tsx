// src/components/AuthModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { googleLogin, login, register } from "@/lib/api";

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
    } catch (err) {
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.31 1.08-3.71 1.08-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 2.47 2.18 5.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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