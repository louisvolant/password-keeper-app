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

  const handleLoginSuccess = async (newToken: string) => {
    setToken(newToken);
    try {
      const { encodedContent } = await getContent(newToken);
      setContent(encodedContent || '');
    } catch (error) {
      setError('Erreur lors de la récupération du contenu');
    }
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