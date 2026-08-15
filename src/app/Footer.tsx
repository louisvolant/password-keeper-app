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

        {/* Copyright and Theme toggle wrapper */}
        <div className="mt-4 flex justify-center items-center flex-wrap gap-4">
          <div>
            © {new Date().getFullYear()} Securaised.net. All rights reserved.
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </footer>
  );
}