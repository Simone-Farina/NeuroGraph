import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { persistAssistantMessage } from './persistence';
import { SupabaseClient } from '@supabase/supabase-js';

describe('persistAssistantMessage', () => {
  let mockSupabase: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn(),
    };

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully persist message without logging error', async () => {
    mockSupabase.insert.mockResolvedValue({ error: null });

    await persistAssistantMessage(
      mockSupabase as unknown as SupabaseClient,
      'conv-123',
      'Hello world'
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('messages');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      conversation_id: 'conv-123',
      role: 'assistant',
      content: 'Hello world',
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should log sanitized error message when supabase insert fails', async () => {
    const sensitiveError = {
      message: 'Sensitive DB info',
      code: '23505', // Unique violation
    };
    mockSupabase.insert.mockResolvedValue({ error: sensitiveError });

    await persistAssistantMessage(
      mockSupabase as unknown as SupabaseClient,
      'conv-123',
      'Hello world'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to persist assistant message. Error Code:',
      '23505'
    );
    // Ensure sensitive message is NOT logged
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('Sensitive DB info'));
  });

  it('should log generic error message when an exception occurs', async () => {
    mockSupabase.insert.mockRejectedValue(new Error('Unexpected crash with sensitive details'));

    await persistAssistantMessage(
      mockSupabase as unknown as SupabaseClient,
      'conv-123',
      'Hello world'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to persist assistant message: An unexpected error occurred.'
    );
    // Ensure sensitive exception details are NOT logged
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('sensitive details'));
  });

  it('should do nothing if content is empty', async () => {
    await persistAssistantMessage(
      mockSupabase as unknown as SupabaseClient,
      'conv-123',
      '   '
    );

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should do nothing if conversationId is missing', async () => {
    await persistAssistantMessage(
      mockSupabase as unknown as SupabaseClient,
      '',
      'Hello'
    );

    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
