// src/components/ContentEditor.tsx
"use client";
import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check } from 'lucide-react';
import { encryptContent, decryptContent } from '@/lib/crypto';
import { updateContent } from '@/lib/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css';
import { AutoResizeTextArea } from '@/components/AutoResizeTextArea';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { useSecretKey } from '@/context/SecretKeyContext';

export interface ContentEditorProps {
  filePath: string;
  initialContent: string;
}

export const ContentEditor = ({ filePath, initialContent = '' }: ContentEditorProps) => {
  const { secretKey, setSecretKey } = useSecretKey();
  const [content, setContent] = useState('');
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [encodedContent, setEncodedContent] = useState(initialContent);
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });

  const markdownToHtml = useCallback((markdown: string) => {
    return marked.parse(markdown, { async: false }) as string;
  }, []);

  const handleQuillChange = useCallback(
    (value: string) => {
      const markdown = turndownService.turndown(value);
      setContent(markdown);
    },
    [turndownService]
  );

  const loadContent = useCallback(async () => {
    if (!secretKey) {
      setMessage('Please enter a secret key');
      setIsContentLoaded(false);
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
          setIsContentLoaded(false);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Error loading content: ${err.message}`);
      } else {
        setMessage('An unknown error occurred.');
      }
      setIsContentLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [secretKey, encodedContent]);

  useEffect(() => {
    setEncodedContent(initialContent);
    if (isContentLoaded && secretKey) {
      loadContent();
    } else {
      setContent('');
      setMessage('');
      setIsContentLoaded(false);
    }
  }, [filePath, initialContent, loadContent, isContentLoaded, secretKey]);

  useEffect(() => {
    let messageTimeout: NodeJS.Timeout;
    if (message === 'Content saved successfully') {
      messageTimeout = setTimeout(() => {
        setMessage('');
      }, 5000);
    }
    return () => clearTimeout(messageTimeout);
  }, [message]);

  useEffect(() => {
    let successTimeout: NodeJS.Timeout;
    if (saveSuccess) {
      successTimeout = setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    }
    return () => clearTimeout(successTimeout);
  }, [saveSuccess]);

  const handleSave = async () => {
    if (!secretKey) {
      setMessage('Please enter a secret key');
      return;
    }

    if (!filePath) {
      setMessage('No file selected');
      return;
    }

    setIsLoading(true);
    try {
      const encryptedContent = encryptContent(content, secretKey);
      await updateContent(filePath, encryptedContent);
      setMessage('Content saved successfully');
      setSaveSuccess(true);
      setEncodedContent(encryptedContent);
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

  const handleChangeSecretKey = () => {
    setIsContentLoaded(false);
    setContent('');
    setMessage('');
    setSecretKey('');
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  const SaveButton = () => (
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
  );

  return (
    <div className="space-y-4">
      {!isContentLoaded ? (
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Secret key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="flex-grow"
          />
          <Button
            onClick={loadContent}
            disabled={isLoading || !secretKey}
          >
            Load content
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleChangeSecretKey}
            variant="outline"
          >
            Change Secret Key
          </Button>
        </div>
      )}

      {isContentLoaded && (
        <div>
          <div className="flex justify-end mb-2 gap-2">
            <Button
              onClick={() => setEditorMode(editorMode === 'visual' ? 'markdown' : 'visual')}
              variant="outline"
            >
              {editorMode === 'visual' ? 'Switch to Markdown' : 'Switch to Visual'}
            </Button>
            <SaveButton />
          </div>

          {editorMode === 'markdown' ? (
            <AutoResizeTextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your markdown content here..."
              minHeight={128}
              showPreview={true}
            />
          ) : (
            <ReactQuill
              theme="snow"
              value={markdownToHtml(content)}
              onChange={handleQuillChange}
              modules={quillModules}
              formats={quillFormats}
              className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-b"
            />
          )}

          <div className="flex justify-end mt-2">
            <SaveButton />
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