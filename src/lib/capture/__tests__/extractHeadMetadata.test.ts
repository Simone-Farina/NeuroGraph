import { describe, it, expect, vi, afterEach } from 'vitest';
import { isSafeUrl, extractHeadMetadata } from '../metadata';

vi.stubGlobal('fetch', vi.fn());

afterEach(() => {
  vi.restoreAllMocks();
});

function makeFetchResponse(html: string, ok = true) {
  return Promise.resolve({
    ok,
    text: () => Promise.resolve(html),
  });
}

describe('isSafeUrl', () => {
  it('accepts valid HTTPS URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
  });

  it('rejects HTTP URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(false);
  });

  it('rejects localhost', () => {
    expect(isSafeUrl('https://localhost/path')).toBe(false);
  });

  it('rejects 127.x.x.x', () => {
    expect(isSafeUrl('https://127.0.0.1')).toBe(false);
  });

  it('rejects 10.x.x.x private range', () => {
    expect(isSafeUrl('https://10.0.0.1')).toBe(false);
  });

  it('rejects 192.168.x.x private range', () => {
    expect(isSafeUrl('https://192.168.1.1')).toBe(false);
  });

  it('rejects 172.16-31.x.x private range', () => {
    expect(isSafeUrl('https://172.16.0.1')).toBe(false);
  });

  it('rejects 169.254.x.x link-local', () => {
    expect(isSafeUrl('https://169.254.1.1')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isSafeUrl('not-a-url')).toBe(false);
  });
});

describe('extractHeadMetadata', () => {
  it('extracts title from <title> tag', async () => {
    (fetch as any).mockResolvedValue(
      makeFetchResponse('<html><head><title>Test Title</title></head><body></body></html>')
    );

    const result = await extractHeadMetadata('https://example.com/article');

    expect(result.title).toBe('Test Title');
    expect(result.source_domain).toBe('example.com');
  });

  it('prefers og:title over <title>', async () => {
    (fetch as any).mockResolvedValue(
      makeFetchResponse(
        '<html><head><title>Regular Title</title><meta property="og:title" content="OG Title" /></head><body></body></html>'
      )
    );

    const result = await extractHeadMetadata('https://example.com/article');

    expect(result.title).toBe('OG Title');
  });

  it('extracts favicon from <link rel="icon">', async () => {
    (fetch as any).mockResolvedValue(
      makeFetchResponse(
        '<html><head><link rel="icon" href="/custom-icon.png" /></head><body></body></html>'
      )
    );

    const result = await extractHeadMetadata('https://example.com/article');

    expect(result.favicon_url).toBe('https://example.com/custom-icon.png');
  });

  it('falls back to /favicon.ico when no link tag', async () => {
    (fetch as any).mockResolvedValue(
      makeFetchResponse('<html><head><title>No Favicon</title></head><body></body></html>')
    );

    const result = await extractHeadMetadata('https://example.com/article');

    expect(result.favicon_url).toBe('https://example.com/favicon.ico');
  });

  it('returns fallback values when fetch fails', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const result = await extractHeadMetadata('https://example.com/article');

    expect(result).toEqual({
      title: null,
      favicon_url: null,
      estimated_read_time: null,
      source_domain: 'example.com',
    });
  });

  it('returns fallback values when fetch times out', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    (fetch as any).mockRejectedValue(abortError);

    const result = await extractHeadMetadata('https://example.com/article');

    expect(result).toEqual({
      title: null,
      favicon_url: null,
      estimated_read_time: null,
      source_domain: 'example.com',
    });
  });

  it('estimated_read_time is always null', async () => {
    (fetch as any).mockResolvedValue(
      makeFetchResponse(
        '<html><head><title>Long Article</title></head><body>' +
          'word '.repeat(5000) +
          '</body></html>'
      )
    );

    const result = await extractHeadMetadata('https://example.com/article');

    expect(result.estimated_read_time).toBeNull();
  });
});
