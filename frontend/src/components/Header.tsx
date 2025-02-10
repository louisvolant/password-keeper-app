// src/components/Header.tsx

'use client';

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout?: () => void;
}

export const Header = ({ isAuthenticated, onLogout }: HeaderProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still proceed with local logout
      if (onLogout) {
        onLogout();
      }
      router.push('/');
    }
  };

  return (
    <header className="bg-blue-600 dark:bg-blue-800 text-white py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
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
        {isAuthenticated && (
          <Button
            variant="default"
            onClick={handleLogout}
            className="text-white hover:text-white hover:bg-blue-700 dark:hover:bg-blue-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
};