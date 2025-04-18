// src/app/ClientLayout.tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import Navbar from "./Navbar";
import { AuthModalProvider, useAuthModal } from "@/context/AuthModalContext";
import AuthModal from "@/components/AuthModal";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutProps) {
  return (
    <AuthModalProvider>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </AuthModalProvider>
  );
}

function ClientLayoutContent({ children }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { isModalOpen, modalMode, setIsOpen } = useAuthModal();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <Header
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <Navbar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {children}
      <AuthModal
        isOpen={isModalOpen}
        setIsOpen={setIsOpen} // This is the corrected state setter from your context
        initialMode={modalMode} // Pass the current mode from the context
      />
    </>
  );
}