// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

export const login = async (username: string, hashedPassword: string) => {
  const response = await api.post('/login', { username, hashedpassword: hashedPassword});
  return response.data;
};

export const getContent = async (token: string) => {
  const response = await api.get('/getcontent', {
    headers: { Authorization: token }
  });
  return response.data;
};

export const updateContent = async (token: string, encodedContent: string) => {
  const response = await api.post('/updatecontent',
    { encodedContent },
    { headers: { Authorization: token } }
  );
  return response.data;
};