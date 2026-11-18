// src/lib/temporary_content_api.ts
// Client API for ephemeral ("burn after read") shared secrets.
//
// Encryption happens server-side (see src/lib/temporary_content_crypto.ts):
// this module only transports plaintext over the authenticated HTTPS session,
// so no key material or crypto primitive is shipped to the browser.

import axios from 'axios';

const api = axios.create({
  withCredentials: true
});

export interface SaveTemporaryContentInput {
  strategy: 'oneread' | 'multipleread';
  max_date: string;
  password: string | null;
  content: string;
}

export const saveTemporaryContent = async ({
  strategy,
  max_date,
  password,
  content
}: SaveTemporaryContentInput) => {
  const response = await api.post(
    '/api/savetemporarycontent',
    { strategy, max_date, password, content },
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

// Fetch a shared secret by public identifier. When the link is password
// protected, the password must be supplied; the server verifies it against
// its Argon2id/PBKDF2 hash before decrypting and returning the plaintext.
export const getTemporaryContent = async (identifier: string, password?: string) => {
  try {
    const response = await api.get('/api/gettemporarycontent', {
      params: { identifier, password }
    });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return err.response.data;
    }
    throw err;
  }
};
