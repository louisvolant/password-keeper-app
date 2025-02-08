// src/components/LoginForm.tsx
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      clearError(); // Clear the error before calling onSuccess
      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        onError(`Invalid credentials: ${err.message}`);
      } else {
        onError('Invalid credentials.');
      }
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
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
