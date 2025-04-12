// src/lib/api.ts
import axios from 'axios';

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


export const register = async (username: string, email: string, password: string) => {
  const response = await api.post('/api/register', { username, email, password });
  return response.data;
};

export const deleteMyAccount = async () => {
  const response = await api.post('/api/delete_my_account', null, { withCredentials: true });
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