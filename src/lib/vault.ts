import type { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UsersModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';

// Maximum accepted vault size: 20 MiB (a .kdbx file rarely exceeds a few MB).
export const VAULT_MAX_BYTES = 20 * 1024 * 1024;

const VAULT_FILE_NAME = 'database.kdbx';

// Only allow safe user id characters so the R2 key can never be used for
// path traversal. Session ids are UUIDs, which always match this pattern.
const SAFE_USER_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function isSafeUserId(userId: string): boolean {
  return SAFE_USER_ID.test(userId);
}

// Canonical R2 key for a user vault. The key is derived exclusively from the
// authenticated session user id, never from client input (IDOR prevention).
export function buildVaultKey(userId: string): string {
  if (!isSafeUserId(userId)) {
    throw new Error('Unsafe user id for vault key');
  }
  return `vaults/${userId}/${VAULT_FILE_NAME}`;
}

// Minimal structural types for the Cloudflare R2 binding. They mirror the
// subset of the workers-types API used here so no extra dependency is needed.
export interface R2ObjectMetadata {
  etag: string;
  httpEtag: string;
  size: number;
  uploaded: Date;
}

export interface R2ObjectBody extends R2ObjectMetadata {
  body: ReadableStream<Uint8Array>;
}

export interface R2PutResult extends R2ObjectMetadata {
  key: string;
}

export interface R2BucketLike {
  head(key: string): Promise<R2ObjectMetadata | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string };
      customMetadata?: Record<string, string>;
    }
  ): Promise<R2PutResult>;
  delete(key: string): Promise<void>;
}

// Resolve the R2 bucket from the Cloudflare Workers environment.
// Returns null when running outside a Worker (local dev without bindings,
// unit tests) so callers can answer 501 instead of crashing.
export function getVaultBucket(): R2BucketLike | null {
  try {
    const bucket = getCloudflareContext().env.VAULTS_BUCKET as R2BucketLike | undefined;
    if (!bucket || typeof bucket.get !== 'function') {
      return null;
    }
    return bucket;
  } catch {
    return null;
  }
}

export interface VaultAuthSuccess {
  userId: string;
  hasVault: boolean;
  vaultLastSync: Date | null;
}

export interface VaultAuthFailure {
  status: 401 | 400 | 500;
  error: string;
}

// Validate the session cookie and confirm the user still exists in MongoDB.
// The returned userId is the only value ever used to build the R2 key.
// Never throws: infrastructure failures are reported as 500 auth failures so
// route handlers always answer JSON instead of crashing the Worker.
export async function resolveVaultUser(
  request: NextRequest
): Promise<VaultAuthSuccess | VaultAuthFailure> {
  try {
    const session = await getSession(request);
    if (!session) {
      return { status: 401, error: 'Unauthorized - Please log in' };
    }
    if (!isSafeUserId(session.id)) {
      return { status: 400, error: 'Invalid session identity' };
    }
    await connectToDatabase();
    const doc = await UsersModel.findOne({ supabase_id: session.id }).lean<{
      hasVault?: boolean;
      vaultLastSync?: Date | null;
    }>();
    if (!doc) {
      return { status: 401, error: 'Unauthorized - Unknown user' };
    }
    return {
      userId: session.id,
      hasVault: doc.hasVault === true,
      vaultLastSync: doc.vaultLastSync ?? null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Vault authentication failed:', { message });
    return { status: 500, error: 'Internal server error' };
  }
}

function stripQuotes(value: string): string {
  let v = value.trim();
  if (v.startsWith('W/')) {
    v = v.slice(2).trim();
  }
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    v = v.slice(1, -1);
  }
  return v;
}

// Compare an If-Match header against the current ETag. Supports multiple
// values, weak validators and the "*" wildcard.
export function etagMatches(ifMatch: string | null, currentEtag: string | null): boolean {
  if (!ifMatch) {
    return true;
  }
  if (!currentEtag) {
    return false;
  }
  const candidates = ifMatch
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (candidates.includes('*')) {
    return true;
  }
  const current = stripQuotes(currentEtag);
  return candidates.some((candidate) => stripQuotes(candidate) === current);
}

// Headers shared by GET/HEAD/PUT vault responses. Last-Modified is required
// by KeeWeb, which uses it as the file revision for conflict detection.
export function vaultObjectHeaders(obj: R2ObjectMetadata): Record<string, string> {
  const uploaded = obj.uploaded instanceof Date ? obj.uploaded : new Date(obj.uploaded);
  return {
    'Content-Type': 'application/octet-stream',
    ETag: obj.httpEtag || `"${obj.etag}"`,
    'Last-Modified': uploaded.toUTCString(),
    'Content-Length': String(obj.size),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Accept-Ranges': 'bytes',
    'Access-Control-Expose-Headers': 'ETag, Last-Modified',
  };
}

// Best-effort vault removal, used on account deletion. Never throws.
export async function deleteUserVault(bucket: R2BucketLike, userId: string): Promise<void> {
  try {
    await bucket.delete(buildVaultKey(userId));
  } catch {
    // Storage cleanup must not fail account deletion.
  }
}
