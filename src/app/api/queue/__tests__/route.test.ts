import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth/server');
vi.mock('@/lib/db/queueQueries');

import { getAuthenticatedUser } from '@/lib/auth/server';
import { queueQueries } from '@/lib/db/queueQueries';
import { GET } from '../route';
import { PATCH, DELETE } from '../[id]/route';

const MOCK_USER = { id: 'user-1', email: 'test@example.com' };
const MOCK_SUPABASE = {} as any;

const INBOX_ITEM = {
  id: 'item-1',
  user_id: 'user-1',
  title: 'Inbox item',
  url: 'https://example.com/inbox',
  notes: null,
  state: 'inbox' as const,
  source_domain: 'example.com',
  favicon_url: null,
  estimated_read_time: null,
  created_at: '2026-03-22T00:00:00Z',
  updated_at: '2026-03-22T00:00:00Z',
};

const RESOURCE_ITEM = {
  ...INBOX_ITEM,
  id: 'item-2',
  state: 'resource' as const,
  title: 'Resource item',
};

function patchRequest(body: object) {
  return new NextRequest('http://localhost/api/queue/item-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Queue API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAuthenticatedUser as any).mockResolvedValue({
      user: MOCK_USER,
      supabase: MOCK_SUPABASE,
      errorResponse: null,
    });
    (queueQueries.getActiveByUserId as any) = vi.fn().mockResolvedValue([INBOX_ITEM, RESOURCE_ITEM]);
    (queueQueries.getById as any) = vi.fn().mockResolvedValue(INBOX_ITEM);
    (queueQueries.updateState as any) = vi.fn().mockResolvedValue({
      ...INBOX_ITEM,
      state: 'passive_debt',
    });
    (queueQueries.deleteItem as any) = vi.fn().mockResolvedValue(undefined);
  });

  it('GET /api/queue returns items for authenticated users', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(queueQueries.getActiveByUserId).toHaveBeenCalledWith(MOCK_SUPABASE, 'user-1');
    expect(json).toEqual({
      items: [INBOX_ITEM, RESOURCE_ITEM],
    });
  });

  it('forwards unauthorized response from getAuthenticatedUser for GET', async () => {
    (getAuthenticatedUser as any).mockResolvedValue({
      user: null,
      supabase: MOCK_SUPABASE,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('PATCH /api/queue/[id] validates the payload and updates the item', async () => {
    const response = await PATCH(patchRequest({ state: 'passive_debt' }), {
      params: { id: 'item-1' },
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(queueQueries.getById).toHaveBeenCalledWith(MOCK_SUPABASE, 'item-1');
    expect(queueQueries.updateState).toHaveBeenCalledWith(
      MOCK_SUPABASE,
      'item-1',
      'inbox',
      'passive_debt'
    );
    expect(json.item.state).toBe('passive_debt');
  });

  it('PATCH /api/queue/[id] returns 400 for invalid payload', async () => {
    const response = await PATCH(patchRequest({ state: 'nope' }), {
      params: { id: 'item-1' },
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: 'Invalid queue state transition payload' });
  });

  it('PATCH /api/queue/[id] returns 404 when the row is missing', async () => {
    (queueQueries.getById as any).mockResolvedValue(null);

    const response = await PATCH(patchRequest({ state: 'passive_debt' }), {
      params: { id: 'missing-item' },
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'Queue item not found' });
  });

  it('PATCH /api/queue/[id] returns 404 when the row belongs to another user', async () => {
    (queueQueries.getById as any).mockResolvedValue({
      ...INBOX_ITEM,
      user_id: 'other-user',
    });

    const response = await PATCH(patchRequest({ state: 'passive_debt' }), {
      params: { id: 'item-1' },
    });

    expect(response.status).toBe(404);
  });

  it('PATCH /api/queue/[id] returns 400 for invalid forward-only transitions', async () => {
    (queueQueries.updateState as any).mockRejectedValue(
      new Error('Invalid state transition: inbox -> mastered')
    );

    const response = await PATCH(patchRequest({ state: 'mastered' }), {
      params: { id: 'item-1' },
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: 'Invalid state transition: inbox -> mastered' });
  });

  it('forwards unauthorized response from getAuthenticatedUser for PATCH', async () => {
    (getAuthenticatedUser as any).mockResolvedValue({
      user: null,
      supabase: MOCK_SUPABASE,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await PATCH(patchRequest({ state: 'passive_debt' }), {
      params: { id: 'item-1' },
    });

    expect(response.status).toBe(401);
  });

  it('DELETE /api/queue/[id] removes the row when it exists for the session', async () => {
    const response = await DELETE(new NextRequest('http://localhost/api/queue/item-1'), {
      params: { id: 'item-1' },
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(queueQueries.deleteItem).toHaveBeenCalledWith(MOCK_SUPABASE, 'item-1');
    expect(json).toEqual({ success: true });
  });

  it('DELETE /api/queue/[id] returns 404 when the row is missing', async () => {
    (queueQueries.getById as any).mockResolvedValue(null);

    const response = await DELETE(new NextRequest('http://localhost/api/queue/missing-item'), {
      params: { id: 'missing-item' },
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'Queue item not found' });
  });

  it('forwards unauthorized response from getAuthenticatedUser for DELETE', async () => {
    (getAuthenticatedUser as any).mockResolvedValue({
      user: null,
      supabase: MOCK_SUPABASE,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await DELETE(new NextRequest('http://localhost/api/queue/item-1'), {
      params: { id: 'item-1' },
    });

    expect(response.status).toBe(401);
  });
});
