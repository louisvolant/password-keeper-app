// src/components/ContentEditor.tsx
"use client";
import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check } from 'lucide-react';
import { encryptContent, decryptContent, encryptFileTree, decryptFileTree } from '@/lib/crypto';
import { updateContent, getFileTree, getContent, updateFileTree, updateAllContent } from '@/lib/secure_content_api';
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
  const [newSecretKey, setNewSecretKey] = useState('');
  const [showKeyChange, setShowKeyChange] = useState(false);

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
      setMessage('Error loading content');
      setIsContentLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [secretKey, encodedContent]);

  useEffect(() => {
    setEncodedContent(initialContent);
    if (secretKey) {
      loadContent();
    } else {
      setContent('');
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
      const encryptedContent = encryptContent(content, secretKey);
      await updateContent(filePath, encryptedContent);
      setMessage('Content saved successfully');
      setSaveSuccess(true);
      setEncodedContent(encryptedContent);
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
      const { file_tree } = await getFileTree();
      const files = file_tree ? decryptFileTree(file_tree, secretKey) : [];
      if (!files && file_tree) {
        throw new Error("Invalid old secret key");
      }

      const contents = await Promise.all(
        files.map(async (path) => {
          const { encoded_content } = await getContent(path);
          return {
            filePath: path,
            content: encoded_content ? decryptContent(encoded_content, secretKey) || "" : "",
          };
        })
      );

      const newEncryptedTree = encryptFileTree(files, newSecretKey);
      const newEncryptedContents = contents.map(({ filePath, content }) => ({
        filePath,
        encryptedContent: encryptContent(content, newSecretKey),
      }));

      await updateFileTree(newEncryptedTree);
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
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean'],
    ],
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