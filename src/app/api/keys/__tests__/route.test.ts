import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock dependencies before importing route
vi.mock('@/lib/auth/server');
vi.mock('@/lib/auth/apiKeys');
vi.mock('@/lib/db/apiKeyQueries');

const mockSupabaseAdmin = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseAdmin),
}));

import { getAuthenticatedUser } from '@/lib/auth/server';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/auth/apiKeys';
import { apiKeyQueries } from '@/lib/db/apiKeyQueries';
import { GET, POST, DELETE } from '../route';

const MOCK_USER = { id: 'user-1', email: 'test@example.com' };
const MOCK_SUPABASE = {} as any;

const MOCK_KEY_ROW = {
  id: 'key-1',
  user_id: 'user-1',
  key_prefix: 'ng_ABCDEFGHI',
  key_hash: 'abc123hash',
  created_at: '2026-01-01T00:00:00Z',
  last_used_at: '2026-01-02T00:00:00Z',
  revoked_at: null,
};

describe('GET /api/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated
    (getAuthenticatedUser as any).mockResolvedValue({
      user: MOCK_USER,
      supabase: MOCK_SUPABASE,
      errorResponse: null,
    });
    (apiKeyQueries.getActiveByUserId as any) = vi.fn().mockResolvedValue(MOCK_KEY_ROW);
  });

  it('returns key info when active key exists', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.key).toMatchObject({
      id: 'key-1',
      prefix: 'ng_ABCDEFGHI',
      created_at: '2026-01-01T00:00:00Z',
      last_used_at: '2026-01-02T00:00:00Z',
    });
    // key_hash must never be leaked
    expect(json.key).not.toHaveProperty('key_hash');
  });

  it('returns null when no active key', async () => {
    (apiKeyQueries.getActiveByUserId as any) = vi.fn().mockResolvedValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ key: null });
  });

  it('returns 401 when not authenticated', async () => {
    (getAuthenticatedUser as any).mockResolvedValue({
      user: null,
      supabase: MOCK_SUPABASE,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await GET();
    expect(response.status).toBe(401);
  });
});

describe('POST /api/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated
    (getAuthenticatedUser as any).mockResolvedValue({
      user: MOCK_USER,
      supabase: MOCK_SUPABASE,
      errorResponse: null,
    });
    (apiKeyQueries.getActiveByUserId as any) = vi.fn().mockResolvedValue(null);
    (generateApiKey as any).mockReturnValue('ng_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    (hashApiKey as any).mockReturnValue('newhash456');
    (getKeyPrefix as any).mockReturnValue('ng_ABCDEFGHI');
    (apiKeyQueries.create as any) = vi.fn().mockResolvedValue({
      id: 'key-2',
      user_id: 'user-1',
      key_prefix: 'ng_ABCDEFGHI',
      key_hash: 'newhash456',
      created_at: '2026-03-22T00:00:00Z',
      last_used_at: null,
      revoked_at: null,
    });
    (apiKeyQueries.revoke as any) = vi.fn().mockResolvedValue(undefined);
  });

  it('generates new key and returns raw key once', async () => {
    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toHaveProperty('key');
    expect(json).toHaveProperty('prefix');
    expect(json.key).toMatch(/^ng_/);
    expect(apiKeyQueries.create).toHaveBeenCalled();
  });

  it('auto-revokes existing key before generating new one', async () => {
    (apiKeyQueries.getActiveByUserId as any) = vi.fn().mockResolvedValue(MOCK_KEY_ROW);

    const response = await POST();

    expect(apiKeyQueries.revoke).toHaveBeenCalledWith(expect.anything(), 'key-1');
    expect(apiKeyQueries.create).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('never includes key_hash in response', async () => {
    const response = await POST();
    const json = await response.json();

    expect(JSON.stringify(json)).not.toContain('key_hash');
    expect(JSON.stringify(json)).not.toContain('newhash456');
  });

  it('returns 401 when not authenticated', async () => {
    (getAuthenticatedUser as any).mockResolvedValue({
      user: null,
      supabase: MOCK_SUPABASE,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await POST();
    expect(response.status).toBe(401);
  });
});

describe('DELETE /api/keys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated
    (getAuthenticatedUser as any).mockResolvedValue({
      user: MOCK_USER,
      supabase: MOCK_SUPABASE,
      errorResponse: null,
    });
    (apiKeyQueries.getActiveByUserId as any) = vi.fn().mockResolvedValue(MOCK_KEY_ROW);
    (apiKeyQueries.revoke as any) = vi.fn().mockResolvedValue(undefined);
  });

  it('revokes active key and returns success', async () => {
    const response = await DELETE();
    const json = await response.json();

    expect(apiKeyQueries.revoke).toHaveBeenCalledWith(expect.anything(), 'key-1');
    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it('returns success even when no key exists', async () => {
    (apiKeyQueries.getActiveByUserId as any) = vi.fn().mockResolvedValue(null);

    const response = await DELETE();
    const json = await response.json();

    expect(apiKeyQueries.revoke).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it('returns 401 when not authenticated', async () => {
    (getAuthenticatedUser as any).mockResolvedValue({
      user: null,
      supabase: MOCK_SUPABASE,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await DELETE();
    expect(response.status).toBe(401);
  });
});
