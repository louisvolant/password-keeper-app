// src/app/securecontent/FileTree.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Plus, FolderPlus, Trash2, Pencil } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateContent, getContent, updateFileTree, removeFile } from '@/lib/secure_content_api';
import { useSecretKey } from '@/context/SecretKeyContext';
import { encryptContent } from '@/lib/crypto';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

interface IntermediateTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: { [key: string]: IntermediateTreeNode };
}

interface FileTreeProps {
  files: { file_name: string; uuid: string }[];
  selectedFile: string | null;
  onSelectFile: (path: string | null) => void;
  onUpdateFiles: (newFiles: { file_name: string; uuid: string }[]) => void;
}

const FileTree = ({ files, selectedFile, onSelectFile, onUpdateFiles }: FileTreeProps) => {
  const { secretKey } = useSecretKey();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newItemInput, setNewItemInput] = useState<{ path: string; value: string; type: 'file' | 'folder' } | null>(null);
  const [renameInput, setRenameInput] = useState<{ path: string; value: string } | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  const buildFileTree = (files: { file_name: string; uuid: string }[]): TreeNode[] => {
    const root: { [key: string]: IntermediateTreeNode } = {};

    files.forEach(file => {
      const path = file.file_name;
      if (typeof path !== 'string' || !path.trim()) {
        console.warn('Invalid file_name detected:', file);
        return;
      }
      const parts = path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLastPart = index === parts.length - 1;
        const currentPath = parts.slice(0, index + 1).join('/');

        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            type: isLastPart ? 'file' : 'folder',
            children: isLastPart ? undefined : {},
          };
        }

        if (!isLastPart) {
          if (!current[part].children) {
            current[part].children = {};
          }
          current = current[part].children!;
        }
      });
    });

    const convertToArray = (obj: { [key: string]: IntermediateTreeNode }): TreeNode[] => {
      const nodes = Object.values(obj);
      const filesNodes = nodes.filter(node => node.type === 'file');
      const folderNodes = nodes.filter(node => node.type === 'folder');

      filesNodes.sort((a, b) => a.name.localeCompare(b.name));
      folderNodes.sort((a, b) => a.name.localeCompare(b.name));

      return [
        ...filesNodes.map(node => ({
          name: node.name,
          path: node.path,
          type: node.type,
        })),
        ...folderNodes.map(node => ({
          name: node.name,
          path: node.path,
          type: node.type,
          children: node.children ? convertToArray(node.children) : undefined,
        })),
      ];
    };

    return convertToArray(root);
  };

  useEffect(() => {
    setTree(buildFileTree(files));
  }, [files]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleAddItem = (folderPath: string, type: 'file' | 'folder') => {
    setNewItemInput({ path: folderPath, value: '', type });
    setError(null);
  };

  const sanitizeFileName = (name: string): string => {
    // Trim and replace invalid characters, allow alphanumeric, hyphens, underscores
    return name.trim().replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
  };

  const handleCreateItem = async (folderPath: string) => {
    if (!newItemInput?.value) {
      setError('File or folder name is required');
      return;
    }
    if (!secretKey || !secretKey.trim()) {
      setError('Secret key is required to create a file or folder');
      return;
    }

    const sanitizedName = sanitizeFileName(newItemInput.value);
    if (!sanitizedName) {
      setError('Invalid file or folder name');
      return;
    }

    const newPath = folderPath ? `${folderPath}/${sanitizedName}` : sanitizedName;
    const newUuid = crypto.randomUUID();

    try {
      const newFiles = [...files];
      if (newItemInput.type === 'file') {
        const encryptedContent = encryptContent('', secretKey);
        if (!encryptedContent) {
          throw new Error('Failed to encrypt content for new file');
        }
        // Call updateContent and verify success
        const contentResponse = await updateContent(newPath, encryptedContent);
        if (!contentResponse?.success) {
          throw new Error('Failed to create content in UserContent');
        }
        newFiles.push({ file_name: newPath, uuid: newUuid });
        await updateFileTree(newFiles);
        onUpdateFiles(newFiles);
        onSelectFile(newPath);
      } else {
        const defaultFilePath = `${newPath}/default`;
        const defaultUuid = crypto.randomUUID();
        const encryptedContent = encryptContent('', secretKey);
        if (!encryptedContent) {
          throw new Error('Failed to encrypt content for default file in new folder');
        }
        const contentResponse = await updateContent(defaultFilePath, encryptedContent);
        if (!contentResponse?.success) {
          throw new Error('Failed to create default file content in UserContent');
        }
        newFiles.push({ file_name: defaultFilePath, uuid: defaultUuid });
        await updateFileTree(newFiles);
        onUpdateFiles(newFiles);
      }
      setNewItemInput(null);
      setError(null);
    } catch (error: any) {
      console.error(`Error creating ${newItemInput.type}:`, error);
      setError(`Failed to create ${newItemInput.type}: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRemoveFile = async (filePath: string) => {
    try {
      await removeFile(filePath);
      const newFiles = files.filter(f => f.file_name !== filePath);
      await updateFileTree(newFiles);
      onUpdateFiles(newFiles);
      if (selectedFile === filePath) {
        onSelectFile(newFiles[0]?.file_name || null);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      setError('Failed to remove file');
    }
  };

  const handleRename = (path: string, currentName: string) => {
    setRenameInput({ path, value: currentName });
    setError(null);
  };

  const handleConfirmRename = async (oldPath: string, isFolder: boolean) => {
    if (!renameInput?.value || renameInput.value === oldPath.split('/').pop() || !secretKey) {
      setError('Invalid new name or missing secret key');
      return;
    }

    const sanitizedName = sanitizeFileName(renameInput.value);
    if (!sanitizedName) {
      setError('Invalid new name');
      return;
    }

    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = parentPath ? `${parentPath}/${sanitizedName}` : sanitizedName;

    try {
      let newFiles = [...files];
      if (isFolder) {
        const filesToRename = files.filter(f => f.file_name.startsWith(oldPath + '/'));
        for (const file of filesToRename) {
          const newFilePath = file.file_name.replace(oldPath, newPath);
          const content = await getContent(file.file_name);
          await updateContent(newFilePath, content.encoded_content);
          await removeFile(file.file_name);
          newFiles = newFiles.filter(f => f.file_name !== file.file_name);
          newFiles.push({ file_name: newFilePath, uuid: file.uuid });
        }
      } else {
        const file = files.find(f => f.file_name === oldPath);
        if (!file) {
          setError('File not found');
          return;
        }
        const content = await getContent(oldPath);
        await updateContent(newPath, content.encoded_content);
        await removeFile(oldPath);
        newFiles = newFiles.filter(f => f.file_name !== oldPath);
        newFiles.push({ file_name: newPath, uuid: file.uuid });
        if (selectedFile === oldPath) onSelectFile(newPath);
      }
      await updateFileTree(newFiles);
      onUpdateFiles(newFiles);
      setRenameInput(null);
      setError(null);
    } catch (error) {
      console.error('Error renaming:', error);
      setError('Failed to rename');
    }
  };

  const handleRowClick = (e: React.MouseEvent, isFolder: boolean, path: string) => {
    if ((e.target as HTMLElement).closest('.action-icon')) return;
    if (isFolder) {
      toggleFolder(path);
    } else {
      onSelectFile(path);
    }
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = node.path === selectedFile;
    const isAddingItem = newItemInput?.path === node.path;
    const isRenaming = renameInput?.path === node.path;

    return (
      <div key={node.path}>
        {isRenaming ? (
          <div className="flex items-center py-1 px-2" style={{ paddingLeft: `${level * 1.5}rem` }}>
            {isFolder ? (
              <Folder className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
            ) : (
              <FileText className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
            )}
            <Input
              value={renameInput.value}
              onChange={(e) => setRenameInput({ ...renameInput, value: e.target.value })}
              className="flex-grow bg-white dark:bg-gray-700"
            />
            <Button onClick={() => handleConfirmRename(node.path, isFolder)} className="ml-2">Save</Button>
            <Button
              variant="outline"
              onClick={() => setRenameInput(null)}
              className="ml-2 dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div
            className={`
              flex items-center py-1 px-2 cursor-pointer
              transition-colors group
              dark:text-gray-100
              hover:bg-gray-100 dark:hover:bg-gray-700
              ${isSelected ? 'bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700' : ''}
            `}
            style={{ paddingLeft: `${level * 1.5}rem` }}
            onClick={(e) => handleRowClick(e, isFolder, node.path)}
          >
            <div className="flex-1 flex items-center">
              {isFolder ? (
                <>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 mr-1 dark:text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1 dark:text-gray-400" />
                  )}
                  <Folder className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                </>
              ) : (
                <>
                  <span className="w-4 mr-1" />
                  <FileText className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                </>
              )}
              <span className="truncate">{node.name}</span>
            </div>

            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 md:opacity-100">
              {isFolder && (
                <>
                  <Plus
                    className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer action-icon"
                    onClick={(e) => { e.stopPropagation(); handleAddItem(node.path, 'file'); }}
                  />
                  <FolderPlus
                    className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer action-icon"
                    onClick={(e) => { e.stopPropagation(); handleAddItem(node.path, 'folder'); }}
                  />
                </>
              )}
              <Pencil
                className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 cursor-pointer action-icon"
                onClick={(e) => { e.stopPropagation(); handleRename(node.path, node.name); }}
              />
              {!isFolder && (
                <Trash2
                  className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 cursor-pointer action-icon"
                  onClick={(e) => { e.stopPropagation(); handleRemoveFile(node.path); }}
                />
              )}
            </div>
          </div>
        )}

        {isAddingItem && (
          <div className="pl-6 py-2" style={{ paddingLeft: `${level * 1.5 + 1.5}rem` }}>
            <div className="flex gap-2">
              <Input
                value={newItemInput.value}
                onChange={(e) => setNewItemInput({ ...newItemInput, value: e.target.value })}
                placeholder={`New ${newItemInput.type} name`}
                className="bg-white dark:bg-gray-700"
              />
              <Button onClick={() => handleCreateItem(node.path)}>Create</Button>
              <Button
                variant="outline"
                onClick={() => setNewItemInput(null)}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </Button>
            </div>
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          </div>
        )}

        {isFolder && isExpanded && node.children?.map(child =>
          renderTreeNode(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-colors">
      <div className="p-2 flex items-center space-x-4">
        <Button
          variant="outline"
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          onClick={() => handleAddItem('', 'file')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add File
        </Button>
        <Button
          variant="outline"
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
          onClick={() => handleAddItem('', 'folder')}
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          Add Folder
        </Button>
      </div>

      {newItemInput?.path === '' && (
        <div className="p-2 pt-0">
          <div className="flex gap-2">
            <Input
              value={newItemInput.value}
              onChange={(e) => setNewItemInput({ ...newItemInput, value: e.target.value })}
              placeholder={`New ${newItemInput.type} name`}
              className="bg-white dark:bg-gray-700"
            />
            <Button onClick={() => handleCreateItem('')}>Create</Button>
            <Button
              variant="outline"
              onClick={() => setNewItemInput(null)}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
          </div>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        </div>
      )}

      {tree.map(node => renderTreeNode(node))}
    </div>
  );
};

export default FileTree;