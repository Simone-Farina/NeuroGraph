import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractVideoId, isYouTubeUrl, fetchTranscript, TranscriptFetchError } from '../index';
import { YoutubeTranscript } from 'youtube-transcript';

// Mock youtube-transcript
vi.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: vi.fn(),
  },
  YoutubeTranscriptDisabledError: class {},
  YoutubeTranscriptNotAvailableError: class {},
  YoutubeTranscriptNotAvailableLanguageError: class {},
  YoutubeTranscriptTooManyRequestError: class {},
  YoutubeTranscriptVideoUnavailableError: class {},
}));

describe('YouTube Utility', () => {
  describe('extractVideoId', () => {
    it('should extract ID from standard URL', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from short URL', () => {
      expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from embed URL', () => {
      expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(extractVideoId('https://example.com')).toBeNull();
    });
  });

  describe('isYouTubeUrl', () => {
    it('should return true for valid YouTube URL', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true); // This might fail if regex is strict about exact match vs contains
    });
    
    // The regex in source is: new RegExp(`${YOUTUBE_URL_PATTERN}${VIDEO_ID_PATTERN}`, 'i');
    // It doesn't have ^ and $ anchors, so it tests if it contains the pattern.
  });

  describe('fetchTranscript', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch and combine transcript segments', async () => {
      const mockSegments = [
        { text: 'Hello', duration: 1, offset: 0 },
        { text: 'world', duration: 1, offset: 1 },
      ];
      (YoutubeTranscript.fetchTranscript as any).mockResolvedValue(mockSegments);

      const result = await fetchTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      expect(result.transcript).toBe('Hello world');
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should throw error if no transcript available', async () => {
      (YoutubeTranscript.fetchTranscript as any).mockResolvedValue([]);

      await expect(fetchTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
        .rejects.toThrow(TranscriptFetchError);
    });
  });
});
