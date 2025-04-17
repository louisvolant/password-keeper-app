'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  return <>{children}</>;
}