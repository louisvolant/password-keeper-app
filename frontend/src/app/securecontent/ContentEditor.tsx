// src/app/securecontent/ContentEditor.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check } from 'lucide-react';
import { encryptContent, decryptContent } from '@/lib/crypto';
import { updateContent, getFileTree, getContent, updateFileTree, updateAllContent } from '@/lib/secure_content_api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '@/styles/quill-custom.css';
import { AutoResizeTextArea } from './AutoResizeTextArea';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { useSecretKey } from '@/context/SecretKeyContext';

export interface ContentEditorProps {
  filePath: string;
  initialContent: string;
  onContentSaved?: (encodedContent: string) => void;
}

export const ContentEditor = ({ filePath, initialContent = '', onContentSaved }: ContentEditorProps) => {
  const { secretKey, setSecretKey } = useSecretKey();
  const [content, setContent] = useState(''); // Markdown content
  const [htmlContent, setHtmlContent] = useState(''); // HTML content for ReactQuill
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [encodedContent, setEncodedContent] = useState(initialContent);
  const [editorMode, setEditorMode] = useState<'visual' | 'markdown'>('visual');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [showKeyChange, setShowKeyChange] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    br: '\n', // Preserve <br> as single newline
    blankReplacement: (content, node) => (node.nodeName === 'P' ? '\n\n' : ''),
  });

  const markdownToHtml = useCallback((markdown: string) => {
    return marked.parse(markdown, { async: false, breaks: true }) as string;
  }, []);

  const handleQuillChange = useCallback(
    (value: string) => {
      setHtmlContent(value);
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
        setHtmlContent('');
        setIsContentLoaded(true);
        setMessage('No existing content');
      } else {
        const decrypted = decryptContent(encodedContent, secretKey);
        if (decrypted) {
          console.log('Decrypted content:', decrypted); // Debug newlines
          setContent(decrypted);
          setHtmlContent(markdownToHtml(decrypted));
          setIsContentLoaded(true);
          setMessage('');
        } else {
          setMessage('Invalid key');
          setIsContentLoaded(false);
        }
      }
    } catch (err) {
      setMessage('Error loading content');
      setIsContentLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [secretKey, encodedContent, markdownToHtml]);

  useEffect(() => {
    setEncodedContent(initialContent);
    if (secretKey) {
      loadContent();
    } else {
      setContent('');
      setHtmlContent('');
      setMessage('');
      setIsContentLoaded(false);
    }
  }, [filePath, initialContent, loadContent, secretKey]);

  useEffect(() => {
    let messageTimeout: NodeJS.Timeout;
    if (message === 'Content saved successfully' || message === 'Secret key updated') {
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
      console.log('Content before save:', content); // Debug newlines
      const encryptedContent = encryptContent(content, secretKey);
      await updateContent(filePath, encryptedContent);
      setEncodedContent(encryptedContent);
      setMessage('Content saved successfully');
      setSaveSuccess(true);
      onContentSaved?.(encryptedContent);
      setHtmlContent(markdownToHtml(content));
      console.log('Content after save:', content); // Debug newlines
    } catch (error: unknown) {
      setMessage('Error saving content');
      console.error("Save error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeSecretKey = async () => {
    if (!newSecretKey) {
      setMessage('Please enter a new secret key');
      return;
    }

    setIsLoading(true);
    try {
      const files = await getFileTree();
      if (!files.length) {
        throw new Error("No files to update");
      }

      const contents = await Promise.all(
        files.map(async (file: { file_name: string; uuid: string }) => {
          const { encoded_content } = await getContent(file.file_name);
          return {
            filePath: file.file_name,
            content: encoded_content ? decryptContent(encoded_content, secretKey) || "" : "",
          };
        })
      );

      const newEncryptedContents = contents.map(({ filePath, content }) => ({
        filePath,
        encryptedContent: encryptContent(content, newSecretKey),
      }));

      await updateAllContent(newEncryptedContents);
      setSecretKey(newSecretKey);
      setNewSecretKey('');
      setShowKeyChange(false);
      setIsContentLoaded(false);
      setMessage('Secret key updated');
    } catch (err) {
      setMessage('Failed to update secret key');
    } finally {
      setIsLoading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false, // Prevent extra newlines
    },
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link',
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
        <div className="space-y-2">
          <p className="text-sm text-gray Sargasso sea, deep sea blue, dim grey">The secret key is required to encrypt and decrypt your files using AES-256 encryption.
            If you’re a new user, enter a strong, unique key to start securing your data.
            For existing users, use your existing key to access your encrypted files.
            Keep your key safe, as it’s needed to view or edit your content.
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
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
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <Button
            onClick={() => setShowKeyChange(!showKeyChange)}
            variant="outline"
          >
            {showKeyChange ? 'Cancel' : 'Change Secret Key'}
          </Button>
          {showKeyChange && (
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="New secret key"
                value={newSecretKey}
                onChange={(e) => setNewSecretKey(e.target.value)}
                className="flex-grow"
              />
              <Button
                onClick={handleChangeSecretKey}
                disabled={isLoading || !newSecretKey}
              >
                Update Secret Key
              </Button>
            </div>
          )}
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
              onChange={(e) => {
                setContent(e.target.value);
                setHtmlContent(markdownToHtml(e.target.value));
              }}
              placeholder="Enter your markdown content here..."
              minHeight={128}
              showPreview={true}
            />
          ) : (
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={htmlContent}
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