// src/app/layout.tsx
import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import "./globals.css";
import { ReactNode } from "react";
import Footer from "./Footer";
import { AuthProvider } from '@/context/AuthContext';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Password Keeper",
  description: "App to save all passwords in the clouds, in a AES256 way",
  keywords: "AES256, secure, password",
  metadataBase: new URL("https://www.securaised.net/"),
  openGraph: {
    title: "Password Keeper Tool - Secure your passwords online",
    description: "App to save all passwords in the clouds, in a AES256 way.",
    type: "website",
    url: "https://www.securaised.net/",
    images: ["/icon_shield.png"],
  },
  icons: [
    { rel: "icon", url: "/icon_shield.svg" },
    { rel: "apple-touch-icon", url: "/icon_shield.svg" },
  ],
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark:bg-gray-900">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900`}
      >
          <AuthProvider>
            {children}
          </AuthProvider>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}