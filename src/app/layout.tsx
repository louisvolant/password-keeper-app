// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import "./globals.css";
import { ReactNode } from "react";
import Footer from "./Footer";
import { AuthProvider } from '@/context/AuthContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export const metadata: Metadata = {
  title: "Password Keeper",
  description: "App to save all passwords in the clouds, in a AES256 way",
  keywords: "AES256, secure, password, pwa, password manager",
  metadataBase: new URL("https://www.securaised.net/"),
  applicationName: "Securaised",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Securaised",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Password Keeper Tool - Secure your passwords online",
    description: "App to save all passwords in the clouds, in a AES256 way.",
    type: "website",
    url: "https://www.securaised.net/",
    images: ["/icon_shield.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon_shield.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark:bg-gray-900 overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen max-w-full overflow-x-hidden bg-gray-100 dark:bg-gray-900`}
      >
        <ServiceWorkerRegister />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}