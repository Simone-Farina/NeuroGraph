import { createHash, timingSafeEqual } from 'node:crypto';
import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateBody = customAlphabet(alphabet, 48);

/**
 * Generates a new raw API key. Returned once to the user; never stored.
 * Format: ng_<48 alphanumeric chars> (~285 bits of entropy)
 */
export function generateApiKey(): string {
  return `ng_${generateBody()}`;
}

/**
 * Hashes an API key for storage. Uses SHA-256 -- appropriate for high-entropy tokens.
 * Returns a 64-char lowercase hex string.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Extracts the display prefix from a raw key.
 * Stored in user_api_keys.key_prefix for UI display.
 * Returns "ng_" + first 8 body chars = 11 chars total.
 */
export function getKeyPrefix(rawKey: string): string {
  return rawKey.substring(0, 11);
}

/**
 * Timing-safe comparison of a raw key against a stored hash.
 * Used in /api/capture to validate an incoming bearer token.
 */
export function verifyApiKey(rawKey: string, storedHash: string): boolean {
  const incoming = hashApiKey(rawKey);
  const a = Buffer.from(incoming, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
