// src/app/securelinkview/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTemporaryContent } from '@/lib/temporary_content_api';

export default function SecureLinkViewPage() {
  const { id } = useParams();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const response = await getTemporaryContent(id as string);
      if (response.success) {
        setContent(response.content);
      } else if (response.error === 'Password required') {
        setNeedsPassword(true);
      } else {
        setError(response.error || 'Failed to load content');
      }
      setIsLoading(false);
    };
    if (id) fetchContent();
  }, [id]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await getTemporaryContent(id as string, password);
    if (response.success) {
      setContent(response.content);
      setNeedsPassword(false);
    } else {
      setError(response.error || 'Invalid password');
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-base-200 dark:bg-gray-900 transition-colors">
      <main className="container mx-auto p-4 max-w-2xl">
        <div className="card bg-base-100 dark:bg-gray-800 shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Temporary Content
          </h2>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {needsPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="form-control">
                <label htmlFor="password" className="label">
                  <span className="label-text">Enter Password</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400"
                  placeholder="Password"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          ) : content ? (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Content</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full h-48 bg-white dark:bg-gray-700 dark:text-gray-100"
                value={content}
                readOnly
              />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}