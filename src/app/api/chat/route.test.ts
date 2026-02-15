import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createServerSupabaseClient } from '@/lib/auth/supabase';

// Mocks
vi.mock('@/lib/auth/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('ai', async () => {
  const actual = await vi.importActual('ai');
  return {
    ...actual,
    streamText: vi.fn(),
  };
});

// Mock getRelevantContext, getChatModel, suggestCrystallizationTool
vi.mock('@/lib/ai/rag', () => ({
  getRelevantContext: vi.fn().mockResolvedValue({ ragContext: '', ragCatalog: '' }),
}));
vi.mock('@/lib/ai/providers', () => ({
  getChatModel: vi.fn(),
}));
vi.mock('@/lib/ai/tools', () => ({
  suggestCrystallizationTool: {},
}));

describe('Chat API POST', () => {
  let mockSupabase: any;
  let mockInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          insert: mockInsert,
      }),
    };

    (createServerSupabaseClient as any).mockResolvedValue(mockSupabase);

    // Default streamText mock behavior
    (streamText as any).mockReturnValue({
        toUIMessageStreamResponse: vi.fn(),
    });
  });

  it('should sanitize error logs when persisting assistant message fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Prepare request with conversationId to skip conversation creation logic
    const req = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        messages: [{ id: '1', role: 'user', content: 'hello', parts: [{ type: 'text', text: 'hello' }] }],
      }),
    });

    // Setup insert mocks
    // 1st call: user message - success
    mockInsert.mockResolvedValueOnce({ error: null });

    await POST(req);

    // Verify streamText was called
    expect(streamText).toHaveBeenCalled();
    const streamTextCalls = (streamText as any).mock.calls;
    const config = streamTextCalls[0][0];

    // Get the onFinish callback
    const onFinish = config.onFinish;
    expect(onFinish).toBeDefined();

    // Simulate some text chunks to populate assistantText
    const onChunk = config.onChunk;
    expect(onChunk).toBeDefined();
    // Simulate text delta
    onChunk({ chunk: { type: 'text-delta', text: 'Hello world' } });

    // Setup the error condition for assistant message insert
    const sensitiveError = new Error('Connection failed');
    (sensitiveError as any).secret = 'super-secret-key';

    // 2nd call: assistant message - throw error
    mockInsert.mockRejectedValueOnce(sensitiveError);

    // Call onFinish
    await onFinish();

    // Verify console.error was called
    expect(consoleSpy).toHaveBeenCalled();

    // Assert that sensitive info is NOT logged.
    expect(consoleSpy).toHaveBeenCalledWith('Failed to persist assistant message:', 'Connection failed');
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Failed to persist assistant message'), sensitiveError);

    consoleSpy.mockRestore();
  });
});
