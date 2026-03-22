import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/queueQueries', () => ({
  queueQueries: {
    getById: vi.fn(),
    updateState: vi.fn(),
  },
}));

import { queueQueries } from '@/lib/db/queueQueries';
import {
  advanceQueueItemToMastered,
  resolveCrystallizeQueueItemId,
} from '@/lib/crystallize/provenance';

describe('crystallize provenance helpers', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the first crystallize-linked queue item id from message metadata', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [
              { metadata: null },
              {
                metadata: {
                  crystallize: {
                    queue_item_id: 'queue-1',
                    status: 'seeded',
                  },
                },
              },
            ],
            error: null,
          }),
        })),
      })),
    });

    await expect(
      resolveCrystallizeQueueItemId(mockSupabase, 'conv-1')
    ).resolves.toBe('queue-1');
  });

  it('walks resource to mastered through passive_debt', async () => {
    vi.mocked(queueQueries.getById).mockResolvedValue({
      id: 'queue-1',
      user_id: 'user-1',
      title: 'Item',
      url: null,
      notes: null,
      state: 'resource',
      source_domain: null,
      favicon_url: null,
      estimated_read_time: null,
      created_at: '2026-03-22T00:00:00Z',
      updated_at: '2026-03-22T00:00:00Z',
    });
    vi.mocked(queueQueries.updateState)
      .mockResolvedValueOnce({
        id: 'queue-1',
        user_id: 'user-1',
        title: 'Item',
        url: null,
        notes: null,
        state: 'passive_debt',
        source_domain: null,
        favicon_url: null,
        estimated_read_time: null,
        created_at: '2026-03-22T00:00:00Z',
        updated_at: '2026-03-22T00:00:00Z',
      })
      .mockResolvedValueOnce({
        id: 'queue-1',
        user_id: 'user-1',
        title: 'Item',
        url: null,
        notes: null,
        state: 'mastered',
        source_domain: null,
        favicon_url: null,
        estimated_read_time: null,
        created_at: '2026-03-22T00:00:00Z',
        updated_at: '2026-03-22T00:00:00Z',
      });

    await expect(advanceQueueItemToMastered(mockSupabase, 'queue-1')).resolves.toBe('mastered');

    expect(queueQueries.updateState).toHaveBeenNthCalledWith(
      1,
      mockSupabase,
      'queue-1',
      'resource',
      'passive_debt'
    );
    expect(queueQueries.updateState).toHaveBeenNthCalledWith(
      2,
      mockSupabase,
      'queue-1',
      'passive_debt',
      'mastered'
    );
  });

  it('returns already_mastered without issuing new transitions', async () => {
    vi.mocked(queueQueries.getById).mockResolvedValue({
      id: 'queue-1',
      user_id: 'user-1',
      title: 'Item',
      url: null,
      notes: null,
      state: 'mastered',
      source_domain: null,
      favicon_url: null,
      estimated_read_time: null,
      created_at: '2026-03-22T00:00:00Z',
      updated_at: '2026-03-22T00:00:00Z',
    });

    await expect(
      advanceQueueItemToMastered(mockSupabase, 'queue-1')
    ).resolves.toBe('already_mastered');
    expect(queueQueries.updateState).not.toHaveBeenCalled();
  });
});
