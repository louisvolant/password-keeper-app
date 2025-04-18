// src/components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext'; // Import useAuthModal

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header = ({ toggleSidebar, isSidebarOpen }: HeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, handleLogout } = useAuth(); // Use AuthContext
  const { openLoginModal, openRegisterModal } = useAuthModal(); // Use AuthModalContext

  return (
    <header className="bg-blue-600 dark:bg-blue-800 text-white py-4">
      <div className="container mx-auto px-4 flex items-center justify-between max-w-screen-xl">
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
            <Link href="/confidentiality-rules" className="hover:text-gray-200 text-lg">
              Confidentiality Rules
            </Link>
            <Link href="/general-conditions" className="hover:text-gray-200 text-lg">
              General Conditions
            </Link>
          </nav>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              {pathname !== '/account' && (
                <Link href="/account">
                  <Button
                    variant="outline"
                    className="btn btn-outline border-gray-300 dark:border-gray-600 text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 flex items-center px-2 py-1 text-lg"
                  >
                    <svg
                      className="w-5 h-5 mr-1"
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
                    <span>Account</span>
                  </Button>
                </Link>
              )}
              <Button
                variant="default"
                onClick={handleLogout} // handleLogout still comes from AuthContext
                className="btn btn-primary flex items-center text-white hover:bg-blue-700 dark:hover:bg-blue-900 px-2 py-1 text-lg"
              >
                <svg
                  className="w-5 h-5 mr-1"
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
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={openRegisterModal} // Use openRegisterModal from context
                className="btn btn-outline border-gray-300 dark:border-gray-600 text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 text-lg"
              >
                Register
              </Button>
              <Button
                variant="default"
                onClick={openLoginModal} // Use openLoginModal from context
                className="btn btn-primary bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white px-2 py-1 text-lg"
              >
                Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};