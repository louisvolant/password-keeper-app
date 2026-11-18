// Server-side encryption-at-rest for temporary (ephemeral) shared secrets.
//
// Security model: link content is sealed with AES-256-GCM on the server under
// a key that never leaves the server environment. MongoDB only ever stores
// authenticated ciphertext, and the 128-bit GCM auth tag makes any tampering
// with stored records detectable.
//
// This replaces the previous client-side scheme, which had two critical
// weaknesses: its fallback key ('12345678901234567890123456789012') shipped
// in the public JS bundle — making every password-less link trivially
// decryptable by anyone who knows the URL — and it derived keys directly
// from the link password without a salt or KDF, enabling offline brute-force
// of the stored ciphertext.
//
// Trade-off: the server handles plaintext in memory (like any web backend)
// while the database and any DB dump only contain authenticated ciphertext.
// The vault remains fully zero-knowledge (client-side KeeWeb encryption).

import crypto from 'crypto';

const KEY_ENV_VAR = 'TEMPORARY_CONTENT_ENCRYPTION_KEY';
const IV_BYTES = 12; // 96-bit IV, the recommended size for AES-GCM.

let cachedKey: Buffer | null = null;

// Derive the 256-bit data-encryption key from the configured secret.
// Fails closed: without a properly configured key, secrets are never
// stored (or served) in plaintext.
function getEncryptionKey(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }
  const secret = process.env[KEY_ENV_VAR];
  if (!secret || secret.trim().length < 32) {
    throw new Error(`${KEY_ENV_VAR} is not configured. Generate one with: openssl rand -hex 32`);
  }
  cachedKey = crypto.createHash('sha256').update(secret).digest();
  return cachedKey;
}

// Whether ephemeral-link encryption is usable in the current environment.
// Used by routes and diagnostics to report a configuration error instead
// of crashing the worker at evaluation time.
export function isTemporaryContentEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

export interface SealedTemporaryContent {
  /** Hex-encoded AES-256-GCM ciphertext. */
  encryptedContent: string;
  /** Hex-encoded random 96-bit IV. */
  iv: string;
  /** Hex-encoded 128-bit GCM authentication tag. */
  authTag: string;
}

// Encrypt plaintext link content with a fresh random IV.
export function sealTemporaryContent(plaintext: string): SealedTemporaryContent {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    encryptedContent: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

// Decrypt and authenticate a sealed record. Throws on a wrong key, a
// corrupted ciphertext, or a tampered auth tag.
export function openTemporaryContent(sealed: SealedTemporaryContent): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(sealed.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(sealed.authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(sealed.encryptedContent, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
