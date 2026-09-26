// Password hashing that works on Node.js and Cloudflare Workers.
//
// Argon2id (password_version 1) remains the primary scheme, but its native
// binding cannot load inside workerd: a top-level `import 'argon2'` crashes
// the importing route module at evaluation time (Error 500 on every request).
// Argon2 is therefore imported lazily, and WebCrypto PBKDF2-SHA256
// (password_version 3) is used as a portable fallback. WebCrypto is available
// in Node 18+, Workers, and browsers without any extra dependency.

export const PASSWORD_VERSION_ARGON2 = 1;
export const PASSWORD_VERSION_PBKDF2 = 3;

const ARGON2_OPTIONS = { memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 } as const;

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BYTES = 32;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_PREFIX = 'pbkdf2';

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// Portable PBKDF2 primitives, exported for testing and reuse.
export async function hashPbkdf2(password: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('WebCrypto subtle is not available');
  }
  const salt = new Uint8Array(PBKDF2_SALT_BYTES);
  globalThis.crypto.getRandomValues(salt);
  const keyMaterial = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const derived = await subtle.deriveBits(
    { name: 'PBKDF2', hash: PBKDF2_HASH, salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    PBKDF2_KEY_BYTES * 8
  );
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(new Uint8Array(derived))}`;
}

export async function verifyPbkdf2(storedHash: string, password: string): Promise<boolean> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return false;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== PBKDF2_PREFIX) {
    return false;
  }
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = fromBase64(parts[2]);
    expected = fromBase64(parts[3]);
  } catch {
    return false;
  }
  const keyMaterial = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const derived = await subtle.deriveBits(
    { name: 'PBKDF2', hash: PBKDF2_HASH, salt: salt as BufferSource, iterations },
    keyMaterial,
    expected.length * 8
  );
  return timingSafeEqual(new Uint8Array(derived), expected);
}

export interface HashedPassword {
  hash: string;
  version: number;
}

// Hash a user password. Uses Argon2id when its native binding loads (Node.js)
// and falls back to PBKDF2-SHA256 on runtimes without native modules
// (Cloudflare Workers).
export async function hashPassword(password: string): Promise<HashedPassword> {
  try {
    const { default: argon2 } = await import('argon2');
    const hash = await argon2.hash(password, { type: argon2.argon2id, ...ARGON2_OPTIONS });
    return { hash, version: PASSWORD_VERSION_ARGON2 };
  } catch {
    return { hash: await hashPbkdf2(password), version: PASSWORD_VERSION_PBKDF2 };
  }
}

// Verify a user password hash, dispatching on the stored password_version.
export async function verifyPassword(
  storedHash: string,
  version: number | undefined,
  password: string
): Promise<boolean> {
  if (version === PASSWORD_VERSION_PBKDF2 || storedHash.startsWith(`${PBKDF2_PREFIX}$`)) {
    return verifyPbkdf2(storedHash, password);
  }
  const { default: argon2 } = await import('argon2');
  return argon2.verify(storedHash, password);
}

// Hash a temporary-link password. Same fallback strategy as hashPassword;
// the returned string is self-describing so no schema change is needed.
export async function hashContentPassword(password: string): Promise<string> {
  return (await hashPassword(password)).hash;
}

// Verify a temporary-link password, dispatching on the hash prefix.
export async function verifyContentPassword(storedHash: string, password: string): Promise<boolean> {
  if (storedHash.startsWith(`${PBKDF2_PREFIX}$`)) {
    return verifyPbkdf2(storedHash, password);
  }
  const { default: argon2 } = await import('argon2');
  return argon2.verify(storedHash, password);
}
