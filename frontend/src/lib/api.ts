// src/lib/api.ts
import axios from 'axios';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Default key for encryption when no password is provided (should be stored securely in production)
const DEFAULT_KEY = Buffer.from(process.env.AES_TEMPORARY_CONTENT_DEFAULT_KEY || '12345678901234567890123456789012', 'utf8'); // 32 bytes for AES-256

// Encrypt content with AES-256-CBC
const encryptAES = (content: string, password?: string | null): { iv: string; encrypted: string } => {
  const key = password ? Buffer.from(password.padEnd(32, '0').slice(0, 32), 'utf8') : DEFAULT_KEY; // Pad/truncate to 32 bytes
  const iv = randomBytes(16); // 16 bytes IV for AES-CBC
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { iv: iv.toString('hex'), encrypted };
};

// Decrypt content with AES-256-CBC
const decryptAES = (encrypted: string, iv: string, password?: string | null): string => {
  const key = password ? Buffer.from(password.padEnd(32, '0').slice(0, 32), 'utf8') : DEFAULT_KEY;
  const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post(
      '/api/login',
      { username, password },
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      // Return the backend's error response data (e.g., { success: false, error: "Invalid credentials" })
      return err.response.data;
    }
    // For unexpected errors (e.g., network issues), throw or return a generic error
    return { success: false, error: 'An unexpected error occurred during login' };
  }
};

export const changePassword = async (newpassword: string) => {
  const response = await api.post('/api/password/change', { newpassword }, { withCredentials: true });
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.post('/api/check-auth', { withCredentials: true });
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

export const register = async (username: string, email: string, password: string) => {
  const response = await api.post('/api/register', { username, email, password });
  return response.data;
};

export const deleteMyAccount = async () => {
  const response = await api.post('/api/delete_my_account', null, { withCredentials: true });
  return response.data;
};

export const saveTemporaryContent = async ({
  strategy,
  max_date,
  password,
  encoded_content
}: {
  strategy: 'oneread' | 'multipleread';
  max_date: string;
  password: string | null;
  encoded_content: string;
}) => {
  const { iv, encrypted } = encryptAES(encoded_content, password);
  const response = await api.post(
    '/api/savetemporarycontent',
    { strategy, max_date, password, iv, encoded_content: encrypted },
    { withCredentials: true }
  );
  return response.data;
};

export const getUserTemporaryContent = async () => {
  try {
    const response = await api.get('/api/getusertemporarycontent', { withCredentials: true });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return err.response.data;
    }
    throw err;
  }
};

export const deleteUserTemporaryContent = async (identifier: string) => {
  try {
    const response = await api.post(
      '/api/deleteusertemporarycontent',
      { identifier },
      { withCredentials: true }
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return err.response.data;
    }
    throw err;
  }
};

export const getTemporaryContent = async (identifier: string, password?: string) => {
  try {
    const response = await api.get('/api/gettemporarycontent', {
      params: { identifier, password }
    });
    if (response.data.success && response.data.content && response.data.iv) {
      return {
        success: true,
        content: decryptAES(response.data.content, response.data.iv, password)
      };
    }
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return err.response.data;
    }
    throw err;
  }
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post("/api/password/reset/request", { email });
  return response.data;
};

export const verifyResetToken = async (token: string) => {
  const response = await api.get("/api/password/reset/verify", {
    params: { token },
  });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post("/api/password/reset/reset", {
    token,
    newpassword: newPassword,
  });
  return response.data;
};