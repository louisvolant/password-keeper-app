// src/app/securecontent/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from 'next/dynamic';
import { getContent, getFileTree } from "@/lib/secure_content_api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ClientLayout from "../ClientLayout";
import ProtectedRoute from '@/components/ProtectedRoute';
import FileTree from "./FileTree";
import { SecretKeyProvider } from '@/context/SecretKeyContext';
import type { ContentEditorProps } from './ContentEditor';

const ContentEditor = dynamic<ContentEditorProps>(
  () => import('./ContentEditor').then((mod) => mod.ContentEditor),
  { ssr: false }
);

function SecureContentInner() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encodedContent, setEncodedContent] = useState<string | null>(null);
  const [fileList, setFileList] = useState<{ file_name: string; uuid: string }[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const files = await getFileTree();
        setFileList(files);
        setSelectedFilePath(files[0]?.file_name || null);
      } catch (err) {
        console.error("Error fetching files:", err);
        setError("Failed to load files");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

  useEffect(() => {
    if (selectedFilePath) {
      fetchContent(selectedFilePath);
    }
  }, [selectedFilePath]);

  const fetchContent = async (filePath: string) => {
    try {
      const content = await getContent(filePath);
      setEncodedContent(content.encoded_content);
    } catch (err) {
      console.error("Error fetching content:", err);
      setEncodedContent("");
    }
  };

  const handleUpdateFiles = (newFiles: { file_name: string; uuid: string }[]) => {
    setFileList(newFiles);
  };

  const handleContentSaved = useCallback((encodedContent: string) => {
    setEncodedContent(encodedContent);
  }, []);

  if (isLoading) {
    return (
      <ClientLayout isLoading={isLoading}>
        <div className="container mx-auto p-4">Loading...</div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout isLoading={isLoading}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="container mx-auto p-4">
          {error ? (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="lg:grid lg:grid-cols-[300px,1fr] lg:gap-6">
              <div className="mb-4 max-w-2xl lg:mb-0">
                {fileList.length > 0 && (
                  <FileTree
                    files={fileList}
                    selectedFile={selectedFilePath}
                    onSelectFile={setSelectedFilePath}
                    onUpdateFiles={handleUpdateFiles}
                  />
                )}
              </div>
              <div className="max-w-2xl">
                <ContentEditor
                  filePath={selectedFilePath || ""}
                  initialContent={encodedContent || ""}
                  onContentSaved={handleContentSaved}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}

export default function SecureContentPage() {
  return (
    <ProtectedRoute>
      <SecretKeyProvider>
        <SecureContentInner />
      </SecretKeyProvider>
    </ProtectedRoute>
  );
}