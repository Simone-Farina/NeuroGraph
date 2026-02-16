import { POST } from './route';
import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/supabase');
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('streamed response', { status: 200 })),
  }),
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  tool: vi.fn((opts) => opts),
}));
vi.mock('@/lib/ai/providers', () => ({
  getChatModel: vi.fn(),
}));
vi.mock('@/lib/ai/rag', () => ({
  getRelevantContext: vi.fn().mockResolvedValue({ ragContext: '', ragCatalog: '' }),
}));

describe('Chat API POST', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'conv-123' }, error: null }),
      eq: vi.fn().mockReturnThis(),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 429 if rate limit is exceeded', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    // Mock RPC returning false (rate limited)
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null });

    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{
            id: '1',
            role: 'user',
            content: 'Hello',
            parts: [{ type: 'text', text: 'Hello' }]
        }]
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe('Too many requests');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_user_id: 'user-123',
      p_limit: 20,
      p_window_seconds: 60,
    });
  });

  it('should proceed if rate limit is not exceeded', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    // Mock RPC returning true (allowed)
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null });

    // Mock insert to return success
    const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'conv-123' }, error: null })
        })
    });
    // For the message insert
    const messageInsertMock = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
            return { insert: insertMock };
        }
        if (table === 'messages') {
            return { insert: messageInsertMock };
        }
        return {};
    });


    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{
            id: '1',
            role: 'user',
            content: 'Hello',
            parts: [{ type: 'text', text: 'Hello' }]
        }]
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('check_rate_limit', expect.any(Object));
  });
});
