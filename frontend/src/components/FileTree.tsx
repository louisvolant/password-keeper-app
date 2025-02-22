// src/components/FileTree.tsx
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Plus, FolderPlus, Trash2, Pencil } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateContent, getContent, updateFileTree, removeFile } from '@/lib/api';

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
  files: string[];
  selectedFile: string | null;
  onSelectFile: (path: string | null) => void; // Updated type to accept null
  onUpdateFiles: (newFiles: string[]) => void;
}

const FileTree = ({ files, selectedFile, onSelectFile, onUpdateFiles }: FileTreeProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newItemInput, setNewItemInput] = useState<{ path: string; value: string; type: 'file' | 'folder' } | null>(null);
  const [renameInput, setRenameInput] = useState<{ path: string; value: string } | null>(null);

  const buildFileTree = (paths: string[]): TreeNode[] => {
    const root: { [key: string]: IntermediateTreeNode } = {};

    paths.forEach(path => {
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
            children: isLastPart ? undefined : {}
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
          type: node.type
        })),
        ...folderNodes.map(node => ({
          name: node.name,
          path: node.path,
          type: node.type,
          children: node.children ? convertToArray(node.children) : undefined
        }))
      ];
    };

    return convertToArray(root);
  };

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
  };

  const handleCreateItem = async (folderPath: string) => {
    if (!newItemInput?.value) return;

    const newPath = folderPath ? `${folderPath}/${newItemInput.value}` : newItemInput.value;

    try {
      const newFiles = [...files];
      if (newItemInput.type === 'file') {
        await updateContent(newPath, '');
        newFiles.push(newPath);
        onSelectFile(newPath);
      } else {
        const defaultFilePath = `${newPath}/default`;
        await updateContent(defaultFilePath, '');
        newFiles.push(defaultFilePath);
      }
      await updateFileTree(newFiles);
      onUpdateFiles(newFiles);
      setNewItemInput(null);
    } catch (error) {
      console.error(`Error creating ${newItemInput.type}:`, error);
    }
  };

  const handleRemoveFile = async (filePath: string) => {
    try {
      await removeFile(filePath);
      const newFiles = files.filter(f => f !== filePath);
      await updateFileTree(newFiles);
      onUpdateFiles(newFiles);
      if (selectedFile === filePath) {
        onSelectFile(newFiles[0] || null);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handleRename = (path: string, currentName: string) => {
    setRenameInput({ path, value: currentName });
  };

  const handleConfirmRename = async (oldPath: string, isFolder: boolean) => {
    if (!renameInput?.value || renameInput.value === oldPath.split('/').pop()) return;

    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newName = renameInput.value;
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;

    try {
      let newFiles = [...files];
      if (isFolder) {
        const filesToRename = files.filter(f => f.startsWith(oldPath + '/'));
        for (const file of filesToRename) {
          const newFilePath = file.replace(oldPath, newPath);
          const content = await getContent(file);
          await updateContent(newFilePath, content.encoded_content);
          await removeFile(file);
          newFiles = newFiles.filter(f => f !== file);
          newFiles.push(newFilePath);
        }
      } else {
        const content = await getContent(oldPath);
        await updateContent(newPath, content.encoded_content);
        await removeFile(oldPath);
        newFiles = newFiles.filter(f => f !== oldPath);
        newFiles.push(newPath);
        if (selectedFile === oldPath) onSelectFile(newPath);
      }
      await updateFileTree(newFiles);
      onUpdateFiles(newFiles);
      setRenameInput(null);
    } catch (error) {
      console.error('Error renaming:', error);
    }
  };

  const handleRowClick = (e: React.MouseEvent, isFolder: boolean, path: string) => {
    // Prevent row click if an action icon was clicked
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
          </div>
        )}

        {isFolder && isExpanded && node.children?.map(child =>
          renderTreeNode(child, level + 1)
        )}
      </div>
    );
  };

  const tree = buildFileTree(files);

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
        </div>
      )}

      {tree.map(node => renderTreeNode(node))}
    </div>
  );
};

export default FileTree;