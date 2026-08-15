
// src/lib/temporary_content_api.ts
import axios from 'axios';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true
});


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