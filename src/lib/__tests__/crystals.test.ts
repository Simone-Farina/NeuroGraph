import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCrystalAndProcessEdges, CreateCrystalInput } from '../crystals';

// Mock generateEmbedding
vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

describe('createCrystalAndProcessEdges', () => {
  const userId = 'user-uuid';
  const input: CreateCrystalInput = {
    title: 'New Crystal',
    definition: 'Definition text',
    core_insight: 'Insight text',
    bloom_level: 'Understand',
    source_conversation_id: 'conv-uuid',
    related_crystals: [],
  };

  let mockSupabase: any;
  let mockInsert: any;
  let mockUpdate: any;
  let mockUpsert: any;
  let mockRpc: any;

  beforeEach(() => {
    vi.clearAllMocks();

    const createdCrystal = { id: 'new-id', ...input };

    mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: createdCrystal, error: null })
      })
    });

    mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: createdCrystal, error: null })
          })
        })
      })
    });

    mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null })
    });

    mockRpc = vi.fn().mockResolvedValue({ data: [], error: null });

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'crystals') {
          return {
            insert: mockInsert,
            update: mockUpdate,
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn().mockResolvedValue({ data: [], error: null })
              }))
            }))
          };
        }
        if (table === 'crystal_edges') {
          return {
            upsert: mockUpsert,
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn().mockResolvedValue({ data: [], error: null })
                }))
              }))
            }))
          };
        }
        return {};
      }),
      rpc: mockRpc,
    };
  });

  it('creates crystal and generates embedding successfully', async () => {
    const result = await createCrystalAndProcessEdges(mockSupabase, userId, input);

    expect(mockSupabase.from).toHaveBeenCalledWith('crystals');
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      title: input.title,
      user_id: userId,
      state: 'New',
      embedding: null
    }));
    expect(mockUpdate).toHaveBeenCalled();
    expect(result.crystal).toEqual(expect.objectContaining({ id: 'new-id' }));
  });

  it('throws error if crystal creation fails', async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } })
      })
    });

    await expect(createCrystalAndProcessEdges(mockSupabase, userId, input))
      .rejects.toThrow('DB Error');
  });

  it('processes high confidence similarities as auto-edges', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'similar-1', title: 'Similar 1', similarity: 0.9 },
      ],
      error: null,
    });

    const result = await createCrystalAndProcessEdges(mockSupabase, userId, input);

    expect(mockSupabase.from).toHaveBeenCalledWith('crystal_edges');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          target_crystal_id: 'similar-1',
          ai_suggested: true,
          type: 'RELATED'
        })
      ]),
      expect.any(Object)
    );
    expect(result.edge_suggestions).toHaveLength(0);
  });

  it('processes medium confidence similarities as suggestions', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'similar-2', title: 'Similar 2', similarity: 0.75 },
      ],
      error: null,
    });

    const result = await createCrystalAndProcessEdges(mockSupabase, userId, input);

    expect(mockUpsert).not.toHaveBeenCalled();

    expect(result.edge_suggestions).toHaveLength(1);
    expect(result.edge_suggestions[0]).toMatchObject({
      target_crystal_id: 'similar-2',
      confidence: 'medium',
      source: 'vector'
    });
  });

  it('filters out existing edges from suggestions', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'similar-2', title: 'Similar 2', similarity: 0.75 },
      ],
      error: null,
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'crystal_edges') {
        return {
            upsert: mockUpsert,
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn().mockResolvedValue({
                    data: [{ source_crystal_id: 'new-id', target_crystal_id: 'similar-2', type: 'RELATED' }],
                    error: null
                  })
                }))
              }))
            }))
        };
      }
      return {
        insert: mockInsert,
        update: mockUpdate,
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({ data: [], error: null })
            }))
          }))
      };
    });

    const result = await createCrystalAndProcessEdges(mockSupabase, userId, input);

    expect(result.edge_suggestions).toHaveLength(0);
  });
});
