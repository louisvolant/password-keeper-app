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
    setIsLoading(true); // Set loading to true
    clearError(); // Clear any previous errors

    try {
        const loginResponse = await login(username, password); // Assign the result to loginResponse
        console.log("Login Response: ", loginResponse);

        if (loginResponse.success) { // Use loginResponse here
            onSuccess();
        } else {
            onError(loginResponse.error || 'Invalid credentials'); // Use loginResponse here
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
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={isLoading}> {/* Disable button while loading */}
            {isLoading ? "Logging in..." : "Login"} {/* Show loading indicator */}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
