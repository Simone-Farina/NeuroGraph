import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmbedding } from '../embeddings';

// Mock the 'ai' library
vi.mock('ai', () => ({
  embed: vi.fn(),
}));

// Mock the providers module
vi.mock('../providers', () => ({
  getEmbeddingModel: vi.fn(),
}));

// Import the mocked functions to set up return values
import { embed } from 'ai';
import { getEmbeddingModel } from '../providers';

describe('generateEmbedding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate an embedding for valid text', async () => {
    const mockModel = { id: 'mock-model' };
    (getEmbeddingModel as any).mockReturnValue(mockModel);

    const mockEmbedding = [0.1, 0.2, 0.3];
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

  it('should handle empty string input', async () => {
    const mockModel = { id: 'mock-model' };
    (getEmbeddingModel as any).mockReturnValue(mockModel);

    const mockEmbedding = [0.0, 0.0, 0.0];
    (embed as any).mockResolvedValue({ embedding: mockEmbedding });

    const text = '';
    const result = await generateEmbedding(text);

    expect(embed).toHaveBeenCalledWith({
      model: mockModel,
      value: text,
    });
    expect(result).toEqual(mockEmbedding);
  });

  it('should propagate errors from the embed function', async () => {
    const mockModel = { id: 'mock-model' };
    (getEmbeddingModel as any).mockReturnValue(mockModel);

    const mockError = new Error('API Error');
    (embed as any).mockRejectedValue(mockError);

    await expect(generateEmbedding('test')).rejects.toThrow('API Error');
  });
});
