// src/app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/LoginForm';
import { checkAuth } from '@/lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock } from 'lucide-react';
import { Header } from '@/components/Header';

export default function HomePage() {
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuth();
        console.log('Auth check response:', response);
        if (response && response.authenticated === true) {
          setToken('authenticated');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const handleLoginSuccess = async () => {
    setError('');
    try {
      document.cookie = `auth=true; path=/`;
      setToken('authenticated');
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error retrieving content: ${err.message}`);
      } else {
        setError('Error retrieving content.');
      }
    }
  };

  const handleLogout = () => {
    setToken('');
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  };

  if (isLoading) {
    return (
      <>
        <Header isAuthenticated={false} />
        <div className="container mx-auto p-4 max-w-2xl">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Header
        isAuthenticated={!!token}
        onLogout={handleLogout}
      />
      <main className="container mx-auto p-4 max-w-2xl">
        {!token ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onError={setError}
            clearError={() => setError('')}
          />
        ) : (
          <Link href="/securecontent">
            <Button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Lock className="w-4 h-4" />
              Access Secure Content
            </Button>
          </Link>
        )}

        {error && (
          <Alert variant="error" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </main>
    </>
  );
}