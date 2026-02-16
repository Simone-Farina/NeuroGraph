import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from 'youtube-transcript';

export const MAX_TRANSCRIPT_CHARS = 32000;

const VIDEO_ID_PATTERN = '[A-Za-z0-9_-]{11}';
const YOUTUBE_URL_PATTERN =
  '(?:https?:\\/\\/)?(?:www\\.|m\\.)?(?:youtube\\.com\\/(?:watch\\?v=|shorts\\/|embed\\/)|youtu\\.be\\/)';

export const YOUTUBE_URL_REGEX = new RegExp(`${YOUTUBE_URL_PATTERN}${VIDEO_ID_PATTERN}`, 'i');

export class TranscriptFetchError extends Error {
  code: 'INVALID_URL' | 'NO_TRANSCRIPT' | 'NETWORK_ERROR';

  constructor(code: 'INVALID_URL' | 'NO_TRANSCRIPT' | 'NETWORK_ERROR', message: string) {
    super(message);
    this.name = 'TranscriptFetchError';
    this.code = code;
  }
}

function normalizePossibleUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

export function extractVideoId(url: string): string | null {
  const parsed = normalizePossibleUrl(url);
  if (!parsed) return null;

  const hostname = parsed.hostname.toLowerCase();
  const normalizedHost = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

  if (normalizedHost === 'youtu.be') {
    const candidate = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
    return new RegExp(`^${VIDEO_ID_PATTERN}$`).test(candidate) ? candidate : null;
  }

  if (normalizedHost === 'youtube.com' || normalizedHost === 'm.youtube.com') {
    if (parsed.pathname === '/watch') {
      const candidate = parsed.searchParams.get('v') ?? '';
      return new RegExp(`^${VIDEO_ID_PATTERN}$`).test(candidate) ? candidate : null;
    }

    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 2 && (pathSegments[0] === 'shorts' || pathSegments[0] === 'embed')) {
      const candidate = pathSegments[1] ?? '';
      return new RegExp(`^${VIDEO_ID_PATTERN}$`).test(candidate) ? candidate : null;
    }
  }

  return null;
}

export function isYouTubeUrl(text: string): boolean {
  return YOUTUBE_URL_REGEX.test(text);
}

export function extractFirstYouTubeUrl(text: string): string | null {
  const match = text.match(new RegExp(`${YOUTUBE_URL_PATTERN}${VIDEO_ID_PATTERN}(?:[?&][^\\s]*)?`, 'i'));
  return match?.[0] ?? null;
}

export async function fetchVideoTitle(videoId: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const response = await fetch(oembedUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { title?: unknown };
    return typeof data.title === 'string' ? data.title : null;
  } catch {
    return null;
  }
}

export async function fetchTranscript(url: string): Promise<{ transcript: string; videoId: string }> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new TranscriptFetchError('INVALID_URL', 'Invalid YouTube URL. Please provide a valid video link.');
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(url);

    if (!segments.length) {
      throw new TranscriptFetchError('NO_TRANSCRIPT', 'No transcript available for this video.');
    }

    const combined = segments
      .map((segment) => segment.text.trim())
      .filter(Boolean)
      .join(' ');

    if (!combined) {
      throw new TranscriptFetchError('NO_TRANSCRIPT', 'No transcript available for this video.');
    }

    if (combined.length > MAX_TRANSCRIPT_CHARS) {
      const truncated = combined.slice(0, MAX_TRANSCRIPT_CHARS);
      return { transcript: `${truncated}\n\n[transcript truncated]`, videoId };
    }

    return { transcript: combined, videoId };
  } catch (error) {
    if (error instanceof TranscriptFetchError) {
      throw error;
    }

    if (
      error instanceof YoutubeTranscriptDisabledError ||
      error instanceof YoutubeTranscriptNotAvailableError ||
      error instanceof YoutubeTranscriptNotAvailableLanguageError ||
      error instanceof YoutubeTranscriptVideoUnavailableError
    ) {
      throw new TranscriptFetchError('NO_TRANSCRIPT', 'No transcript available for this video.');
    }

    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      throw new TranscriptFetchError(
        'NETWORK_ERROR',
        'YouTube rate-limited transcript requests. Please try again shortly.'
      );
    }

    throw new TranscriptFetchError(
      'NETWORK_ERROR',
      error instanceof Error ? `Failed to fetch transcript: ${error.message}` : 'Failed to fetch transcript due to a network error.'
    );
  }
}
