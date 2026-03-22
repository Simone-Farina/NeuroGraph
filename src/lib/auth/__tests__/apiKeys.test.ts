import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, getKeyPrefix, verifyApiKey } from '../apiKeys';

describe('API Key Utilities', () => {
  describe('generateApiKey', () => {
    it('returns a string matching ng_ prefix + 48 alphanumeric chars', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^ng_[A-Za-z0-9]{48}$/);
      expect(key.length).toBe(51);
    });

    it('generates unique keys on consecutive calls', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('hashApiKey', () => {
    it('returns a 64-char hex string (SHA-256)', () => {
      const key = generateApiKey();
      const hash = hashApiKey(key);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is deterministic (same input = same output)', () => {
      const key = generateApiKey();
      expect(hashApiKey(key)).toBe(hashApiKey(key));
    });
  });

  describe('getKeyPrefix', () => {
    it('returns first 11 chars (ng_ + 8 chars)', () => {
      const key = 'ng_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv';
      const prefix = getKeyPrefix(key);
      expect(prefix).toBe('ng_ABCDEFGH');
      expect(prefix.length).toBe(11);
    });
  });

  describe('verifyApiKey', () => {
    it('returns true for matching key and hash', () => {
      const key = generateApiKey();
      const hash = hashApiKey(key);
      expect(verifyApiKey(key, hash)).toBe(true);
    });

    it('returns false for non-matching key and hash', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      const hash2 = hashApiKey(key2);
      expect(verifyApiKey(key1, hash2)).toBe(false);
    });
  });
});
