// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true
});

export const login = async (username: string, password: string) => {
  const response = await api.post(
    '/api/login',
    { username, password },
    { withCredentials: true }
  );
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.get('/api/check-auth', { withCredentials: true });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/logout', null, { withCredentials: true });
  return response.data;
};

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

export const updateFileTree = async (file_tree: string[]) => {
  const response = await api.post('/api/updatefiletree', { file_tree: JSON.stringify(file_tree) });
  return response.data;
};

export const removeFile = async (file_path: string) => {
  const response = await api.post('/api/remove_file', { file_path });
  return response.data;
};