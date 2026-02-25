import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';

vi.mock('@/lib/auth/supabase');
vi.mock('@/lib/ai/embeddings');

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const validPayload = {
  title: 'Test Neuron',
  definition: 'A test neuron definition with sufficient length.',
  core_insight: 'A core insight that is also long enough to be valid.',
  bloom_level: 'Remember',
  source_conversation_id: '123e4567-e89b-12d3-a456-426614174000',
  source_message_ids: ['msg-1', 'msg-2'],
  related_neurons: [],
};

describe('POST /api/neurons', () => {
  let mockSupabase: any;
  let mockInsert: any;
  let mockUpdate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'neuron-1', ...validPayload, user_id: mockUser.id, embedding: [0.1, 0.2, 0.3] },
          error: null,
        }),
      }),
    });

    mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'neuron-1', ...validPayload, user_id: mockUser.id, embedding: [0.1, 0.2, 0.3] },
              error: null,
            }),
          }),
        }),
      }),
    });

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn((table) => {
        if (table === 'neurons') {
          return {
            insert: mockInsert,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockResolvedValue({ count: 1 }),
              }),
            }),
            update: mockUpdate,
          };
        }

        if (table === 'synapses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
    (generateEmbedding as any).mockResolvedValue([0.1, 0.2, 0.3]);
  });

  it('should include source_message_ids in the insert payload', async () => {
    const req = new NextRequest('http://localhost/api/neurons', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    expect(mockSupabase.from).toHaveBeenCalledWith('neurons');
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertPayload = mockInsert.mock.calls[0][0];
    expect(insertPayload).toHaveProperty('title', validPayload.title);
    expect(insertPayload).toHaveProperty('source_message_ids', validPayload.source_message_ids);
  });

  it('should return a neuron payload and perform embedding update', async () => {
    const req = new NextRequest('http://localhost:3000/api/neurons', {
      method: 'POST',
      body: JSON.stringify(validPayload),
    });

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.neuron).toBeDefined();
    expect(generateEmbedding).toHaveBeenCalledWith(
      `${validPayload.title} ${validPayload.definition} ${validPayload.core_insight}`
    );
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalled();
  });
});
