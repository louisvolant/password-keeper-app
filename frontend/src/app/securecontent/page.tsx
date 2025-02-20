// src/app/securecontent/page.tsx
// src/app/securecontent/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentEditor } from '@/components/ContentEditor';
import { getContent, getFileTree } from '@/lib/api';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from '@/components/Header';
import FileTree from '@/components/FileTree';

export default function SecureContentPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encodedContent, setEncodedContent] = useState<string | null>(null);
  const [fileList, setFileList] = useState<string[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchFiles = async () => {
      try {
        console.log("Checking authentication...");
        const authCookie = document.cookie.split('; ').find(row => row.startsWith('auth='));
        if (!authCookie) {
          console.log("Not authenticated, redirecting...");
          setIsAuthenticated(false);
          return router.push('/');
        }
        setIsAuthenticated(true);

        console.log("Fetching file tree...");
        const filesResponse = await getFileTree();
        if (filesResponse.file_tree) {
          const parsedFiles = JSON.parse(filesResponse.file_tree);
          if (Array.isArray(parsedFiles) && parsedFiles.length > 0) {
            setFileList(parsedFiles);
            setSelectedFilePath(parsedFiles[0]);
          } else {
            setError('No files available.');
          }
        } else {
          setError('Failed to fetch files');
        }
      } catch {  // Removed the unused parameter entirely
        setError('Failed to fetch files');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchFiles();
  }, [router]);

  useEffect(() => {
    if (selectedFilePath) {
      console.log("Fetching content for:", selectedFilePath);
      fetchContent(selectedFilePath);
    }
  }, [selectedFilePath]);

  const fetchContent = async (filePath: string) => {
    try {
      const content = await getContent(filePath);
      console.log("Content received for", filePath);
      setEncodedContent(content.encoded_content);
    } catch (err) {
      console.error("Error fetching content:", err);
      setEncodedContent('');
    }
  };

  const handleLogout = () => {
    document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsAuthenticated(false);
    router.push('/');
  };

  if (isLoading) return <div className="container mx-auto p-4">Loading...</div>;
  if (error) return <Alert><AlertDescription>{error}</AlertDescription></Alert>;

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header isAuthenticated={isAuthenticated ?? false} onLogout={handleLogout} />
        <div className="container mx-auto p-4">
          <div className="lg:grid lg:grid-cols-[300px,1fr] lg:gap-6">
            <div className="mb-4 max-w-2xl lg:mb-0">
              {fileList.length > 0 && (
                <FileTree
                  files={fileList}
                  selectedFile={selectedFilePath}
                  onSelectFile={setSelectedFilePath}
                />
              )}
            </div>
            <div className="max-w-2xl">
              <ContentEditor
                filePath={selectedFilePath || ''}
                initialContent={encodedContent || ''}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
