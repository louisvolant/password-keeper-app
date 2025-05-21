// src/app/ClientLayout.tsx
'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import Navbar from './Navbar';
import { AuthModalProvider, useAuthModal } from '@/context/AuthModalContext';
import AuthModal from '@/components/AuthModal';

interface ClientLayoutProps {
  children: React.ReactNode;
  isLoading: boolean;
}

export default function ClientLayoutWrapper({ children, isLoading }: ClientLayoutProps) {
  return (
    <AuthModalProvider>
      <ClientLayoutContent isLoading={isLoading}>{children}</ClientLayoutContent>
    </AuthModalProvider>
  );
}

function ClientLayoutContent({ children, isLoading }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isModalOpen, modalMode, setIsOpen } = useAuthModal();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <Header
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        isLoading={isLoading}
      />
      <Navbar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      {children}
      <AuthModal
        isOpen={isModalOpen}
        setIsOpen={setIsOpen}
        initialMode={modalMode}
      />
    </>
  );
}