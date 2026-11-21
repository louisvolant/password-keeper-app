// src/app/Footer.tsx
"use client";

import { useState, useEffect } from "react";
import { externalLinks, personalLinks, type LinkItem } from "./links";

interface FooterNavProps {
  ariaLabel: string;
  links: LinkItem[];
  navClassName: string;
  linkClassName: string;
}

/** Renders a pipe-separated list of external footer links. */
function FooterNav({ ariaLabel, links, navClassName, linkClassName }: FooterNavProps) {
  return (
    <nav aria-label={ariaLabel} className={navClassName}>
      {links.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-3">
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {link.label}
          </a>
          {index < links.length - 1 && (
            <span aria-hidden="true" className="text-gray-400 dark:text-gray-600">
              |
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

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
    <footer className="mt-auto border-t border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-800 py-5 safe-bottom max-w-full">
      <div className="container mx-auto max-w-screen-xl px-4 text-sm text-gray-600 dark:text-gray-300 space-y-4">
        {/* Companion project links */}
        <FooterNav
          ariaLabel="External projects"
          links={externalLinks}
          navClassName="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400"
          linkClassName="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        />

        {/* Bottom bar: Copyright, Personal Page / Portfolio links, and Theme toggle */}
        <div className="pt-4 border-t border-gray-300/80 dark:border-gray-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            © {new Date().getFullYear()} Securaised.net. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <FooterNav
              ariaLabel="Personal"
              links={personalLinks}
              navClassName="flex items-center gap-3"
              linkClassName="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            />

            <button
              onClick={toggleTheme}
              className="p-2 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}