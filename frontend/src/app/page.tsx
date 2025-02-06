// src/app/page.tsx
'use client';
import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { ContentEditor } from '@/components/ContentEditor';
import { getContent } from '@/lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HomePage() {
  const [token, setToken] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLoginSuccess = async () => {
    try {
      const { encodedContent } = await getContent();
      setContent(encodedContent || '');
      setToken('authenticated'); // Mark user as logged in
    } catch (error) {
      setError('Error retrieving content');
    }
  };

  const handleLogout = () => {
    setToken('');
    setContent('');
    // Optional: call logout API if needed
  };

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      {!token ? (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={setError}
        />
      ) : (
        <ContentEditor
          token={token}
          initialContent={content}
          onLogout={handleLogout}
        />
      )}
      {error && (
        <Alert variant="error" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </main>
  );
}