// src/app/ClientLayout.tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import Navbar from "./Navbar";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({
  children,
}: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <Header
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <Navbar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {children}
    </>
  );
}