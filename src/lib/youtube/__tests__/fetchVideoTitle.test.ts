import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVideoTitle } from '../index';

describe('fetchVideoTitle', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return title on successful fetch', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ title: 'Test Video Title' }),
    };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

    const title = await fetchVideoTitle('dQw4w9WgXcQ');

    expect(title).toBe('Test Video Title');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should return null on non-ok response', async () => {
    const mockResponse = {
      ok: false,
    };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

    const title = await fetchVideoTitle('invalidId');

    expect(title).toBeNull();
  });

  it('should return null on fetch error', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const title = await fetchVideoTitle('dQw4w9WgXcQ');

    expect(title).toBeNull();
  });

  it('should use AbortSignal.timeout', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ title: 'Test Video Title' }),
    };
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

    await fetchVideoTitle('dQw4w9WgXcQ');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://www.youtube.com/oembed'),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });
});
