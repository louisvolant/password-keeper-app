// src/app/temporarycontent/page.tsx
'use client';
import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { checkAuth, saveTemporaryContent } from '@/lib/api';
import axios from 'axios';

export default function TemporaryContentPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; link: string } | null>(null);
  const [content, setContent] = useState('');
  const [strategy, setStrategy] = useState<'oneread' | 'multipleread'>('multipleread');
  const [expiration, setExpiration] = useState('1hour');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authResponse = await checkAuth();
        if (!authResponse?.isAuthenticated) {
          setIsAuthenticated(false);
          router.push('/');
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(false);
        router.push('/');
      }
    };
    verifyAuth();
  }, [router]);

  const calculateMaxDate = () => {
    const now = new Date();
    switch (expiration) {
      case '1hour': return new Date(now.getTime() + 60 * 60 * 1000);
      case '1day': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1week': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '1month': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() + 60 * 60 * 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!content.trim()) {
      setError('Content cannot be empty');
      setIsLoading(false);
      return;
    }

    if (usePassword && password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const maxDate = calculateMaxDate();
      const response = await saveTemporaryContent({
        strategy,
        max_date: maxDate.toISOString(),
        password: usePassword ? password : null,
        encoded_content: content,
      });

      if (response.success && response.identifier) {
        const shareLink = `${window.location.origin}/securelinkview/${response.identifier}`;
        setSuccess({ message: 'Content saved! Share this link:', link: shareLink });
        setContent('');
        setPassword('');
      } else {
        setError(response.error || 'Failed to save content');
      }
    } catch (err) {
      console.error('Save temporary content error:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || `Request failed with status code ${err.response.status}`);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const copyToClipboard = () => {
    if (success?.link) {
      navigator.clipboard.writeText(success.link);
      alert('Link copied to clipboard!');
    }
  };

  if (isAuthenticated === null) return <div className="text-center p-4">Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-base-200 dark:bg-gray-900 transition-colors">
      <Header isAuthenticated={true} />
      <main className="container mx-auto p-4 max-w-2xl">
        <div className="card bg-base-100 dark:bg-gray-800 shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Create Temporary Content
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Access Strategy</span>
              </label>
              <div className="flex items-center space-x-4">
                <span className="text-sm">Multiple Reads</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={strategy === 'oneread'}
                  onChange={(e) => setStrategy(e.target.checked ? 'oneread' : 'multipleread')}
                />
                <span className="text-sm">Burn After Read</span>
              </div>
            </div>

            <div className="form-control">
              <label htmlFor="expiration" className="label">
                <span className="label-text">Expiration Time</span>
              </label>
              <select
                id="expiration"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="select select-bordered w-full bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="1hour">1 Hour</option>
                <option value="1day">1 Day</option>
                <option value="1week">1 Week</option>
                <option value="1month">1 Month</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Protect with Password</span>
                <input
                  type="checkbox"
                  id="usePassword"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="checkbox checkbox-primary"
                />
              </label>
            </div>

            {usePassword && (
              <div className="form-control">
                <label htmlFor="password" className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400"
                  minLength={8}
                />
              </div>
            )}

            <div className="form-control">
              <label htmlFor="content" className="label">
                <span className="label-text">Content</span>
              </label>
              <textarea
                id="content"
                placeholder="Enter your temporary content here..."
                value={content}
                onChange={handleContentChange}
                className="textarea textarea-bordered w-full h-48 bg-white dark:bg-gray-700 dark:text-gray-100 placeholder-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Temporary Content"}
            </button>
          </form>

          {error && (
            <div className="mt-4 alert alert-error">
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mt-4 alert alert-success flex flex-col items-start">
              <span>{success.message}</span>
              <div className="flex items-center space-x-2 mt-2">
                <a href={success.link} target="_blank" rel="noopener noreferrer" className="link link-primary">
                  {success.link}
                </a>
                <button onClick={copyToClipboard} className="btn btn-sm btn-outline">
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}