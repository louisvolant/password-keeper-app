import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  openGraph: {
    title: "Password Keeper Tool - Secure your passwords online",
    description: "App to save all passwords in the clouds, in a AES256 way.",
    type: "website",
    url: "https://pioo.fr",
    images: ["/icon_shield.png"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 dark:bg-gray-900`}
      >
        {children}
        <footer className="bg-gray-200 dark:bg-gray-800 py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} Pioo.fr. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}