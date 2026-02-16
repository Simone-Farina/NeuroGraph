import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth, AuthProvider } from '../AuthContext';
import * as supabase from '../supabase';

// Mock the supabase module
vi.mock('../supabase', () => ({
  createClient: vi.fn(),
}));

describe('useAuth', () => {
  const mockSubscription = { unsubscribe: vi.fn() };
  const mockSupabase = {
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: mockSubscription } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.createClient as any).mockReturnValue(mockSupabase);
  });

  it('throws an error when used outside of an AuthProvider', () => {
    // Suppress console.error for this test as React logs the error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    consoleSpy.mockRestore();
  });

  it('returns the auth context when used within an AuthProvider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
        expect(result.current.loading).toBe(false);
    });

    expect(result.current).toEqual(expect.objectContaining({
      user: null,
      loading: false,
      signOut: expect.any(Function),
    }));
  });
});
