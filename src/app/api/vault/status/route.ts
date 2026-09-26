import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { buildVaultKey, getVaultBucket, resolveVaultUser } from '@/lib/vault';

export const runtime = 'nodejs';

// GET /api/vault/status — lightweight vault metadata without downloading
// the binary (powers the /securecontent dashboard).
export async function GET(request: NextRequest) {
  const auth = await resolveVaultUser(request);
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const bucket = getVaultBucket();
  if (!bucket) {
    return NextResponse.json({ success: false, error: 'Vault storage is not configured' }, { status: 501 });
  }

  try {
    const meta = await bucket.head(buildVaultKey(auth.userId));
    if (!meta) {
      return NextResponse.json({
        success: true,
        hasVault: false,
        exists: false,
        vaultLastSync: auth.vaultLastSync,
      });
    }
    return NextResponse.json({
      success: true,
      hasVault: true,
      exists: true,
      size: meta.size,
      etag: meta.httpEtag || `"${meta.etag}"`,
      lastModified: new Date(meta.uploaded).toUTCString(),
      vaultLastSync: auth.vaultLastSync,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Vault status check failed:', { message, userId: auth.userId });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
