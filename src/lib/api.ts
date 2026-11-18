// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
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

export const googleLogin = async () => {
  window.location.href = '/api/auth/google';
};

// Changing the password requires re-verifying the current password; the
// server also rotates the session so other sessions are revoked.
export const changePassword = async (currentpassword: string, newpassword: string) => {
  const response = await api.post(
    '/api/password/change',
    { currentpassword, newpassword },
    { withCredentials: true }
  );
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


export const register = async (username: string, email: string, password: string) => {
  const response = await api.post('/api/register', { username, email, password });
  return response.data;
};

// Deleting the account is irreversible, so the server requires the current
// account password in addition to a valid session.
export const deleteMyAccount = async (currentpassword: string) => {
  const response = await api.post(
    '/api/delete_my_account',
    { currentpassword },
    { withCredentials: true }
  );
  return response.data;
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