// src/app/securecontent/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkAuth, getContent, getFileTree, logout } from "@/lib/api";
import { ContentEditor } from "@/components/ContentEditor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ClientLayout from "../ClientLayout"; // Import ClientLayout
import FileTree from "@/components/FileTree";

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
        const authResponse = await checkAuth();
        if (!authResponse?.isAuthenticated) {
          setIsAuthenticated(false);
          return router.push("/");
        }
        setIsAuthenticated(true);

        const filesResponse = await getFileTree();
        if (filesResponse.file_tree) {
          const parsedFiles = JSON.parse(filesResponse.file_tree);
          if (Array.isArray(parsedFiles) && parsedFiles.length > 0) {
            setFileList(parsedFiles);
            setSelectedFilePath(parsedFiles[0]);
          } else {
            setError("No files available.");
          }
        } else {
          setError("Failed to fetch files");
        }
      } catch (err) {
        console.error("Error in auth or file fetch:", err);
        setIsAuthenticated(false);
        setError("Authentication failed");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchFiles();
  }, [router]);

  useEffect(() => {
    if (selectedFilePath && isAuthenticated) {
      fetchContent(selectedFilePath);
    }
  }, [selectedFilePath, isAuthenticated]);

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
      setIsAuthenticated(false);
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
  if (!isAuthenticated) return null;

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