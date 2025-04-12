// src/lib/secure_content_api.ts
import axios from 'axios';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export async function getContent(filePath: string) {
  const url = '/api/getcontent?file_path=' + encodeURIComponent(filePath);
  const response = await api.get(url);
  return response.data;
}

export const updateContent = async (file_path: string, encoded_content: string) => {
  const response = await api.post('/api/updatecontent', { file_path, encoded_content });
  return response.data;
};

export async function getFileTree() {
  const response = await api.get('/api/getfiletree');
  return response.data;
}

export const updateFileTree = async (encryptedFileTree: string) => {
  const response = await api.post('/api/updatefiletree', { file_tree: encryptedFileTree });
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
