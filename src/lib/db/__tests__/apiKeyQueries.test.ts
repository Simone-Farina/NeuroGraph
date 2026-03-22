import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiKeyQueries } from '../apiKeyQueries';

function createMockClient() {
  return { from: vi.fn(), rpc: vi.fn() } as any;
}

describe('apiKeyQueries', () => {
  let mockClient: ReturnType<typeof createMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockClient();
  });

  describe('create', () => {
    it('inserts into user_api_keys and returns the created key', async () => {
      const mockKey = { id: '1', key_prefix: 'ng_ABCDEFGH' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockKey, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      mockClient.from.mockReturnValue({ insert: mockInsert });

      const result = await apiKeyQueries.create(mockClient, {
        user_id: 'u1', key_prefix: 'ng_ABCDEFGH', key_hash: 'abc123'
      } as any);

      expect(mockClient.from).toHaveBeenCalledWith('user_api_keys');
      expect(result).toEqual(mockKey);
    });
  });

  describe('findByHash', () => {
    it('returns key when found and not revoked', async () => {
      const mockKey = { id: '1', key_hash: 'abc', revoked_at: null };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockKey, error: null });
      const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await apiKeyQueries.findByHash(mockClient, 'abc');

      expect(mockEq).toHaveBeenCalledWith('key_hash', 'abc');
      expect(mockIs).toHaveBeenCalledWith('revoked_at', null);
      expect(result).toEqual(mockKey);
    });

    it('returns null when not found (PGRST116)', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await apiKeyQueries.findByHash(mockClient, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateLastUsed', () => {
    it('updates last_used_at on the key', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await apiKeyQueries.updateLastUsed(mockClient, '1');

      expect(mockClient.from).toHaveBeenCalledWith('user_api_keys');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ last_used_at: expect.any(String) }));
    });
  });

  describe('revoke', () => {
    it('sets revoked_at timestamp on the key', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ update: mockUpdate });

      await apiKeyQueries.revoke(mockClient, '1');

      expect(mockClient.from).toHaveBeenCalledWith('user_api_keys');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ revoked_at: expect.any(String) }));
    });
  });

  describe('getActiveByUserId', () => {
    it('returns active key (revoked_at is null) for user', async () => {
      const mockKey = { id: '1', user_id: 'u1', revoked_at: null };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockKey, error: null });
      const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await apiKeyQueries.getActiveByUserId(mockClient, 'u1');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'u1');
      expect(mockIs).toHaveBeenCalledWith('revoked_at', null);
      expect(result).toEqual(mockKey);
    });

    it('returns null when user has no active key', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
      const mockIs = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ is: mockIs });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockClient.from.mockReturnValue({ select: mockSelect });

      const result = await apiKeyQueries.getActiveByUserId(mockClient, 'u1');
      expect(result).toBeNull();
    });
  });
});
