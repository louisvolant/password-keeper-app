'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuth, logout } from '@/lib/api';

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  setIsAuthenticated: (value: boolean) => void;
  handleLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authStatus = await checkAuth();
        setIsAuthenticated(authStatus.isAuthenticated);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, setIsAuthenticated, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}