// src/components/LoginForm.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { login } from '@/lib/api';
import axios from 'axios';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  clearError: () => void;
  onRegisterClick?: () => void;
}

export const LoginForm = ({ onSuccess, onError, clearError, onRegisterClick }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      const loginResponse = await login(username, password);
      console.log("Login Response: ", loginResponse);

      if (loginResponse.success) {
        onSuccess();
      } else {
        onError(loginResponse.error || 'Login failed');
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (axios.isAxiosError(error) && error.response) {
        onError(error.response.data.error || `Request failed with status code ${error.response.status}`);
      } else {
        onError('An unexpected error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 transition-colors">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
          />
          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <div className="mt-4 flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={onRegisterClick}
            className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            Register
          </Button>
          <Link href="/passwordlost" className="w-full">
            <Button
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              Lost Password?
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};