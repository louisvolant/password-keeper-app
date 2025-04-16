// src/components/HeaderButtons.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

export default function HeaderButtons({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  if (isAuthenticated) return null;

  return (
    <>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => setIsRegisterOpen(true)}
          className="border-gray-300 dark:border-gray-600 text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Register
        </Button>
        <Button
          variant="default"
          onClick={() => setIsLoginOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white"
        >
          Login
        </Button>
      </div>
      <LoginModal isOpen={isLoginOpen} setIsOpen={setIsLoginOpen} />
      <RegisterModal isOpen={isRegisterOpen} setIsOpen={setIsRegisterOpen} />
    </>
  );
}