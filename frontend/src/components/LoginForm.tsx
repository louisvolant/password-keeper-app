// src/components/LoginForm.tsx
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hashPassword } from '@/lib/crypto';
import { login } from '@/lib/api';

interface LoginFormProps {
  onSuccess: (token: string) => void;
  onError: (message: string) => void;
}

export const LoginForm = ({ onSuccess, onError }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hashedPassword = hashPassword(password);
      const { token } = await login(username, hashedPassword);
      onSuccess(token);
    } catch (error) {
      onError('Identifiants invalides');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};