"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import AuthModal from "./AuthModal";
import { logout } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header = ({ toggleSidebar, isSidebarOpen }: HeaderProps) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");
  const { isAuthenticated, handleLogout } = useAuth();

  const openLoginModal = () => {
    setModalMode("login");
    setIsModalOpen(true);
  };

  const openRegisterModal = () => {
    setModalMode("register");
    setIsModalOpen(true);
  };

  return (
    <header className="bg-blue-600 dark:bg-blue-800 text-white py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Left Section: Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/icon_shield.png"
              alt="Shield Tool Logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8 mr-2"
            />
            <h1 className="text-2xl font-bold">Password Keeper</h1>
          </Link>
        </div>

        {/* Right Section: Links and Buttons */}
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-4">
            <Link href="/confidentiality-rules" className="hover:text-gray-200">
              Confidentiality Rules
            </Link>
            <Link href="/general-conditions" className="hover:text-gray-200">
              General Conditions
            </Link>
          </nav>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link href="/account">
                <Button
                  variant="outline"
                  className="btn btn-outline border-gray-300 dark:border-gray-600 text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Account
                </Button>
              </Link>
              <Button
                variant="default"
                onClick={handleLogout}
                className="btn btn-primary flex items-center text-white hover:bg-blue-700 dark:hover:bg-blue-900"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={openRegisterModal}
                className="btn btn-outline border-gray-300 dark:border-gray-600 text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Register
              </Button>
              <Button
                variant="default"
                onClick={openLoginModal}
                className="btn btn-primary bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        initialMode={modalMode}
      />
    </header>
  );
};