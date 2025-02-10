// src/app/securecontent/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentEditor } from '@/components/ContentEditor';
import { getContent } from '@/lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from '@/components/Header';

export default function SecureContentPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [encodedContent, setEncodedContent] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have an authentication cookie
        const authCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth='));

        if (!authCookie) {
          router.push('/'); // Redirect to login if no auth cookie
          return;
        }

        // If authenticated, fetch the content
        const content = await getContent();
        setEncodedContent(content.encodedContent);
        setIsAuthenticated(true);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to authenticate');
        }
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    // Clear the auth cookie
    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isLoading) {
    return (
      <>
        <Header isAuthenticated={false} />
        <div className="container mx-auto p-4">Loading...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header isAuthenticated={false} />
        <div className="container mx-auto p-4 max-w-2xl">
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Header
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />
      <div className="container mx-auto p-4 max-w-2xl">
        <ContentEditor
          initialContent={encodedContent || ''}
        />
      </div>
    </>
  );
}