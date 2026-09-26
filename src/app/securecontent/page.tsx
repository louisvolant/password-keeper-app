// src/app/securecontent/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, Download, ExternalLink, RefreshCw, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import ClientLayout from '../ClientLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';

interface VaultStatus {
  success: boolean;
  hasVault: boolean;
  exists: boolean;
  size?: number;
  etag?: string;
  lastModified?: string;
  vaultLastSync?: string | null;
  error?: string;
}

const KEEWEB_URL = '/keeweb/?config=/keeweb-config.json';

function formatBytes(size?: number): string {
  if (size === undefined || size === null) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export default function SecureContentPage() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [keewebEmbedded, setKeewebEmbedded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/vault/status', { cache: 'no-store' });
      let data: VaultStatus | null = null;
      try {
        data = (await res.json()) as VaultStatus;
      } catch {
        // Non-JSON response (gateway or worker crash page).
      }
      if (!res.ok || !data) {
        setStatus(null);
        setError(data?.error || `Vault service error (HTTP ${res.status}).`);
        return;
      }
      setStatus(data);
      if (!data.success) {
        setError(data.error || 'Vault service returned an error.');
      }
    } catch (err) {
      console.error(err);
      setStatus(null);
      setError('Unable to reach the vault service.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Detect whether the KeeWeb static app was vendored via npm run keeweb:setup.
    fetch('/keeweb/index.html', { method: 'HEAD' })
      .then((res) => setKeewebEmbedded(res.ok))
      .catch(() => setKeewebEmbedded(false));
  }, [fetchStatus]);

  const handleDownload = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault', { cache: 'no-store' });
      if (!res.ok) {
        setError(res.status === 404 ? 'No vault saved yet.' : 'Download failed.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'database.kdbx';
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice('Vault backup downloaded.');
    } catch (err) {
      console.error(err);
      setError('Download failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete your vault? This cannot be undone.')) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Deletion failed.');
        return;
      }
      setNotice('Vault deleted.');
      await fetchStatus();
    } catch (err) {
      console.error(err);
      setError('Deletion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <ClientLayout isLoading={false}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-4">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Status card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">KeePass Vault</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Zero-knowledge .kdbx vault synced through an authenticated R2 proxy.
                  </p>
                </div>
              </div>

              {isLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Checking vault status…</p>
              ) : status?.hasVault ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl bg-green-50 dark:bg-green-900/30 p-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-700 dark:text-gray-200">Vault active</span>
                  </div>
                  <div className="rounded-xl bg-gray-100 dark:bg-gray-700/50 p-3 text-gray-700 dark:text-gray-200">
                    Size: {formatBytes(status.size)}
                  </div>
                  <div className="rounded-xl bg-gray-100 dark:bg-gray-700/50 p-3 text-gray-700 dark:text-gray-200">
                    Last sync: {status.lastModified ?? status.vaultLastSync ?? '—'}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 p-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    No vault saved yet. Open KeeWeb below, create a new database, and save it —
                    the first save creates your encrypted vault on the server. Your master
                    password never leaves your browser.
                  </span>
                </div>
              )}

              {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
              {notice && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{notice}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={fetchStatus} disabled={isLoading || actionLoading} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh status
                </Button>
                <Button variant="outline" onClick={handleDownload} disabled={!status?.hasVault || actionLoading} className="flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download backup
                </Button>
                <Button variant="outline" onClick={handleDelete} disabled={!status?.hasVault || actionLoading} className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Trash2 className="w-4 h-4" /> Delete vault
                </Button>
                {keewebEmbedded && (
                  <Link href={KEEWEB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex">
                    <Button variant="outline" className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" /> Open KeeWeb in new tab
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* KeeWeb client */}
            {keewebEmbedded ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                <iframe
                  src={KEEWEB_URL}
                  title="KeeWeb password manager"
                  className="w-full h-[75vh] min-h-[540px] border-0"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  KeeWeb client not installed
                </h2>
                <p>
                  The KeeWeb static app is not vendored in this deployment. On the server (or a
                  fresh checkout), run <code className="px-1 rounded bg-gray-100 dark:bg-gray-700">npm run keeweb:setup</code> to
                  download it from the official keeweb/keeweb release into <code className="px-1 rounded bg-gray-100 dark:bg-gray-700">public/keeweb/</code>,
                  then rebuild. It is served same-origin so your session authenticates
                  vault sync automatically at <code className="px-1 rounded bg-gray-100 dark:bg-gray-700">/api/vault</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}
