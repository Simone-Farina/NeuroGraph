import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted so mockSupabaseAdmin is available inside vi.mock factory (hoisting order fix)
const { mockSupabaseAdmin } = vi.hoisted(() => {
  const mockSupabaseAdmin = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  };
  return { mockSupabaseAdmin };
});

// Mock dependencies before importing route
vi.mock('@/lib/auth/apiKeys');
vi.mock('@/lib/db/apiKeyQueries');
vi.mock('@/lib/db/queueQueries');
vi.mock('@/lib/capture/metadata');

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseAdmin),
}));

import { hashApiKey } from '@/lib/auth/apiKeys';
import { apiKeyQueries } from '@/lib/db/apiKeyQueries';
import { queueQueries } from '@/lib/db/queueQueries';
import { extractHeadMetadata } from '@/lib/capture/metadata';
import { POST } from '../route';

function captureRequest(body: object, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return new NextRequest('http://localhost/api/capture', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

// Must be ng_ + exactly 48 alphanumeric chars to pass RawApiKeySchema validation
const VALID_TOKEN = 'ng_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv';
const VALID_HASH = 'abc123hash';
const VALID_KEY_ROW = {
  id: 'key-1',
  user_id: 'user-1',
  key_prefix: 'ng_ABCDEFGHI',
  key_hash: VALID_HASH,
  created_at: '2026-01-01T00:00:00Z',
  last_used_at: null,
  revoked_at: null,
};

describe('POST /api/capture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: hash returns valid hash
    vi.mocked(hashApiKey).mockReturnValue(VALID_HASH);
    // Default: findByHash returns valid key
    vi.mocked(apiKeyQueries.findByHash).mockResolvedValue(VALID_KEY_ROW);
    vi.mocked(apiKeyQueries.updateLastUsed).mockResolvedValue(undefined);
    // Default: rate limit not exceeded (count = 0)
    // Supabase chain: .from().select().eq().gte() returns a Promise<{count, data, error}>
    const mockGte = vi.fn().mockResolvedValue({ count: 0, data: null, error: null });
    const mockEqUser = vi.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
    mockSupabaseAdmin.from.mockReturnValue({ select: mockSelect });
    // Default: no duplicate URL
    vi.mocked(queueQueries.findByUrl).mockResolvedValue(null);
    // Default: metadata extraction returns data
    vi.mocked(extractHeadMetadata).mockResolvedValue({
      title: 'Test Title',
      favicon_url: 'https://example.com/favicon.ico',
      estimated_read_time: null,
      source_domain: 'example.com',
    });
    // Default: create returns a queue item
    vi.mocked(queueQueries.create).mockResolvedValue({
      id: 'item-1',
      title: 'Test Title',
      url: 'https://example.com/article',
      source_domain: 'example.com',
      state: 'inbox',
      user_id: 'user-1',
      notes: null,
      favicon_url: null,
      estimated_read_time: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
  });

  it('returns 401 when no Authorization header', async () => {
    const req = captureRequest({ title: 'Test', url: 'https://example.com' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ success: false, error: 'unauthorized' });
  });

  it('returns 401 when bearer token is invalid format', async () => {
    const req = captureRequest({ title: 'Test', url: 'https://example.com' }, 'bad_token');
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ success: false, error: 'unauthorized' });
  });

  it('returns 401 when key hash not found (revoked or nonexistent)', async () => {
    vi.mocked(apiKeyQueries.findByHash).mockResolvedValue(null);

    const req = captureRequest({ title: 'Test', url: 'https://example.com' }, VALID_TOKEN);
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ success: false, error: 'unauthorized' });
  });

  it('returns 429 when rate limit exceeded (60/hour)', async () => {
    const mockGte = vi.fn().mockResolvedValue({ count: 60, data: null, error: null });
    const mockEqUser = vi.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
    mockSupabaseAdmin.from.mockReturnValue({ select: mockSelect });

    const req = captureRequest({ title: 'Test', url: 'https://example.com' }, VALID_TOKEN);
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(429);
    expect(json).toEqual({ success: false, error: 'rate_limited' });
  });

  it('returns 400 for invalid payload', async () => {
    // Empty body — missing required title
    const req = captureRequest({}, VALID_TOKEN);
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ success: false, error: 'invalid_payload' });
  });

  it('returns 409 for duplicate URL', async () => {
    const existingItem = {
      id: 'existing-1',
      title: 'Existing',
      url: 'https://example.com/article',
      state: 'inbox' as const,
      user_id: 'user-1',
      notes: null,
      source_domain: null,
      favicon_url: null,
      estimated_read_time: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    vi.mocked(queueQueries.findByUrl).mockResolvedValue(existingItem);

    const req = captureRequest(
      { title: 'Test', url: 'https://example.com/article' },
      VALID_TOKEN
    );
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json).toEqual({
      success: false,
      error: 'duplicate',
      existing_id: 'existing-1',
    });
  });

  it('returns 201 with item on successful capture', async () => {
    const req = captureRequest(
      { title: 'My Article', url: 'https://example.com/article' },
      VALID_TOKEN
    );
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.item).toMatchObject({
      id: 'item-1',
      title: expect.any(String),
      url: 'https://example.com/article',
      source_domain: 'example.com',
      state: 'inbox',
    });
  });

  it('succeeds even when metadata extraction fails', async () => {
    (extractHeadMetadata as any).mockResolvedValue({
      title: null,
      favicon_url: null,
      estimated_read_time: null,
      source_domain: 'example.com',
    });
    vi.mocked(queueQueries.create).mockResolvedValue({
      id: 'item-2',
      title: 'My Article',
      url: 'https://example.com/article',
      source_domain: 'example.com',
      state: 'inbox',
      user_id: 'user-1',
      notes: null,
      favicon_url: null,
      estimated_read_time: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });

    const req = captureRequest(
      { title: 'My Article', url: 'https://example.com/article' },
      VALID_TOKEN
    );
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
  });
});
