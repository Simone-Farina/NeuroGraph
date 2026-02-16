import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthenticatedUser } from '../server';
import { createServerSupabaseClient } from '@/lib/auth/supabase';

// Mock dependencies
vi.mock('@/lib/auth/supabase');
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({ body, init, status: init?.status })),
  },
}));

describe('getAuthenticatedUser', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
  });

  it('should return user and supabase client when authenticated', async () => {
    const mockUser = { id: 'user-123' };
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const result = await getAuthenticatedUser();

    expect(result.user).toEqual(mockUser);
    expect(result.supabase).toBe(mockSupabase);
    expect(result.errorResponse).toBeNull();
  });

  it('should return error response when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getAuthenticatedUser();

    expect(result.user).toBeNull();
    expect(result.supabase).toBe(mockSupabase);
    expect(result.errorResponse).toEqual(expect.objectContaining({
      body: { error: 'Unauthorized' },
      init: { status: 401 },
    }));
  });
});
