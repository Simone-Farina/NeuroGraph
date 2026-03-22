import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockSupabase,
  mockConversationInsert,
  mockConversationLookupSingle,
  mockMessageInsert,
} = vi.hoisted(() => {
  const mockConversationInsert = vi.fn();
  const mockConversationLookupSingle = vi.fn();
  const mockMessageInsert = vi.fn();

  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn((table: string) => {
      if (table === 'conversations') {
        return {
          insert: mockConversationInsert,
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockConversationLookupSingle,
            })),
          })),
        };
      }

      if (table === 'messages') {
        return {
          insert: mockMessageInsert,
        };
      }

      throw new Error(`Unexpected table mock: ${table}`);
    }),
  };

  return {
    mockSupabase,
    mockConversationInsert,
    mockConversationLookupSingle,
    mockMessageInsert,
  };
});

vi.mock('@/lib/auth/supabase', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabase),
}));

vi.mock('@/lib/db/queueQueries', () => ({
  queueQueries: {
    getById: vi.fn(),
  },
}));

vi.mock('@/lib/crystallize/article', () => ({
  extractCrystallizeSource: vi.fn(),
  classifyExtractionFailure: vi.fn(),
}));

vi.mock('@/lib/crystallize/seed', () => ({
  generateCrystallizeSeed: vi.fn(),
}));

import { queueQueries } from '@/lib/db/queueQueries';
import {
  classifyExtractionFailure,
  extractCrystallizeSource,
} from '@/lib/crystallize/article';
import { generateCrystallizeSeed } from '@/lib/crystallize/seed';
import { POST as startCrystallize } from '../route';
import { POST as continueCrystallize } from '../manual/route';

const USER = { id: 'user-1', email: 'test@example.com' };

const QUEUE_ITEM = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: USER.id,
  title: 'Deliberate Learning Systems',
  url: 'https://example.com/article',
  notes: 'Compare against the current queue heuristics.',
  state: 'resource' as const,
  source_domain: 'example.com',
  favicon_url: null,
  estimated_read_time: null,
  created_at: '2026-03-22T00:00:00Z',
  updated_at: '2026-03-22T00:00:00Z',
};

