// src/app/securecontent/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { logout } from "@/lib/api";
import { getContent, getFileTree, updateFileTree } from "@/lib/secure_content_api";
import { encryptFileTree, decryptFileTree } from '@/lib/crypto';
import { Alert, AlertDescription } from "@/components/ui/alert";
import ClientLayout from "../ClientLayout";
import ProtectedRoute from '@/components/ProtectedRoute';
import FileTree from "@/components/FileTree";
import { SecretKeyProvider, useSecretKey } from '@/context/SecretKeyContext';
import type { ContentEditorProps } from '@/components/ContentEditor';

const ContentEditor = dynamic<ContentEditorProps>(
  () => import('@/components/ContentEditor').then((mod) => mod.ContentEditor),
  { ssr: false }
);

// Inner component to use useSecretKey
function SecureContentInner() {
  const router = useRouter();
  const { secretKey } = useSecretKey();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encodedContent, setEncodedContent] = useState<string | null>(null);
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { file_tree } = await getFileTree();
        let files: string[] = [];

        if (!file_tree) {
          files = [];
        } else if (secretKey) {
          // Check if file_tree is unencrypted JSON
          try {
            const parsed = JSON.parse(file_tree);
            if (Array.isArray(parsed)) {
              // Unencrypted: encrypt and update
              const encryptedTree = encryptFileTree(parsed, secretKey);
              await updateFileTree(encryptedTree);
              files = parsed;
            }
          } catch (e) {
            // Assume encrypted
            const decrypted = decryptFileTree(file_tree, secretKey);
            files = decrypted || [];
            if (!decrypted && file_tree) {
              setError("Invalid secret key for file tree");
            }
          }
        } else {
          // No secretKey: can't decrypt, show empty list
          files = [];
        }

        setFileList(files);
        setSelectedFilePath(files[0] || null);
      } catch (err) {
        console.error("Error fetching files:", err);
        setError("Failed to load files");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles(); // Run immediately
  }, [secretKey]);

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

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/");
    }
  };

  const handleUpdateFiles = (newFiles: string[]) => {
    setFileList(newFiles);
  };

  if (isLoading) {
    return (
      <ClientLayout isAuthenticated={true}>
        <div className="container mx-auto p-4">Loading...</div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout isAuthenticated={true} onLogout={handleLogout}>
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