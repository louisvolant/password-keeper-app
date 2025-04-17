// src/app/passwordchange/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from '@/components/Header';
import ClientLayout from '@/app/ClientLayout';
import { changePassword } from '@/lib/api';
import axios from 'axios';
import ProtectedRoute from '@/components/ProtectedRoute';

const PASSWORD_MINIMAL_LENGTH = 15;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (newPassword.length < PASSWORD_MINIMAL_LENGTH) {
      setError('Password must be at least ' + PASSWORD_MINIMAL_LENGTH + ' characters long');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await changePassword(newPassword);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 2000); // Redirect to Home
      } else {
        setError(response.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || `Request failed with status code ${err.response.status}`);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClientLayout isAuthenticated={true}>
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <main className="container mx-auto p-4 max-w-2xl">
          <Card className="bg-white dark:bg-gray-800 transition-colors">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Change Password
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="New Password (min 15 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                  required
                  minLength={PASSWORD_MINIMAL_LENGTH}
                />
                <Input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-600"
                  required
                  minLength={PASSWORD_MINIMAL_LENGTH}
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
              {error && (
                <Alert variant="error" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mt-4 bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100">
                  <AlertDescription>
                    Password changed successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => router.push('/')}
                  disabled={isLoading}
                >
                  Back to home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
    </ClientLayout>
  );
}