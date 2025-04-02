// src/app/temporarycontent/page.tsx
'use client';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { saveTemporaryContent, getUserTemporaryContent, deleteUserTemporaryContent } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TemporaryContentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; link: string } | null>(null);
  const [content, setContent] = useState('');
  const [strategy, setStrategy] = useState<'oneread' | 'multipleread'>('multipleread');
  const [expiration, setExpiration] = useState('1hour');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [userLinks, setUserLinks] = useState<{ identifier: string; max_date: string }[]>([]);

  // Fetch user links on mount (no auth check needed, ProtectedRoute handles it)
  const fetchUserLinks = async () => {
    try {
      const response = await getUserTemporaryContent();
      if (response.success) {
        setUserLinks(response.links || []);
      } else {
        setError(response.error || 'Failed to fetch links');
      }
    } catch (err) {
      setError('Error fetching links');
      console.error(err);
    }
  };

  // Call fetchUserLinks on mount
  useState(() => {
    fetchUserLinks();
  });

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
        fetchUserLinks(); // Refresh the list of links
      } else {
        setError(response.error || 'Failed to save content');
      }
    } catch (err) {
      console.error('Save temporary content error:', err);
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (identifier: string) => {
    try {
      const response = await deleteUserTemporaryContent(identifier);
      if (response.success) {
        setUserLinks(userLinks.filter(link => link.identifier !== identifier));
      } else {
        setError(response.error || 'Failed to delete link');
      }
    } catch (err) {
      setError('Error deleting link');
      console.error(err);
    }
  };

  const handleReset = () => {
    setSuccess(null);
    setContent('');
    setPassword('');
    setUsePassword(false);
    setStrategy('multipleread');
    setExpiration('1hour');
  };

  const copyToClipboard = () => {
    if (success?.link) {
      navigator.clipboard.writeText(success.link);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-base-200 dark:bg-gray-900 transition-colors">
        <Header isAuthenticated={true} />
        <main className="container mx-auto p-4 max-w-2xl">
          <div className="card bg-base-100 dark:bg-gray-800 shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Create Temporary Content
            </h2>

            {!success ? (
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
                      className="input input-bordered w-full bg-white dark:bg-gray-700 dark:text-gray-100"
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
                    onChange={(e) => setContent(e.target.value)}
                    className="textarea textarea-bordered w-full h-48 bg-white dark:bg-gray-700 dark:text-gray-100"
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
            ) : (
              <div className="space-y-4">
                <div className="alert alert-success flex flex-col items-start">
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
                <button onClick={handleReset} className="btn btn-secondary w-full">
                  Create New Link
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 alert alert-error">
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Table of User's Links */}
          {userLinks.length > 0 && (
            <div className="card bg-base-100 dark:bg-gray-800 shadow-xl p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Your Temporary Links
              </h2>
              <div className="mt-1">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Link</th>
                        <th>Expires</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userLinks.map((link) => (
                        <tr key={link.identifier}>
                          <td>
                            <a
                              href={`${window.location.origin}/securelinkview/${link.identifier}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link link-primary"
                            >
                              {`${window.location.origin}/securelinkview/${link.identifier}`}
                            </a>
                          </td>
                          <td>{new Date(link.max_date).toLocaleString()}</td>
                          <td>
                            <button
                              onClick={() => handleDelete(link.identifier)}
                              className="btn btn-error btn-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}