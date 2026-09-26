import { NextRequest, NextResponse } from 'next/server';
import { UsersModel } from '@/lib/userDao';
import { logger } from '@/lib/logger';
import {
  VAULT_MAX_BYTES,
  buildVaultKey,
  deleteUserVault,
  etagMatches,
  getVaultBucket,
  resolveVaultUser,
  vaultObjectHeaders,
} from '@/lib/vault';

export const runtime = 'nodejs';

function unauthorized(error: string, status: 401 | 400 | 500 = 401) {
  return NextResponse.json({ success: false, error }, { status });
}

// GET /api/vault — download the authenticated user vault.
// Returns 404 when the user has never saved a vault yet (Option A:
// KeeWeb then offers to create a new file, whose first save is a PUT).
export async function GET(request: NextRequest) {
  const auth = await resolveVaultUser(request);
  if ('error' in auth) {
    return unauthorized(auth.error, auth.status);
  }

  const bucket = getVaultBucket();
  if (!bucket) {
    return NextResponse.json({ success: false, error: 'Vault storage is not configured' }, { status: 501 });
  }

  try {
    const obj = await bucket.get(buildVaultKey(auth.userId));
    if (!obj) {
      return NextResponse.json(
        { success: false, error: 'Vault not found', hasVault: false },
        { status: 404 }
      );
    }
    return new Response(obj.body as ReadableStream, {
      status: 200,
      headers: vaultObjectHeaders(obj),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Vault download failed:', { message, userId: auth.userId });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// HEAD /api/vault — stat the vault without downloading it (used by KeeWeb
// for revision checks; Last-Modified acts as the file revision).
export async function HEAD(request: NextRequest) {
  const auth = await resolveVaultUser(request);
  if ('error' in auth) {
    return new NextResponse(null, { status: auth.status });
  }

  const bucket = getVaultBucket();
  if (!bucket) {
    return new NextResponse(null, { status: 501 });
  }

  try {
    const meta = await bucket.head(buildVaultKey(auth.userId));
    if (!meta) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(null, { status: 200, headers: vaultObjectHeaders(meta) });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Vault stat failed:', { message, userId: auth.userId });
    return new NextResponse(null, { status: 500 });
  }
}

// PUT /api/vault — create or replace the authenticated user vault.
// Honors If-Match for optimistic concurrency (412 on stale revision).
export async function PUT(request: NextRequest) {
  const auth = await resolveVaultUser(request);
  if ('error' in auth) {
    return unauthorized(auth.error, auth.status);
  }

  const bucket = getVaultBucket();
  if (!bucket) {
    return NextResponse.json({ success: false, error: 'Vault storage is not configured' }, { status: 501 });
  }

  const declaredLength = request.headers.get('content-length');
  if (declaredLength && Number(declaredLength) > VAULT_MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Vault file too large' }, { status: 413 });
  }

  try {
    const key = buildVaultKey(auth.userId);
    const current = await bucket.head(key);

    const ifMatch = request.headers.get('if-match');
    if (ifMatch) {
      if (!current) {
        // Nothing to match against: refuse blind conditional creation.
        return NextResponse.json(
          { success: false, error: 'Vault not found (precondition failed)' },
          { status: 412 }
        );
      }
      if (!etagMatches(ifMatch, current.httpEtag || current.etag)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Vault was modified concurrently',
            etag: current.httpEtag || `"${current.etag}"`,
          },
          {
            status: 412,
            headers: { ETag: current.httpEtag || `"${current.etag}"` },
          }
        );
      }
    }

    const payload = await request.arrayBuffer();
    if (payload.byteLength === 0) {
      return NextResponse.json({ success: false, error: 'Empty vault payload' }, { status: 400 });
    }
    if (payload.byteLength > VAULT_MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Vault file too large' }, { status: 413 });
    }

    const stored = await bucket.put(key, payload, {
      httpMetadata: {
        contentType: 'application/octet-stream',
        cacheControl: 'no-store',
      },
      customMetadata: { userId: auth.userId, updatedAt: new Date().toISOString() },
    });

    await UsersModel.updateOne(
      { supabase_id: auth.userId },
      { $set: { hasVault: true, vaultLastSync: new Date() } }
    );

    const etag = stored.httpEtag || `"${stored.etag}"`;
    logger.info('Vault saved successfully:', { userId: auth.userId, size: stored.size });
    return NextResponse.json(
      {
        success: true,
        hasVault: true,
        etag,
        lastModified: new Date(stored.uploaded).toUTCString(),
        size: stored.size,
      },
      { status: 200, headers: { ETag: etag } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Vault upload failed:', { message, userId: auth.userId });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/vault — permanently remove the authenticated user vault.
export async function DELETE(request: NextRequest) {
  const auth = await resolveVaultUser(request);
  if ('error' in auth) {
    return unauthorized(auth.error, auth.status);
  }

  const bucket = getVaultBucket();
  if (!bucket) {
    return NextResponse.json({ success: false, error: 'Vault storage is not configured' }, { status: 501 });
  }

  try {
    await deleteUserVault(bucket, auth.userId);
    await UsersModel.updateOne(
      { supabase_id: auth.userId },
      { $set: { hasVault: false, vaultLastSync: null } }
    );
    return NextResponse.json({ success: true, hasVault: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Vault deletion failed:', { message, userId: auth.userId });
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// OPTIONS /api/vault — WebDAV preflight. Intentionally unauthenticated:
// browsers and KeeWeb must be able to probe the endpoint before sending
// credentials, and no vault data is disclosed here.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, HEAD, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Authorization, Content-Type, Cache-Control, If-Match, If-None-Match, DNT, Keep-Alive, User-Agent, X-Requested-With, Origin, Accept',
      'Access-Control-Expose-Headers': 'ETag, Last-Modified',
      'Access-Control-Max-Age': '1728000',
    },
  });
}
