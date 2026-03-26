import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mockGenerateObject = vi.fn();
const mockGetAuthenticatedUser = vi.fn();
const mockGetModelForRole = vi.fn();

vi.mock('ai', () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}));

vi.mock('@/lib/auth/server', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));

vi.mock('@/lib/ai/providers', () => ({
  getModelForRole: (...args: unknown[]) => mockGetModelForRole(...args),
}));

import { POST } from '@/app/api/architect/route';

function jsonRequest(body: object) {
  return new NextRequest('http://localhost/api/architect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/architect', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAuthenticatedUser.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
      errorResponse: null,
    });
    mockGetModelForRole.mockReturnValue('mock-model');
    mockGenerateObject.mockResolvedValue({
      object: {
        isValid: true,
        nodes: [
          {
            title: 'Embeddings',
            definition: 'Dense vector representations that encode semantic meaning.',
            bloom_level: 'Understand',
          },
        ],
        synapses: [],
      },
    });
  });

  it('returns 401 when the session is missing', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      user: null,
      supabase: {},
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const response = await POST(jsonRequest({ target: 'Vector Databases' }));

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(jsonRequest({ target: '' }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid payload');
    expect(mockGenerateObject).not.toHaveBeenCalled();
  });

  it('returns the architect draft without writing to the database', async () => {
    const response = await POST(jsonRequest({ target: 'Vector Databases' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      target: 'Vector Databases',
      draft: {
        isValid: true,
        nodes: [
          {
            title: 'Embeddings',
            definition: 'Dense vector representations that encode semantic meaning.',
            bloom_level: 'Understand',
          },
        ],
        synapses: [],
      },
    });
    expect(mockGetModelForRole).toHaveBeenCalledWith('inquisitor');
    expect(mockGenerateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-model',
        system: expect.stringContaining('You are the NeuroGraph Architect'),
        prompt: expect.stringContaining('Target topic: Vector Databases'),
      })
    );
  });
});
