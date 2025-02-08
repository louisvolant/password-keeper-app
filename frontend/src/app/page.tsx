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
    setError(''); // Clear the error on successful login
    try {
      const { encodedContent } = await getContent();
      setContent(encodedContent || '');
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
    setContent('');
    // Optional: call logout API if needed
  };

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      {!token ? (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={setError}
          clearError={() => setError('')}
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