import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmbedding } from '../embeddings';
import { getEmbeddingModel } from '../providers';
import { embed } from 'ai';

vi.mock('ai', () => ({
  embed: vi.fn(),
}));

vi.mock('../providers', () => ({
  getEmbeddingModel: vi.fn(),
}));

describe('generateEmbedding', () => {
  const mockEmbedding = [0.1, 0.2, 0.3];
  const mockModel = { id: 'mock-model' };

  beforeEach(() => {
    vi.clearAllMocks();
    (getEmbeddingModel as any).mockReturnValue(mockModel);
    (embed as any).mockResolvedValue({ embedding: mockEmbedding });
  });

  it('should generate embedding for valid text', async () => {
    const text = 'test text';
    const result = await generateEmbedding(text);

    expect(getEmbeddingModel).toHaveBeenCalled();
    expect(embed).toHaveBeenCalledWith({
      model: mockModel,
      value: text,
    });
    expect(result).toEqual(mockEmbedding);
  });

  it('should handle errors from embed function', async () => {
    const error = new Error('Embedding failed');
    (embed as any).mockRejectedValue(error);

    await expect(generateEmbedding('test')).rejects.toThrow('Embedding failed');
  });
});
