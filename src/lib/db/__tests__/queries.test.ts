import { describe, it, expect, vi, beforeEach } from 'vitest';
import { neuronQueries } from '../queries';

function createMockClient() {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  } as any;
}

describe('DB Queries', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('neuronQueries.create', () => {
    it('should insert and return neuron', async () => {
      const mockNeuron = { id: '1', title: 'Test' };
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockNeuron, error: null }),
      });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      mockClient.from.mockImplementation(mockFrom);

      const result = await neuronQueries.create(mockClient, { title: 'Test', user_id: 'user1', content: 'content' } as any);
      
      expect(mockClient.from).toHaveBeenCalledWith('neurons');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test' }));
      expect(result).toEqual(mockNeuron);
    });

    it('should throw error on failure', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      mockClient.from.mockImplementation(mockFrom);

      await expect(neuronQueries.create(mockClient, {} as any)).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('neuronQueries.getById', () => {
    it('should return neuron if found', async () => {
      const mockNeuron = { id: '1', title: 'Test' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockNeuron, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      const result = await neuronQueries.getById(mockClient, '1');
      
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockNeuron);
    });

    it('should return null if not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      const result = await neuronQueries.getById(mockClient, '1');
      
      expect(result).toBeNull();
    });
  });
});
