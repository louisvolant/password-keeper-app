// src/components/ContentEditor.tsx
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { encryptContent, decryptContent } from '@/lib/crypto';
import { updateContent } from '@/lib/api';

interface ContentEditorProps {
  token: string;
  initialContent: string;
}

export const ContentEditor = ({ token, initialContent }: ContentEditorProps) => {
  const [secretKey, setSecretKey] = useState('');
  const [content, setContent] = useState('');
  const [isDecoded, setIsDecoded] = useState(false);
  const [message, setMessage] = useState('');

  const handleDecrypt = () => {
    const decrypted = decryptContent(initialContent, secretKey);
    if (decrypted) {
      setContent(decrypted);
      setIsDecoded(true);
      setMessage('');
    } else {
      setMessage('Clé invalide');
    }
  };

  const handleSave = async () => {
    try {
      const encrypted = encryptContent(content, secretKey);
      await updateContent(token, encrypted);
      setMessage('Contenu sauvegardé avec succès');
    } catch (error) {
      setMessage('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="space-y-4">
      {!isDecoded ? (
        <div>
          <textarea
            className="w-full h-32 p-2 border rounded"
            value={initialContent}
            readOnly
          />
          <div className="flex gap-2 mt-2">
            <Input
              type="password"
              placeholder="Clé secrète"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <Button onClick={handleDecrypt}>
              Déchiffrer
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <textarea
            className="w-full h-32 p-2 border rounded"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Input
              type="password"
              value={secretKey}
              readOnly
            />
            <Button onClick={handleSave}>
              Sauvegarder
            </Button>
          </div>
        </div>
      )}
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};