// src/components/FileTree.tsx
import React from 'react';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';

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
  onSelectFile: (path: string) => void;
}

const FileTree = ({ files, selectedFile, onSelectFile }: FileTreeProps) => {
  // Convert flat file list to tree structure
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

    // Convert the nested object structure to arrays
    const convertToArray = (obj: { [key: string]: IntermediateTreeNode }): TreeNode[] => {
      return Object.values(obj).map(node => ({
        name: node.name,
        path: node.path,
        type: node.type,
        children: node.children ? convertToArray(node.children) : undefined
      }));
    };

    return convertToArray(root);
  };

  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());
  const tree = buildFileTree(files);

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

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isFolder = node.type === 'folder';
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = node.path === selectedFile;

    return (
      <div key={node.path}>
        <div
          className={`
            flex items-center py-1 px-2 cursor-pointer
            transition-colors
            dark:text-gray-100
            hover:bg-gray-100 dark:hover:bg-gray-700
            ${isSelected ? 'bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700' : ''}
          `}
          style={{ paddingLeft: `${level * 1.5}rem` }}
          onClick={() => isFolder ? toggleFolder(node.path) : onSelectFile(node.path)}
        >
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
        {isFolder && isExpanded && node.children?.map(child =>
          renderTreeNode(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 transition-colors">
      {tree.map(node => renderTreeNode(node))}
    </div>
  );
};

export default FileTree;