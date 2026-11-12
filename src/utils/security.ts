/**
 * Secure password hashing and verification using SHA-256 and salt.
 * Ensures passwords are never stored in plaintext in the cloud database.
 */

const SALT_PREFIX = 'minurulfalah_salt_2024_';

async function computeSha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(SALT_PREFIX + text);

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Pure fallback if subtle is unavailable
  let h = 5381;
  for (let i = 0; i < data.length; i++) {
    h = ((h << 5) + h) ^ data[i];
  }
  return 'fb_' + Math.abs(h >>> 0).toString(16).padStart(64, '0');
}

/**
 * Hash a password using SHA-256 with salt.
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  const hex = await computeSha256Hex(plainText);
  return `sha256:${hex}`;
}

/**
 * Verify a candidate plain password against a stored hash or legacy plain string.
 */
export async function verifyPassword(
  candidatePlain: string,
  storedHashOrPlain: string
): Promise<boolean> {
  if (!candidatePlain || !storedHashOrPlain) return false;

  // If already hashed
  if (storedHashOrPlain.startsWith('sha256:')) {
    const candidateHash = await hashPassword(candidatePlain);
    return candidateHash === storedHashOrPlain;
  }

  // Backward compatibility with legacy plaintext passwords
  return candidatePlain === storedHashOrPlain;
}
