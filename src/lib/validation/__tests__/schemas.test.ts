import { describe, it, expect } from 'vitest';
import { QueueItemInsertSchema, QueueStateTransitionSchema, QueueItemStateSchema, VALID_TRANSITIONS } from '../queue';
import { RawApiKeySchema } from '../apiKeys';

describe('Queue Validation Schemas', () => {
  describe('QueueItemInsertSchema', () => {
    it('accepts valid insert with title only', () => {
      const result = QueueItemInsertSchema.safeParse({ title: 'My thought' });
      expect(result.success).toBe(true);
    });

    it('accepts valid insert with title + url + notes', () => {
      const result = QueueItemInsertSchema.safeParse({
        title: 'Article Title',
        url: 'https://example.com/article',
        notes: 'Worth reading',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null url (pure thought)', () => {
      const result = QueueItemInsertSchema.safeParse({ title: 'A thought', url: null });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = QueueItemInsertSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects title over 500 chars', () => {
      const result = QueueItemInsertSchema.safeParse({ title: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('rejects invalid URL format', () => {
      const result = QueueItemInsertSchema.safeParse({ title: 'Test', url: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects notes over 2000 chars', () => {
      const result = QueueItemInsertSchema.safeParse({ title: 'Test', notes: 'x'.repeat(2001) });
      expect(result.success).toBe(false);
    });
  });

  describe('QueueStateTransitionSchema', () => {
    it('accepts valid state values', () => {
      for (const state of ['inbox', 'passive_debt', 'resource', 'mastered']) {
        const result = QueueStateTransitionSchema.safeParse({ state });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid state values', () => {
      const result = QueueStateTransitionSchema.safeParse({ state: 'crystallizing' });
      expect(result.success).toBe(false);
    });

    it('rejects discarded state (not in 4-state machine)', () => {
      const result = QueueStateTransitionSchema.safeParse({ state: 'discarded' });
      expect(result.success).toBe(false);
    });
  });

  describe('QueueItemStateSchema', () => {
    it('has exactly 4 options', () => {
      expect(QueueItemStateSchema.options).toEqual(['inbox', 'passive_debt', 'resource', 'mastered']);
    });
  });

  describe('VALID_TRANSITIONS', () => {
    it('inbox can transition to passive_debt and resource', () => {
      expect(VALID_TRANSITIONS.inbox).toEqual(['passive_debt', 'resource']);
    });

    it('passive_debt can only transition to mastered', () => {
      expect(VALID_TRANSITIONS.passive_debt).toEqual(['mastered']);
    });

    it('resource can only transition to passive_debt', () => {
      expect(VALID_TRANSITIONS.resource).toEqual(['passive_debt']);
    });

    it('mastered is terminal (no transitions)', () => {
      expect(VALID_TRANSITIONS.mastered).toEqual([]);
    });
  });
});

describe('API Key Validation Schemas', () => {
  describe('RawApiKeySchema', () => {
    it('accepts valid ng_ prefixed key with 48 alphanumeric chars', () => {
      const key = 'ng_' + 'A'.repeat(48);
      const result = RawApiKeySchema.safeParse(key);
      expect(result.success).toBe(true);
    });

    it('rejects key without ng_ prefix', () => {
      const result = RawApiKeySchema.safeParse('sk_' + 'A'.repeat(48));
      expect(result.success).toBe(false);
    });

    it('rejects key with wrong body length', () => {
      const result = RawApiKeySchema.safeParse('ng_' + 'A'.repeat(10));
      expect(result.success).toBe(false);
    });

    it('rejects key with special characters in body', () => {
      const result = RawApiKeySchema.safeParse('ng_' + 'A'.repeat(47) + '!');
      expect(result.success).toBe(false);
    });
  });
});
