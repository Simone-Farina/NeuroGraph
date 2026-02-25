import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn(),
}));

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';

describe('POST /api/neurons', () => {
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockRpc = vi.fn();
  const mockSingle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (generateEmbedding as any).mockResolvedValue([0.1, 0.2, 0.3]);

    const mockQueryBuilder = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    };

    mockSelect.mockReturnValue(mockQueryBuilder);
    mockInsert.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);

    mockSingle.mockResolvedValue({
      data: {
        id: 'test-neuron-id',
        title: 'Test Title',
        definition: 'Test Definition',
        core_insight: 'Test Core Insight',
        embedding: null,
      },
      error: null,
    });

    mockQueryBuilder.not.mockReturnValue({ count: 0 } as any);

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: vi.fn(() => mockQueryBuilder),
      rpc: mockRpc.mockResolvedValue({ data: [], error: null }),
    };

    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
  });

  it('should include source_message_ids in insert payload', async () => {
    const payload = {
      title: 'Test Neuron',
      definition: 'A test definition that is long enough.',
      core_insight: 'A core insight that is long enough to pass validation.',
      bloom_level: 'Remember',
      source_conversation_id: '123e4567-e89b-12d3-a456-426614174000',
      source_message_ids: [
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002',
      ],
      related_neurons: [],
    };

    const req = new NextRequest('http://localhost/api/neurons', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall).toHaveProperty('source_message_ids');
    expect(insertCall.source_message_ids).toEqual(payload.source_message_ids);
  });
});
