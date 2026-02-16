import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock('@/lib/ai/providers', () => ({
  getChatModel: vi.fn(),
}));
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('stream')),
  }),
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  UIMessage: {},
  tool: vi.fn().mockReturnValue({}),
}));
vi.mock('@/lib/ai/rag', () => ({
  getRelevantContext: vi.fn().mockResolvedValue({ ragContext: '', ragCatalog: '' }),
}));

describe('Chat API Rate Limiting', () => {
  let mockSupabase: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryBuilder = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      then: (resolve: any) => resolve({ data: { id: 'conv-id' }, error: null }),
    };

    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.insert.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.eq.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.order.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
    // single should return a promise that resolves to data
    mockQueryBuilder.single.mockResolvedValue({ data: { id: 'conv-id' }, error: null });

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'test-user-id' },
          },
        }),
      },
      rpc: vi.fn(),
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    };

    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // Mock rate limit check to return false (not allowed)
    mockSupabase.rpc.mockResolvedValue({ data: false, error: null });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello', id: '1' }],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe('Too many requests');
    expect(mockSupabase.rpc).toHaveBeenCalledWith('check_rate_limit');
  });

  it('should proceed when rate limit is allowed', async () => {
    // Mock rate limit check to return true (allowed)
    mockSupabase.rpc.mockResolvedValue({ data: true, error: null });

    // Mock other DB calls for successful flow
    // mockQueryBuilder is already configured in beforeEach to return success

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello', id: '1', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
    });

    const response = await POST(request);

    // If successful, it should return the stream response (which we mocked to return a Response object)
    expect(response.status).toBe(200);
    expect(mockSupabase.rpc).toHaveBeenCalledWith('check_rate_limit');
  });

  it('should return 500 when rate limit check fails with error', async () => {
    // Mock rate limit check to return error
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello', id: '1' }],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Rate limit check failed');
  });
});
