import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';

// Mock dependencies
vi.mock('@/lib/auth/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn(),
}));

describe('POST /api/crystals', () => {
  let mockSupabase: any;
  let mockInsert: any;
  let mockUpdate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    const createMockBuilder = (data: any) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'crystal-123',
          ...data,
          embedding: null,
        },
        error: null,
      }),
      then: (resolve: any) => resolve({ data: [], error: null, count: 0 }),
    });

    const defaultBuilder = createMockBuilder({});

    mockInsert = vi.fn().mockImplementation((data) => {
       return createMockBuilder(data);
    });

    mockUpdate = vi.fn().mockReturnValue(defaultBuilder);

    const mockFrom = vi.fn().mockReturnValue({
      ...defaultBuilder,
      insert: mockInsert,
      update: mockUpdate,
    });

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      },
      from: mockFrom,
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase);
    vi.mocked(generateEmbedding).mockResolvedValue([0.1, 0.2, 0.3]);
  });

  it('should optimize DB calls by generating embedding before insert', async () => {
    const payload = {
      title: 'Test Crystal',
      definition: 'A test definition that is long enough.',
      core_insight: 'A test insight that is also long enough.',
      bloom_level: 'Remember',
      source_conversation_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const req = new NextRequest('http://localhost:3000/api/crystals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const response = await POST(req);
    const json = await response.json();

    if (response.status !== 201) {
      console.error('API Error:', json);
    }

    expect(response.status).toBe(201);
    expect(json.crystal).toBeDefined();

    // Check generateEmbedding call
    expect(generateEmbedding).toHaveBeenCalledWith(
      `${payload.title} ${payload.definition} ${payload.core_insight}`
    );

    // Expectation: 1 insert
    expect(mockInsert).toHaveBeenCalledTimes(1);

    // Verify embedding is included in insert
    const insertCallArgs = mockInsert.mock.calls[0][0];
    expect(insertCallArgs.embedding).toEqual([0.1, 0.2, 0.3]);

    // Check update call. It should NOT be called now.
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
