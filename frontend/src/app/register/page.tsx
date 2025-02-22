// src/app/register/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from '@/components/Header';
import { register } from '@/lib/api';
import axios from 'axios';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (password.length < 15) {
      setError('Password must be at least 15 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(username, email, password);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => router.push('/securecontent'), 2000); // Redirect to securecontent
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (axios.isAxiosError(err) && err.response) {
        // Extract error message from server response
        setError(err.response.data.error || `Request failed with status code ${err.response.status}`);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header isAuthenticated={false} />
      <main className="container mx-auto p-4 max-w-2xl">
        <Card className="bg-white dark:bg-gray-800 transition-colors">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Register</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                required
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                required
              />
              <Input
                type="password"
                placeholder="Password (min 15 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                required
                minLength={15}
              />
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
            {error && (
              <Alert variant="error" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mt-4 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100">
                <AlertDescription>Registration successful! Redirecting to secure content...</AlertDescription>
              </Alert>
            )}
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => router.push('/')}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}