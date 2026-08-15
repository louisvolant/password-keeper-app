// src/app/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { internalLinks, externalLinks } from "./links";

interface NavbarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Navbar({ isOpen, toggleSidebar }: NavbarProps) {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-700 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden transition-transform duration-300 ease-in-out z-50 shadow-lg flex flex-col`}
      >
        <div className="flex flex-col p-4 space-y-4 flex-grow text-gray-800 dark:text-gray-200">
          {/* Internal links */}
          {internalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={toggleSidebar}
              className="hover:text-blue-600 dark:hover:text-blue-300"
            >
              {link.label}
            </Link>
          ))}

          {/* Horizontal ruler */}
          <hr className="border-gray-300 dark:border-gray-500 my-4" />

          {/* External links */}
          {externalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={toggleSidebar}
              className="hover:text-blue-600 dark:hover:text-blue-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="p-4 text-center border-t border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
        >
          Switch to {theme === "light" ? "Dark" : "Light"} Mode
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden z-40"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}