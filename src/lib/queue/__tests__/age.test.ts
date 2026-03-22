import { describe, expect, it } from 'vitest';

import { PASSIVE_DEBT_RUST_AFTER_DAYS, getQueueAgeMeta } from '../age';

describe('getQueueAgeMeta', () => {
  it('returns a human-readable label for recent items', () => {
    const createdAt = '2026-03-19T12:00:00Z';
    const meta = getQueueAgeMeta(createdAt, new Date('2026-03-22T12:00:00Z'));

    expect(meta.label).toBe('3 days ago');
    expect(meta.daysOld).toBe(3);
    expect(meta.isRusty).toBe(false);
  });

  it('activates rust styling after the configured threshold', () => {
    const createdAt = '2026-03-14T12:00:00Z';
    const meta = getQueueAgeMeta(createdAt, new Date('2026-03-22T12:00:00Z'));

    expect(meta.daysOld).toBeGreaterThanOrEqual(PASSIVE_DEBT_RUST_AFTER_DAYS);
    expect(meta.isRusty).toBe(true);
  });
});
