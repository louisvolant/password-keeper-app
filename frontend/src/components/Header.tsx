// src/components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/api";
import { useRouter } from "next/navigation";
import HeaderButtons from "./HeaderButtons";

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header = ({ isAuthenticated, onLogout, toggleSidebar, isSidebarOpen }: HeaderProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      if (onLogout) {
        onLogout();
      }
      router.push("/");
    }
  };

  return (
    <header className="bg-blue-600 dark:bg-blue-800 text-white py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Left Section: Burger (mobile only) and Logo */}
        <div className="flex items-center space-x-4">
          <button
            className="md:hidden text-2xl focus:outline-none text-white dark:text-gray-200"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? "×" : "☰"}
          </button>
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

        {/* Right Section: Links, Login/Register, and Logout */}
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
            <Button
              variant="default"
              onClick={handleLogout}
              className="flex items-center text-white hover:text-white hover:bg-blue-700 dark:hover:bg-blue-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          ) : (
            <HeaderButtons isAuthenticated={isAuthenticated} />
          )}
        </div>
      </div>
    </header>
  );
};