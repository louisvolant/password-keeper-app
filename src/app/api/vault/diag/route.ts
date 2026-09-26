import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';
import { UsersModel } from '@/lib/userDao';
import { buildVaultKey, getVaultBucket, isSafeUserId } from '@/lib/vault';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// TEMPORARY diagnostic endpoint (to be removed once the production vault
// issue is root-caused). Authenticated users get a per-step breakdown of the
// vault request pipeline. No secrets are ever returned; error messages are
// scrubbed of embedded credentials.
function scrub(message: string): string {
  return message.replace(/:\/\/[^/@\s]+@/, '://***@').slice(0, 300);
}

function stepError(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Unknown error';
  return scrub(message);
}

async function withTimeout<T>(label: string, work: () => Promise<T>): Promise<{ ok: boolean; result?: T; error?: string }> {
  try {
    const result = await Promise.race([
      work(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), 10000)),
    ]);
    return { ok: true, result };
  } catch (err: unknown) {
    return { ok: false, error: stepError(err) };
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized - Please log in' }, { status: 401 });
  }

  const steps: Record<string, unknown> = {
    session: { ok: true, userIdPrefix: session.id.slice(0, 8), idSafe: isSafeUserId(session.id) },
    env: { sessionKeySet: !!process.env.SESSION_COOKIE_KEY },
  };

  const db = await withTimeout('database', async () => {
    await connectToDatabase();
    const doc = await UsersModel.findOne({ supabase_id: session.id }).lean<{ hasVault?: boolean }>();
    return { userFound: !!doc, hasVault: doc?.hasVault === true };
  });
  steps.database = db;

  if (db.ok && (db.result as { userFound: boolean }).userFound) {
    const bucket = getVaultBucket();
    steps.bucket = { bound: bucket !== null };
    if (bucket && isSafeUserId(session.id)) {
      const head = await withTimeout('r2-head', async () => {
        const meta = await bucket.head(buildVaultKey(session.id));
        return { exists: meta !== null, size: meta?.size ?? null };
      });
      steps.r2Head = head;
    }
  }

  logger.info('Vault diag requested:', { userId: session.id, steps });
  return NextResponse.json({ success: true, steps });
}
