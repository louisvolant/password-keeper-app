'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteMyAccount } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button'; // Fixed typo from '@/components graves'
import { Lock } from 'lucide-react';
import ClientLayout from '../ClientLayout';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, handleLogout } = useAuth();
  const [error, setError] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAccountDeletion = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmAccountDeletion = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteMyAccount();
      if (response.success) {
        router.push('/');
      } else {
        setError(response.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Account deletion failed:', err);
      setError('An error occurred while deleting your account');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const onLogout = async () => {
    await handleLogout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="container mx-auto p-4 max-w-2xl">Loading...</div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <ProtectedRoute>
        <main className="container mx-auto p-4 max-w-2xl">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/securecontent">
                <Button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                  <Lock className="w-4 h-4" />
                  Access Secure Content
                </Button>
              </Link>
              <Link href="/temporarycontent">
                <Button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                  <Lock className="w-4 h-4" />
                  Create Temporary Link
                </Button>
              </Link>
              <Link href="/passwordchange">
                <Button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                  Change Password
                </Button>
              </Link>
            </div>
            <div className="mt-4 flex gap-4">
              <Button
                onClick={onLogout}
                disabled={isDeleting}
                variant="outline"
                className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 rounded-lg py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Logout
              </Button>
              <Button
                onClick={handleAccountDeletion}
                disabled={isDeleting}
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600 rounded-lg py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="error" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmAccountDeletion}
            title="Delete Account"
            message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
            confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete'}
            cancelText="No, Cancel"
          />
        </main>
      </ProtectedRoute>
    </ClientLayout>
  );
}