// src/components/ContentEditor.tsx
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, LogOut } from 'lucide-react';
import { encryptContent, decryptContent } from '@/lib/crypto';
import { updateContent, getContent } from '@/lib/api';

interface ContentEditorProps {
  token: string;
  initialContent: string;
  onLogout: () => void;
}

export const ContentEditor = ({ token, initialContent, onLogout }: ContentEditorProps) => {
  const [secretKey, setSecretKey] = useState('');
  const [content, setContent] = useState('');
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Effect to hide success message after 5 seconds
  useEffect(() => {
    let messageTimeout: NodeJS.Timeout;
    if (message === 'Content saved successfully') {
      messageTimeout = setTimeout(() => {
        setMessage('');
      }, 5000);
    }
    return () => clearTimeout(messageTimeout);
  }, [message]);

  // Effect to reset green button after 2 seconds
  useEffect(() => {
    let successTimeout: NodeJS.Timeout;
    if (saveSuccess) {
      successTimeout = setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    }
    return () => clearTimeout(successTimeout);
  }, [saveSuccess]);

  const loadContent = async () => {
    if (!secretKey) {
      setMessage('Please enter a secret key');
      return;
    }

    setIsLoading(true);
    try {
      const { encodedContent } = await getContent();
      if (!encodedContent) {
        setContent('');
        setIsContentLoaded(true);
        setMessage('No existing content');
      } else {
        const decrypted = decryptContent(encodedContent, secretKey);
        if (decrypted) {
          setContent(decrypted);
          setIsContentLoaded(true);
          setMessage('');
        } else {
          setMessage('Invalid key');
        }
      }
    } catch (error) {
      setMessage('Error loading content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!secretKey) {
      setMessage('Please enter a secret key');
      return;
    }

    setIsLoading(true);
    try {
      const encrypted = encryptContent(content, secretKey);
      await updateContent(token, encrypted);
      setMessage('Content saved successfully');
      setSaveSuccess(true);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Error saving content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-grow">
          <Input
            type="text"
            placeholder="Secret key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="flex-grow"
          />
          {!isContentLoaded && (
            <Button
              onClick={loadContent}
              disabled={isLoading || !secretKey}>
              Load content
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={onLogout}
          className="ml-4">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {isContentLoaded && (
        <div>
          <textarea
            className="w-full h-32 p-2 border rounded"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your content here..."
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className={saveSuccess ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved
                </>
              ) : (
                'Save'
              )}
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