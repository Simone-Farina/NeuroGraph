import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn(),
}));

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';

describe('POST /api/crystals', () => {
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockRpc = vi.fn();
  const mockSingle = vi.fn();
  const mockUpsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock generateEmbedding
    (generateEmbedding as any).mockResolvedValue([0.1, 0.2, 0.3]);

    // Mock Supabase chain
    // The chain is tricky because the same methods are used in different contexts.
    // We'll create a flexible mock object that returns itself for chaining unless configured otherwise.

    const mockQueryBuilder = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
      upsert: mockUpsert,
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    };

    // Make chainable
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockInsert.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockUpsert.mockReturnValue(mockQueryBuilder);

    // Specific return values for terminal operations
    mockSingle.mockResolvedValue({
      data: {
        id: 'test-crystal-id',
        title: 'Test Title',
        definition: 'Test Definition',
        core_insight: 'Test Core Insight',
        embedding: null, // Initial insert result has null embedding
      },
      error: null,
    });

    // For the count query
    mockQueryBuilder.not.mockReturnValue({
        count: 0
    } as any);

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

  it('should include source_message_ids in the insert payload', async () => {
    const payload = {
      title: 'Test Crystal',
      definition: 'A test definition that is long enough.',
      core_insight: 'A core insight that is also long enough to pass validation.',
      bloom_level: 'Remember',
      source_conversation_id: '123e4567-e89b-12d3-a456-426614174000',
      source_message_ids: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
      related_crystals: [],
    };

    const req = new NextRequest('http://localhost/api/crystals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);

    // We expect the request to succeed (201 Created)
    expect(res.status).toBe(201);

    // Verify insert call
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertCall = mockInsert.mock.calls[0][0];

    // Check that source_message_ids is present in the insert call
    // This is expected to FAIL before the fix
    expect(insertCall).toHaveProperty('source_message_ids');
    expect(insertCall.source_message_ids).toEqual(payload.source_message_ids);
  });
});
