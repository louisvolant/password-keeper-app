// src/lib/crypto.ts
import CryptoJS from 'crypto-js';

export const encryptContent = (content: string, key: string): string => {
  if (typeof content !== 'string') {
    console.error('encryptContent: Invalid content, expected string, got:', content);
    return '';
  }
  if (!key) {
    console.error('encryptContent: Secret key is missing or empty');
    return '';
  }
  return CryptoJS.AES.encrypt(content, key).toString();
};

export const decryptContent = (encrypted: string, key: string): string | null => {
  try {
    if (typeof encrypted !== 'string' || !encrypted.trim()) {
      console.error('decryptContent: Invalid encrypted input, expected non-empty string, got:', encrypted);
      return null;
    }
    if (!key) {
      console.error('decryptContent: Secret key is missing or empty');
      return null;
    }
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      console.error('decryptContent: Decryption failed, likely invalid key or corrupted data');
      return null;
    }
    return decrypted;
  } catch (error) {
    console.error('decryptContent: Decryption error:', error, 'Encrypted input:', encrypted);
    return null;
  }
};