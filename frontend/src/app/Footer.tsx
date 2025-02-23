// src/app/Footer.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { externalLinks } from "./links";

export default function Footer() {
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
    <footer className="bg-gray-200 dark:bg-gray-800 py-4 mt-8">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
        {/* External links */}
        <div className="mb-4">
          {externalLinks.map((link, index) => (
            <span key={link.href}>
              <Link
                href={link.href}
                className="mx-2 hover:text-gray-800 dark:hover:text-gray-100"
              >
                {link.label}
              </Link>
              {index < externalLinks.length - 1 && <span>|</span>}
            </span>
          ))}
        </div>

        {/* Theme toggle - Hidden on mobile, visible on desktop */}
        <button
          onClick={toggleTheme}
          className="hidden md:block py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Switch to {theme === "light" ? "Dark" : "Light"} Mode
        </button>

        {/* Copyright */}
        <div className="mt-4">
          © {new Date().getFullYear()} Pioo.fr. All rights reserved.
        </div>
      </div>
    </footer>
  );
}