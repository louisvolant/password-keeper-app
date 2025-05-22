// src/lib/secure_content_api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export async function getFileTree() {
  try {
    const response = await api.get('/api/getfiletree');
    const fileTree = response.data.file_tree || [];
    if (!Array.isArray(fileTree)) {
      console.error('getFileTree: Invalid file tree format, expected array, got:', fileTree);
      return [];
    }
    // Validate file tree entries
    const validFileTree = fileTree.filter(file =>
      typeof file.file_name === 'string' && file.file_name.trim() && typeof file.uuid === 'string'
    );
    if (validFileTree.length !== fileTree.length) {
      console.warn('getFileTree: Some file tree entries were invalid:', fileTree);
    }
    return validFileTree;
  } catch (error) {
    console.error('getFileTree: Error fetching file tree:', error);
    return [];
  }
}

export async function getContent(filePath: string) {
  const url = '/api/getcontent?file_path=' + encodeURIComponent(filePath);
  const response = await api.get(url);
  return response.data;
}

export const updateContent = async (file_path: string, encoded_content: string) => {
  const response = await api.post('/api/updatecontent', { file_path, encoded_content });
  return response.data;
};

export const updateFileTree = async (fileTree: { file_name: string; uuid: string }[]) => {
  const response = await api.post('/api/updatefiletree', { file_tree: fileTree });
  return response.data;
};

export const updateAllContent = async (updates: { filePath: string; encryptedContent: string }[]) => {
  const response = await api.post('/api/updatecontents', { updates });
  return response.data;
};

export const removeFile = async (file_path: string) => {
  const response = await api.post('/api/remove_file', { file_path });
  return response.data;
};