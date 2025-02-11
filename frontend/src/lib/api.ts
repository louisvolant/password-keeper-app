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

export const getContent = async () => {
  const response = await api.get('/api/getcontent', { withCredentials: true });
  return response.data;
};

export const updateContent = async (encodedContent: string) => {
  const response = await api.post('/api/updatecontent',
    { encodedContent }
  );
  return response.data;
};