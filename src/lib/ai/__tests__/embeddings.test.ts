import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmbedding } from '../embeddings';
import { embed } from 'ai';
import { getEmbeddingModel } from '../providers';

// Mock the 'ai' module
vi.mock('ai', () => ({
  embed: vi.fn(),
}));

// Mock the '../providers' module
vi.mock('../providers', () => ({
  getEmbeddingModel: vi.fn(),
}));

describe('generateEmbedding', () => {
  const mockEmbedding = [0.1, 0.2, 0.3];
  const mockModel = { id: 'mock-model' };

  beforeEach(() => {
    vi.clearAllMocks();
    (getEmbeddingModel as any).mockReturnValue(mockModel);
  });

  it('should generate embedding for the given text', async () => {
    (embed as any).mockResolvedValue({ embedding: mockEmbedding });

    const text = 'test text';
    const result = await generateEmbedding(text);

    expect(getEmbeddingModel).toHaveBeenCalled();
    expect(embed).toHaveBeenCalledWith({
      model: mockModel,
      value: text,
    });
    expect(result).toEqual(mockEmbedding);
  });

  it('should throw error if embedding generation fails', async () => {
    const error = new Error('API Error');
    (embed as any).mockRejectedValue(error);

    const text = 'test text';
    await expect(generateEmbedding(text)).rejects.toThrow('API Error');
  });
});