function jsonRequest(url: string, body: object) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('crystallize routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: USER }, error: null });
    mockConversationInsert.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: '223e4567-e89b-12d3-a456-426614174000' },
          error: null,
        }),
      })),
    });
    mockConversationLookupSingle.mockResolvedValue({
      data: { id: '223e4567-e89b-12d3-a456-426614174000', user_id: USER.id },
      error: null,
    });
    mockMessageInsert.mockResolvedValue({ error: null });

    vi.mocked(queueQueries.getById).mockResolvedValue(QUEUE_ITEM);
    vi.mocked(extractCrystallizeSource).mockResolvedValue({
      title: 'Deliberate Learning Systems',
      content:
        'A'.repeat(450) +
        '\n\nThis source argues for repeated retrieval, compact synthesis, and reflective questioning over passive rereading.',
      url: QUEUE_ITEM.url!,
      domain: 'example.com',
    });
    vi.mocked(classifyExtractionFailure).mockReturnValue('unsupported');
    vi.mocked(generateCrystallizeSeed).mockResolvedValue({
      briefing:
        'This source argues that durable learning depends on recall, compression, and explicit reasoning instead of passive review.',
      openingQuestion:
        'What change would force your current intake flow to become more active rather than more archival?',
      assistantMessage:
        'Deliberate Learning Systems\nexample.com\n\nThis source argues that durable learning depends on recall, compression, and explicit reasoning instead of passive review.\n\nQueue note: Compare against the current queue heuristics.\n\nQuestion: What change would force your current intake flow to become more active rather than more archival?',
    });
  });

  it('returns 401 for unauthorized start requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await startCrystallize(
      jsonRequest('http://localhost/api/crystallize', {
        queueItemId: QUEUE_ITEM.id,
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 401 for unauthorized manual continuation requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await continueCrystallize(
      jsonRequest('http://localhost/api/crystallize/manual', {
        conversationId: '223e4567-e89b-12d3-a456-426614174000',
        queueItemId: QUEUE_ITEM.id,
        pastedText: 'B'.repeat(500),
      })
    );

    expect(response.status).toBe(401);
  });

  it('returns 404 when the queue item does not belong to the session user', async () => {
    vi.mocked(queueQueries.getById).mockResolvedValue({
      ...QUEUE_ITEM,
      user_id: 'other-user',
    });

    const response = await startCrystallize(
      jsonRequest('http://localhost/api/crystallize', {
        queueItemId: QUEUE_ITEM.id,
      })
    );

    expect(response.status).toBe(404);
  });

  it('returns 404 when the conversation does not belong to the session user', async () => {
    mockConversationLookupSingle.mockResolvedValue({
      data: { id: '223e4567-e89b-12d3-a456-426614174000', user_id: 'other-user' },
      error: null,
    });

    const response = await continueCrystallize(
      jsonRequest('http://localhost/api/crystallize/manual', {
        conversationId: '223e4567-e89b-12d3-a456-426614174000',
        queueItemId: QUEUE_ITEM.id,
        pastedText: 'B'.repeat(500),
      })
    );

    expect(response.status).toBe(404);
  });

  it('creates a seeded conversation for a URL-backed queue item', async () => {
    const response = await startCrystallize(
      jsonRequest('http://localhost/api/crystallize', {
        queueItemId: QUEUE_ITEM.id,
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      conversationId: '223e4567-e89b-12d3-a456-426614174000',
      queueItemId: QUEUE_ITEM.id,
      mode: 'seeded',
    });
    expect(generateCrystallizeSeed).toHaveBeenCalled();
    expect(mockMessageInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: '223e4567-e89b-12d3-a456-426614174000',
        role: 'assistant',
        metadata: {
          crystallize: expect.objectContaining({
            queue_item_id: QUEUE_ITEM.id,
            source_title: 'Deliberate Learning Systems',
            source_url: QUEUE_ITEM.url,
            source_domain: 'example.com',
            status: 'seeded',
          }),
        },
      })
    );
  });

  it('creates an awaiting_manual_paste conversation when the queue item has no URL', async () => {
    vi.mocked(queueQueries.getById).mockResolvedValue({
      ...QUEUE_ITEM,
      url: null,
      source_domain: null,
    });

    const response = await startCrystallize(
      jsonRequest('http://localhost/api/crystallize', {
        queueItemId: QUEUE_ITEM.id,
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      conversationId: '223e4567-e89b-12d3-a456-426614174000',
      queueItemId: QUEUE_ITEM.id,
      mode: 'awaiting_manual_paste',
      reason: 'missing_url',
    });
    expect(mockMessageInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          crystallize: expect.objectContaining({
            status: 'awaiting_manual_paste',
            failure_reason: 'missing_url',
          }),
        },
      })
    );
  });

  it('propagates extraction fallback reasons when extraction fails', async () => {
    vi.mocked(extractCrystallizeSource).mockRejectedValue(new Error('403 forbidden'));
    vi.mocked(classifyExtractionFailure).mockReturnValue('paywall');

    const response = await startCrystallize(
      jsonRequest('http://localhost/api/crystallize', {
        queueItemId: QUEUE_ITEM.id,
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      conversationId: '223e4567-e89b-12d3-a456-426614174000',
      queueItemId: QUEUE_ITEM.id,
      mode: 'awaiting_manual_paste',
      reason: 'paywall',
    });
    expect(mockMessageInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          crystallize: expect.objectContaining({
            status: 'awaiting_manual_paste',
            failure_reason: 'paywall',
          }),
        },
      })
    );
  });

  it('validates manual paste length before summarizing', async () => {
    const response = await continueCrystallize(
      jsonRequest('http://localhost/api/crystallize/manual', {
        conversationId: '223e4567-e89b-12d3-a456-426614174000',
        queueItemId: QUEUE_ITEM.id,
        pastedText: 'too short',
      })
    );

    expect(response.status).toBe(400);
    expect(generateCrystallizeSeed).not.toHaveBeenCalled();
  });

  it('inserts the marker message and assistant seed on manual paste success', async () => {
    const response = await continueCrystallize(
      jsonRequest('http://localhost/api/crystallize/manual', {
        conversationId: '223e4567-e89b-12d3-a456-426614174000',
        queueItemId: QUEUE_ITEM.id,
        pastedText: 'B'.repeat(500),
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockMessageInsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        conversation_id: '223e4567-e89b-12d3-a456-426614174000',
        role: 'user',
        content: 'Source material pasted for crystallization.',
        metadata: {
          queue_item_id: QUEUE_ITEM.id,
          pasted_characters: 500,
        },
      })
    );
    expect(mockMessageInsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        conversation_id: '223e4567-e89b-12d3-a456-426614174000',
        role: 'assistant',
        metadata: {
          crystallize: expect.objectContaining({
            queue_item_id: QUEUE_ITEM.id,
            status: 'seeded',
          }),
        },
      })
    );
  });
});
