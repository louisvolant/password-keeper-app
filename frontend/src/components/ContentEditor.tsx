// src/components/ContentEditor.tsx
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, LogOut } from 'lucide-react';
import { encryptContent, decryptContent } from '@/lib/crypto';
import { updateContent, logout } from '@/lib/api';

interface ContentEditorProps {
  onLogout: () => void;
  initialContent?: string;
}

export const ContentEditor = ({ onLogout, initialContent = '' }: ContentEditorProps) => {
  const [secretKey, setSecretKey] = useState('');
  const [content, setContent] = useState('');
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [encodedContent, setEncodedContent] = useState(initialContent);

    useEffect(() => {
      setEncodedContent(initialContent);
    }, [initialContent]);

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
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Error loading content: ${err.message}`);
      } else {
        setMessage('An unknown error occurred.');
      }
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
      await updateContent(encrypted);
      setMessage('Content saved successfully');
      setSaveSuccess(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message || 'Error saving content');
        console.error("Save error:", error);
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response: { data: { error: string } } };
        setMessage(axiosError.response.data.error || 'Error saving content');
        console.error("Save error details:", axiosError.response.data);
      } else {
        setMessage('An unknown error occurred during save.');
        console.error("Save error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still proceed with local logout even if API call fails
      onLogout();
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
          onClick={handleLogout}
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