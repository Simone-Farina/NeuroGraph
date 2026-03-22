import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueQueries } from '../queueQueries';

function createMockClient() {
  return { from: vi.fn(), rpc: vi.fn() } as any;
}

describe('queueQueries', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('create', () => {
    it('inserts into knowledge_queue and returns the created item', async () => {
      const mockItem = { id: '1', title: 'Test', state: 'inbox' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      const result = await queueQueries.create(mockClient, { user_id: 'u1', title: 'Test' } as any);

      expect(mockClient.from).toHaveBeenCalledWith('knowledge_queue');
      expect(result).toEqual(mockItem);
    });

    it('throws on insert error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      await expect(queueQueries.create(mockClient, {} as any)).rejects.toEqual({ message: 'fail' });
    });
  });

  describe('getActiveByUserId', () => {
    it('queries knowledge_queue excluding mastered items', async () => {
      const mockItems = [{ id: '1', state: 'inbox' }];
      const mockOrder = vi.fn().mockResolvedValue({ data: mockItems, error: null });
      const mockNeq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockEq = vi.fn().mockReturnValue({ neq: mockNeq });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await queueQueries.getActiveByUserId(mockClient, 'u1');

      expect(mockClient.from).toHaveBeenCalledWith('knowledge_queue');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
      expect(mockNeq).toHaveBeenCalledWith('state', 'mastered');
      expect(result).toEqual(mockItems);
    });
  });

  describe('getById', () => {
    it('returns item when found', async () => {
      const mockItem = { id: '1', title: 'Test' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await queueQueries.getById(mockClient, '1');
      expect(result).toEqual(mockItem);
    });

    it('returns null when not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await queueQueries.getById(mockClient, '1');
      expect(result).toBeNull();
    });
  });

  describe('updateState', () => {
    it('updates state for valid transition (inbox -> passive_debt)', async () => {
      const mockItem = { id: '1', state: 'passive_debt' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      const result = await queueQueries.updateState(mockClient, '1', 'inbox', 'passive_debt');
      expect(result.state).toBe('passive_debt');
    });

    it('throws for invalid transition (mastered -> inbox)', async () => {
      await expect(
        queueQueries.updateState(mockClient, '1', 'mastered', 'inbox')
      ).rejects.toThrow('Invalid state transition: mastered -> inbox');
    });

    it('throws for backward transition (passive_debt -> inbox)', async () => {
      await expect(
        queueQueries.updateState(mockClient, '1', 'passive_debt', 'inbox')
      ).rejects.toThrow('Invalid state transition: passive_debt -> inbox');
    });
  });

  describe('deleteItem', () => {
    it('calls delete on knowledge_queue with item id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ delete: mockDelete });

      await queueQueries.deleteItem(mockClient, '1');
      expect(mockClient.from).toHaveBeenCalledWith('knowledge_queue');
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('findByUrl', () => {
    it('returns item when URL exists for user', async () => {
      const mockItem = { id: '1', title: 'Existing', url: 'https://example.com' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqUrl = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqUrl });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await queueQueries.findByUrl(mockClient, 'u1', 'https://example.com');

      expect(mockClient.from).toHaveBeenCalledWith('knowledge_queue');
      expect(mockEqUser).toHaveBeenCalledWith('user_id', 'u1');
      expect(mockEqUrl).toHaveBeenCalledWith('url', 'https://example.com');
      expect(result).toEqual(mockItem);
    });

    it('returns null when URL not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqUrl = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqUrl });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await queueQueries.findByUrl(mockClient, 'u1', 'https://nonexistent.com');
      expect(result).toBeNull();
    });

    it('throws on non-PGRST116 errors', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'fail' } });
      const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqUrl = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqUrl });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
      mockClient.from.mockReturnValue({ select: mockSelect });

      await expect(queueQueries.findByUrl(mockClient, 'u1', 'https://example.com'))
        .rejects.toEqual({ code: 'OTHER', message: 'fail' });
    });
  });
});
