// src/components/HeaderButtons.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import AuthModal from "./AuthModal";

export default function HeaderButtons({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");

  if (isAuthenticated) return null;

  const openLoginModal = () => {
    setModalMode("login");
    setIsModalOpen(true);
  };

  const openRegisterModal = () => {
    setModalMode("register");
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={openRegisterModal}
          className="border-gray-300 dark:border-gray-600 text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Register
        </Button>
        <Button
          variant="default"
          onClick={openLoginModal}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white"
        >
          Login
        </Button>
      </div>
      <AuthModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        initialMode={modalMode}
      />
    </>
  );
}