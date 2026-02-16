import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConversations } from '../useConversations';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock window.confirm and window.alert
const confirmMock = vi.fn();
const alertMock = vi.fn();
global.confirm = confirmMock;
global.alert = alertMock;

describe('useConversations', () => {
  const mockResetState = {
    setMessages: vi.fn(),
    setConversationId: vi.fn(),
    setInput: vi.fn(),
    clearEdgeSuggestions: vi.fn(),
    clearConnectionNotice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadConversations', () => {
    it('should load conversations on mount', async () => {
      const mockConversations = [
        { id: '1', title: 'Test Conversation 1', updated_at: '2023-01-01' },
        { id: '2', title: 'Test Conversation 2', updated_at: '2023-01-02' },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      });

      const { result } = renderHook(() => useConversations(mockResetState));

      await waitFor(() => {
        expect(result.current.conversations).toEqual(mockConversations);
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/chat', { cache: 'no-store' });
    });

    it('should handle fetch error on mount', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useConversations(mockResetState));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load conversations', expect.any(Error));
      });

      expect(result.current.conversations).toEqual([]);
    });
  });

  describe('loadConversation', () => {
    it('should load a specific conversation successfully', async () => {
      // Mock initial loadConversations call which happens on mount
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      });

      const { result } = renderHook(() => useConversations(mockResetState));

      // Wait for mount effect
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      const mockMessages = [
        { id: 'msg1', role: 'user', content: 'Hello' },
        { id: 'msg2', role: 'assistant', content: 'Hi there' },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      });

      await act(async () => {
        await result.current.loadConversation('conv1');
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/chat?mode=messages&conversationId=conv1', {
        cache: 'no-store',
      });

      const expectedMessages = mockMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text', text: msg.content }],
        content: msg.content,
      }));

      expect(mockResetState.setMessages).toHaveBeenCalledWith(expectedMessages);
      expect(result.current.conversationId).toBe('conv1');
      expect(mockResetState.clearEdgeSuggestions).toHaveBeenCalled();
      expect(mockResetState.clearConnectionNotice).toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      // Mock initial loadConversations call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      });

      const { result } = renderHook(() => useConversations(mockResetState));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await result.current.loadConversation('conv1');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load conversation', expect.any(Error));
    });
  });

  describe('handleNewConversation', () => {
    it('should reset state for new conversation', async () => {
       // Mock initial loadConversations call
       fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      });

      const { result } = renderHook(() => useConversations(mockResetState));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      act(() => {
        result.current.handleNewConversation();
      });

      expect(mockResetState.setMessages).toHaveBeenCalledWith([]);
      expect(result.current.conversationId).toBeNull();
      expect(mockResetState.setInput).toHaveBeenCalledWith('');
      expect(mockResetState.clearConnectionNotice).toHaveBeenCalled();
      expect(mockResetState.clearEdgeSuggestions).toHaveBeenCalled();
    });
  });

  describe('handleDeleteConversation', () => {
    it('should delete conversation successfully', async () => {
      const mockConversations = [
        { id: '1', title: 'Test Conversation 1', updated_at: '2023-01-01' },
        { id: '2', title: 'Test Conversation 2', updated_at: '2023-01-02' },
      ];

      // Setup initial state (useEffect load)
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      });

      const { result } = renderHook(() => useConversations(mockResetState));

      await waitFor(() => {
          expect(result.current.conversations).toEqual(mockConversations);
      });

      // Now delete conversation '1'
      confirmMock.mockReturnValue(true);
      fetchMock.mockResolvedValueOnce({
        ok: true,
      });

      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      await act(async () => {
        await result.current.handleDeleteConversation(mockEvent, '1');
      });

      expect(confirmMock).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledWith('/api/conversations/1', {
        method: 'DELETE',
      });

      expect(result.current.conversations).toHaveLength(1);
      expect(result.current.conversations[0].id).toBe('2');
    });

    it('should call handleNewConversation if current conversation is deleted', async () => {
      const mockConversations = [
        { id: '1', title: 'Test Conversation 1', updated_at: '2023-01-01' },
      ];

      fetchMock.mockResolvedValueOnce({
         ok: true,
         json: async () => ({ conversations: mockConversations }),
      });

      const { result } = renderHook(() => useConversations(mockResetState));

      await waitFor(() => {
          expect(result.current.conversations).toEqual(mockConversations);
      });

      // Manually set conversationId
      act(() => {
          result.current.setConversationId('1');
      });

      confirmMock.mockReturnValue(true);
      fetchMock.mockResolvedValueOnce({
        ok: true,
      });

      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      await act(async () => {
        await result.current.handleDeleteConversation(mockEvent, '1');
      });

      expect(mockResetState.setInput).toHaveBeenCalledWith('');
      expect(result.current.conversationId).toBeNull();
    });

    it('should not delete if user cancels', async () => {
      // Mock initial load
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      });
      const { result } = renderHook(() => useConversations(mockResetState));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      confirmMock.mockReturnValue(false);
      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      await act(async () => {
        await result.current.handleDeleteConversation(mockEvent, '1');
      });

      // Should not call delete API
      // fetchMock was called once for loadConversations, check it wasn't called again with DELETE
      expect(fetchMock).not.toHaveBeenCalledWith('/api/conversations/1', expect.anything());
    });

    it('should handle delete failure', async () => {
      // Mock initial load
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      });
      const { result } = renderHook(() => useConversations(mockResetState));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      confirmMock.mockReturnValue(true);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      });
      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      await act(async () => {
        await result.current.handleDeleteConversation(mockEvent, '1');
      });

      expect(alertMock).toHaveBeenCalledWith('Failed to delete conversation: Delete failed');
    });

    it('should handle network error during delete', async () => {
      // Mock initial load
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: [] }),
      });
      const { result } = renderHook(() => useConversations(mockResetState));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      confirmMock.mockReturnValue(true);
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      await act(async () => {
        await result.current.handleDeleteConversation(mockEvent, '1');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to delete conversation', expect.any(Error));
      expect(alertMock).toHaveBeenCalledWith('An error occurred while deleting the conversation.');
    });
  });
});
