// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import ClientLayout from '@/app/ClientLayout';
import { HomePageFeatures } from '@/components/HomePageFeatures';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading...</div>;
  }

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12">
          <section className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Secure Your Digital Life
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Store, share, and manage sensitive data with advanced encryption technology.
            </p>
          </section>

          <HomePageFeatures isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </ClientLayout>
  );
}