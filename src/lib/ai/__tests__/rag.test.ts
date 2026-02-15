import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRelevantContext } from '../rag';

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

vi.mock('@/lib/db/queries', () => ({
  crystalQueries: {
    findSimilar: vi.fn(),
    getNeighborhood: vi.fn(),
  },
}));

import { crystalQueries } from '@/lib/db/queries';

function createMockClient() {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }),
  } as any;
}

describe('RAG - getRelevantContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty context when no similar crystals found', async () => {
    (crystalQueries.findSimilar as any).mockResolvedValue([]);
    const client = createMockClient();

    const result = await getRelevantContext('test query', 'user-1', client);

    expect(result.ragContext).toBe('');
    expect(result.ragCatalog).toBeDefined();
  });

  it('should return context lines for similar crystals with neighbors', async () => {
    const similarCrystals = [
      { id: 'c1', title: 'Neural Networks', definition: 'A computing system inspired by biological neural networks', similarity: 0.85 },
      { id: 'c2', title: 'Backpropagation', definition: 'Algorithm for training neural networks', similarity: 0.72 },
    ];
    (crystalQueries.findSimilar as any).mockResolvedValue(similarCrystals);
    (crystalQueries.getNeighborhood as any).mockImplementation((_client: any, crystalId: string) => ({
      crystals: [
        ...similarCrystals.filter(c => c.id === crystalId),
        { id: 'c3', title: 'Gradient Descent' },
      ],
      edges: [],
    }));

    const client = createMockClient();
    const result = await getRelevantContext('how do neural nets learn?', 'user-1', client);

    expect(result.ragContext).toContain('Neural Networks');
    expect(result.ragContext).toContain('Backpropagation');
    expect(result.ragContext).toContain('Gradient Descent');
    expect(result.ragContext).toContain('Relevant Knowledge Context');
  });

  it('should build ragCatalog from all crystals in neighborhoods', async () => {
    const similarCrystals = [
      { id: 'c1', title: 'Crystal A', definition: 'Def A', similarity: 0.9 },
    ];
    (crystalQueries.findSimilar as any).mockResolvedValue(similarCrystals);
    (crystalQueries.getNeighborhood as any).mockResolvedValue({
      crystals: [
        { id: 'c1', title: 'Crystal A' },
        { id: 'c2', title: 'Crystal B' },
      ],
      edges: [],
    });

    const client = createMockClient();
    const result = await getRelevantContext('query', 'user-1', client);

    expect(result.ragCatalog).toContain('c1: Crystal A');
    expect(result.ragCatalog).toContain('c2: Crystal B');
  });

  it('should gracefully handle errors and return empty context', async () => {
    (crystalQueries.findSimilar as any).mockRejectedValue(new Error('DB connection lost'));

    const client = createMockClient();
    const result = await getRelevantContext('query', 'user-1', client);

    expect(result.ragContext).toBe('');
    expect(result.ragCatalog).toBe('- none yet');
  });

  it('should pass authenticated client to findSimilar', async () => {
    (crystalQueries.findSimilar as any).mockResolvedValue([]);
    const client = createMockClient();

    await getRelevantContext('query', 'user-1', client);

    expect(crystalQueries.findSimilar).toHaveBeenCalledWith(
      client,
      expect.any(Array),
      'user-1',
      5,
      0.3
    );
  });
});
