// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from 'next/image';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Password Keeper",
  description: "App to save all passwords in the clouds, in a AES256 way",
keywords: "AES256, secure, password",
openGraph: {
    title: "Password Keeper Tool - Secure your passwords online",
    description: "App to save all passwords in the clouds, in a AES256 way.",
    type: "website",
    url: "https://pioo.fr",
    images: ['/icon_shield.png'],
  },
  icons: [
    { rel: "icon", url: "/icon_shield.svg" },
    { rel: "apple-touch-icon", url: "/icon_shield.svg" },
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark:bg-gray-900">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-gray-900`}>
        <header className="bg-blue-600 dark:bg-blue-800 text-white py-4">
          <div className="container mx-auto px-4 flex items-center">
              <Image
                src="/icon_shield.svg"
                alt="Shield Tool Logo"
                width={32}
                height={32}
                priority
                className="h-8 w-8 mr-2"
              />
            <h1 className="text-2xl font-bold">Password Keeper</h1>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-200 dark:bg-gray-800 py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} Pioo.fr. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
