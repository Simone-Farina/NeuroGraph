import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './route';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/db/queries', () => ({
  neuronQueries: {
    getDueForReview: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
    },
  };
});

describe('Review API Security Check', () => {
  const sensitiveError = new Error('Connection failed: password=super_secret_password');
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.resetAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('GET should log only the error message, not the full object', async () => {
    // Mock createServerSupabaseClient to throw the sensitive error immediately
    (createServerSupabaseClient as any).mockRejectedValue(sensitiveError);

    await GET();

    // Check if only the message was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Review fetch error:', sensitiveError.message);

    // Ensure the sensitive object itself was NOT passed
    const loggedArgs = consoleErrorSpy.mock.calls[0];
    expect(loggedArgs[1]).not.toBe(sensitiveError);
    expect(typeof loggedArgs[1]).toBe('string');
  });

  it('POST should log only the error message, not the full object', async () => {
    // Mock createServerSupabaseClient to throw the sensitive error immediately
    (createServerSupabaseClient as any).mockRejectedValue(sensitiveError);

    const request = new NextRequest('http://localhost:3000/api/review', {
      method: 'POST',
      body: JSON.stringify({ neuronId: '123', rating: 3 }),
    });

    await POST(request);

    // Check if only the message was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Review error:', sensitiveError.message);

    // Ensure the sensitive object itself was NOT passed
    const loggedArgs = consoleErrorSpy.mock.calls[0];
    expect(loggedArgs[1]).not.toBe(sensitiveError);
    expect(typeof loggedArgs[1]).toBe('string');
  });
});
