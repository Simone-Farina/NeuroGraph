import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRelevantContext } from '../rag';

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

vi.mock('@/lib/db/queries', () => ({
  neuronQueries: {
    findSimilar: vi.fn(),
    getNeighborhood: vi.fn(),
  },
}));

import { neuronQueries } from '@/lib/db/queries';

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

  it('should return empty context when no similar neurons found', async () => {
    (neuronQueries.findSimilar as any).mockResolvedValue([]);
    const client = createMockClient();

    const result = await getRelevantContext('test query', 'user-1', client);

    expect(result.ragContext).toBe('');
    expect(result.ragCatalog).toBeDefined();
  });

  it('should return context lines for similar neurons with neighbors', async () => {
    const similarNeurons = [
      { id: 'n1', title: 'Neural Networks', definition: 'A computing system inspired by biological neural networks', similarity: 0.85 },
      { id: 'n2', title: 'Backpropagation', definition: 'Algorithm for training neural networks', similarity: 0.72 },
    ];
    (neuronQueries.findSimilar as any).mockResolvedValue(similarNeurons);
    (neuronQueries.getNeighborhood as any).mockImplementation((_client: any, neuronId: string) => ({
      neurons: [
        ...similarNeurons.filter((n) => n.id === neuronId),
        { id: 'n3', title: 'Gradient Descent' },
      ],
      synapses: [],
    }));

    const client = createMockClient();
    const result = await getRelevantContext('how do neural nets learn?', 'user-1', client);

    expect(result.ragContext).toContain('Neural Networks');
    expect(result.ragContext).toContain('Backpropagation');
    expect(result.ragContext).toContain('Gradient Descent');
    expect(result.ragContext).toContain('Relevant Knowledge Context');
  });

  it('should build ragCatalog from all neurons in neighborhoods', async () => {
    const similarNeurons = [
      { id: 'n1', title: 'Neuron A', definition: 'Def A', similarity: 0.9 },
    ];
    (neuronQueries.findSimilar as any).mockResolvedValue(similarNeurons);
    (neuronQueries.getNeighborhood as any).mockResolvedValue({
      neurons: [
        { id: 'n1', title: 'Neuron A' },
        { id: 'n2', title: 'Neuron B' },
      ],
      synapses: [],
    });

    const client = createMockClient();
    const result = await getRelevantContext('query', 'user-1', client);

    expect(result.ragCatalog).toContain('n1: Neuron A');
    expect(result.ragCatalog).toContain('n2: Neuron B');
  });

  it('should gracefully handle errors and return empty context', async () => {
    (neuronQueries.findSimilar as any).mockRejectedValue(new Error('DB connection lost'));

    const client = createMockClient();
    const result = await getRelevantContext('query', 'user-1', client);

    expect(result.ragContext).toBe('');
    expect(result.ragCatalog).toBe('- none yet');
  });

  it('should pass authenticated client to findSimilar', async () => {
    (neuronQueries.findSimilar as any).mockResolvedValue([]);
    const client = createMockClient();

    await getRelevantContext('query', 'user-1', client);

    expect(neuronQueries.findSimilar).toHaveBeenCalledWith(
      client,
      expect.any(Array),
      'user-1',
      5,
      0.3
    );
  });
});
