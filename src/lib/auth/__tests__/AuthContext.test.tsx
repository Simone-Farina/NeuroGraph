import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the supabase client factory
vi.mock('../supabase', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../supabase';

describe('AuthContext', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockSupabase = {
    auth: {
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (createClient as any).mockReturnValue(mockSupabase);

    // Default mock implementation
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useAuth', () => {
    it('throws error when used outside of AuthProvider', () => {
      // Suppress console.error for this test as React logs the error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('provides authentication state within AuthProvider', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Ideally verify loading state first, but that's tricky with async updates in useEffect
      // So we wait for the final state
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('handles signOut correctly', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });
  });
});
