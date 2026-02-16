import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crystalQueries, conversationQueries } from '../queries';

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

  describe('crystalQueries.create', () => {
    it('should insert and return crystal', async () => {
      const mockCrystal = { id: '1', title: 'Test' };
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockCrystal, error: null }),
      });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      mockClient.from.mockImplementation(mockFrom);

      const result = await crystalQueries.create(mockClient, { title: 'Test', user_id: 'user1', content: 'content' } as any);
      
      expect(mockClient.from).toHaveBeenCalledWith('crystals');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test' }));
      expect(result).toEqual(mockCrystal);
    });

    it('should throw error on failure', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
      
      mockClient.from.mockImplementation(mockFrom);

      await expect(crystalQueries.create(mockClient, {} as any)).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('crystalQueries.getById', () => {
    it('should return crystal if found', async () => {
      const mockCrystal = { id: '1', title: 'Test' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCrystal, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      const result = await crystalQueries.getById(mockClient, '1');
      
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockCrystal);
    });

    it('should return null if not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      const result = await crystalQueries.getById(mockClient, '1');
      
      expect(result).toBeNull();
    });
  });

  describe('conversationQueries.create', () => {
    it('should insert and return conversation', async () => {
      const mockConversation = { id: '1', title: 'Test Chat', user_id: 'user1' };
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockConversation, error: null }),
      });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

      mockClient.from.mockImplementation(mockFrom);

      const result = await conversationQueries.create(mockClient, 'user1', 'Test Chat');

      expect(mockClient.from).toHaveBeenCalledWith('conversations');
      expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user1', title: 'Test Chat' });
      expect(result).toEqual(mockConversation);
    });

    it('should throw error on failure', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
      });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

      mockClient.from.mockImplementation(mockFrom);

      await expect(conversationQueries.create(mockClient, 'user1', 'Test Chat')).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('conversationQueries.getById', () => {
    it('should return conversation if found', async () => {
      const mockConversation = { id: '1', title: 'Test Chat' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockConversation, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      const result = await conversationQueries.getById(mockClient, '1');

      expect(mockClient.from).toHaveBeenCalledWith('conversations');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockConversation);
    });

    it('should return null if not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      const result = await conversationQueries.getById(mockClient, '1');

      expect(result).toBeNull();
    });

    it('should throw error on other errors', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      await expect(conversationQueries.getById(mockClient, '1')).rejects.toEqual({ message: 'DB Error' });
    });
  });

  describe('conversationQueries.getByUserId', () => {
    it('should return conversations for user', async () => {
      const mockConversations = [{ id: '1', title: 'Chat 1' }, { id: '2', title: 'Chat 2' }];
      const mockOrder = vi.fn().mockResolvedValue({ data: mockConversations, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      const result = await conversationQueries.getByUserId(mockClient, 'user1');

      expect(mockClient.from).toHaveBeenCalledWith('conversations');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user1');
      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toEqual(mockConversations);
    });

    it('should throw error on failure', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      mockClient.from.mockImplementation(mockFrom);

      await expect(conversationQueries.getByUserId(mockClient, 'user1')).rejects.toEqual({ message: 'Error' });
    });
  });

  describe('conversationQueries.delete', () => {
    it('should delete conversation', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      mockClient.from.mockImplementation(mockFrom);

      await conversationQueries.delete(mockClient, '1');

      expect(mockClient.from).toHaveBeenCalledWith('conversations');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error on failure', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Delete Error' } });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      mockClient.from.mockImplementation(mockFrom);

      await expect(conversationQueries.delete(mockClient, '1')).rejects.toEqual({ message: 'Delete Error' });
    });
  });
});
