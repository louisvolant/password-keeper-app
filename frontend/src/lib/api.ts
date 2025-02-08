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

export const getContent = async () => {
  const response = await api.get('/api/getcontent', { withCredentials: true });
  return response.data;
};

export const updateContent = async (token: string, encodedContent: string) => {
  const response = await api.post('/api/updatecontent',
    { encodedContent },
    { headers: { Authorization: token } }
  );
  return response.data;
};