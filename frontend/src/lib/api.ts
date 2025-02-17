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
  const response = await api.get(`/api/getcontent?file_path=${encodeURIComponent(filePath)}`, {
    method: 'GET',
    credentials: 'include',
  });
    return response.data;
}

export const updateContent = async (file_path: string, encoded_content: string) => {
  const response = await api.post('/api/updatecontent',
    { file_path, encoded_content } // 🛠 Ajout de file_path ici
  );
  return response.data;
};


export async function getFileTree() {
  const response = await api.get('/api/getfiletree', {
    method: 'GET',
    credentials: 'include',
  });
    return response.data;
}
