// src/context/AuthModalContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthModalContextType {
  isModalOpen: boolean;
  modalMode: "login" | "register";
  openLoginModal: () => void;
  openRegisterModal: () => void;
  setIsOpen: (value: boolean) => void; // Expose the state setter
  setModalMode: (mode: "login" | "register") => void; // Expose the state setter
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

interface AuthModalProviderProps {
  children: ReactNode;
}

export const AuthModalProvider = ({ children }: AuthModalProviderProps) => {
  // These are the state variables and their actual setter functions from useState
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"login" | "register">("login");

  const openLoginModal = () => {
    setModalMode("login");
    setIsModalOpen(true);
  };

  const openRegisterModal = () => {
    setModalMode("register");
    setIsModalOpen(true);
  };

  useEffect(() => {
      if (!isModalOpen) {
          setModalMode('login');
      }
  }, [isModalOpen]);


  return (
    <AuthModalContext.Provider
      value={{
        isModalOpen,
        modalMode,
        openLoginModal,
        openRegisterModal,
        setIsOpen: setIsModalOpen,
        setModalMode: setModalMode,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};