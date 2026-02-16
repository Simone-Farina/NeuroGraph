import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crystalQueries, edgeQueries, conversationQueries } from '../queries';

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

  describe('crystalQueries.getNeighborhoodsBatch', () => {
    it('should return empty map if no crystalIds provided', async () => {
      const result = await crystalQueries.getNeighborhoodsBatch(mockClient, []);
      expect(result).toEqual(new Map());
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it('should fetch edges and crystals and reconstruct neighborhoods', async () => {
      const crystalIds = ['1', '2'];
      const mockEdges = [
        { id: 'e1', source_crystal_id: '1', target_crystal_id: '3' }, // 1 -> 3
        { id: 'e2', source_crystal_id: '2', target_crystal_id: '4' }, // 2 -> 4
        { id: 'e3', source_crystal_id: '3', target_crystal_id: '2' }, // 3 -> 2
      ];
      // Involved: 1, 2, 3, 4
      const mockCrystals = [
        { id: '1', title: 'C1' },
        { id: '2', title: 'C2' },
        { id: '3', title: 'C3' },
        { id: '4', title: 'C4' },
      ];

      const mockFrom = vi.fn();

      const mockEdgesSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ data: mockEdges, error: null })
      });

      const mockCrystalsSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: mockCrystals, error: null })
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'crystal_edges') return { select: mockEdgesSelect };
        if (table === 'crystals') return { select: mockCrystalsSelect };
        return {};
      });

      mockClient.from = mockFrom;

      const result = await crystalQueries.getNeighborhoodsBatch(mockClient, crystalIds);

      expect(mockEdgesSelect).toHaveBeenCalled();
      expect(result.size).toBe(2);

      const neighborhood1 = result.get('1');
      const neighborhood2 = result.get('2');

      expect(neighborhood1).toBeDefined();
      expect(neighborhood2).toBeDefined();

      // Neighborhood 1 (root '1')
      expect(neighborhood1?.crystals).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: '1' }),
        expect.objectContaining({ id: '3' })
      ]));
      expect(neighborhood1?.edges).toEqual([mockEdges[0]]);

      // Neighborhood 2 (root '2')
      expect(neighborhood2?.crystals).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: '2' }),
        expect.objectContaining({ id: '3' }),
        expect.objectContaining({ id: '4' })
      ]));
      expect(neighborhood2?.edges).toHaveLength(2);
    });
  });

  describe('edgeQueries', () => {
    describe('create', () => {
      it('should insert and return edge', async () => {
        const mockEdge = { id: '1', source_crystal_id: 's1', target_crystal_id: 't1' };
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockEdge, error: null }),
        });
        const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
        const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

        mockClient.from.mockImplementation(mockFrom);

        const result = await edgeQueries.create(mockClient, { source_crystal_id: 's1', target_crystal_id: 't1', user_id: 'user1' } as any);

        expect(mockClient.from).toHaveBeenCalledWith('crystal_edges');
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ source_crystal_id: 's1' }));
        expect(result).toEqual(mockEdge);
      });

      it('should throw error on failure', async () => {
        const mockSelect = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
        });
        const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
        const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

        mockClient.from.mockImplementation(mockFrom);

        await expect(edgeQueries.create(mockClient, {} as any)).rejects.toEqual({ message: 'Error' });
      });
    });

    describe('getByUserId', () => {
      it('should return edges for user', async () => {
        const mockEdges = [{ id: '1', source_crystal_id: 's1', target_crystal_id: 't1' }];
        const mockEq = vi.fn().mockResolvedValue({ data: mockEdges, error: null });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

        mockClient.from.mockImplementation(mockFrom);

        const result = await edgeQueries.getByUserId(mockClient, 'user1');

        expect(mockClient.from).toHaveBeenCalledWith('crystal_edges');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockEq).toHaveBeenCalledWith('user_id', 'user1');
        expect(result).toEqual(mockEdges);
      });

      it('should throw error on failure', async () => {
        const mockEq = vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

        mockClient.from.mockImplementation(mockFrom);

        await expect(edgeQueries.getByUserId(mockClient, 'user1')).rejects.toEqual({ message: 'Error' });
      });
    });

    describe('getByCrystalId', () => {
      it('should return edges for crystal', async () => {
        const mockEdges = [{ id: '1', source_crystal_id: 'c1', target_crystal_id: 't1' }];
        const mockOr = vi.fn().mockResolvedValue({ data: mockEdges, error: null });
        const mockSelect = vi.fn().mockReturnValue({ or: mockOr });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

        mockClient.from.mockImplementation(mockFrom);

        const result = await edgeQueries.getByCrystalId(mockClient, 'c1');

        expect(mockClient.from).toHaveBeenCalledWith('crystal_edges');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockOr).toHaveBeenCalledWith('source_crystal_id.eq.c1,target_crystal_id.eq.c1');
        expect(result).toEqual(mockEdges);
      });

      it('should throw error on failure', async () => {
        const mockOr = vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } });
        const mockSelect = vi.fn().mockReturnValue({ or: mockOr });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

        mockClient.from.mockImplementation(mockFrom);

        await expect(edgeQueries.getByCrystalId(mockClient, 'c1')).rejects.toEqual({ message: 'Error' });
      });
    });

    describe('delete', () => {
      it('should delete edge', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

        mockClient.from.mockImplementation(mockFrom);

        await edgeQueries.delete(mockClient, '1');

        expect(mockClient.from).toHaveBeenCalledWith('crystal_edges');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith('id', '1');
      });

      it('should throw error on failure', async () => {
        const mockEq = vi.fn().mockResolvedValue({ error: { message: 'Error' } });
        const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

        mockClient.from.mockImplementation(mockFrom);

        await expect(edgeQueries.delete(mockClient, '1')).rejects.toEqual({ message: 'Error' });
      });
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
