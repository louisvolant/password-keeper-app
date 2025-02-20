// src/components/LoginForm.tsx
'use client';
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { login } from '@/lib/api';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  clearError: () => void;
}

export const LoginForm = ({ onSuccess, onError, clearError }: LoginFormProps) => {
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
        onError(loginResponse.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error("Login Error:", error);
      if (error instanceof Error) {
        onError(error.message || 'Login failed');
      } else {
        onError('An unknown error occurred.');
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
            className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
          />
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};