// src/app/ClientLayout.tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import Navbar from "./Navbar";
import { AuthModalProvider } from "@/context/AuthModalContext"; // Import the provider
import AuthModal from "@/components/AuthModal"; // Import AuthModal

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({
  children,
}: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <AuthModalProvider>
      <Header
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <Navbar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {children}
      <AuthModal />
    </AuthModalProvider>
  );
}