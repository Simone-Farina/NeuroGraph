import { describe, it, expect, vi } from 'vitest';
import { calculateRetrievability, scheduleReview } from '../fsrs';
import { Crystal } from '@/types/database';
import { Rating } from 'ts-fsrs';

describe('FSRS Logic', () => {
  describe('calculateRetrievability', () => {
    it('should return 1.0 for new crystals', () => {
      const crystal = {
        state: 'New',
        stability: 0,
        last_review: null,
      } as unknown as Crystal;
      
      expect(calculateRetrievability(crystal)).toBe(1.0);
    });

    it('should return 1.0 immediately after review', () => {
      const now = new Date();
      const crystal = {
        state: 'Review',
        stability: 5,
        last_review: now.toISOString(),
      } as unknown as Crystal;
      
      expect(calculateRetrievability(crystal, now)).toBeCloseTo(1.0, 5);
    });

    it('should decay over time', () => {
      const now = new Date();
      const lastReview = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const crystal = {
        state: 'Review',
        stability: 1, // Stability of 1 day
        last_review: lastReview.toISOString(),
      } as unknown as Crystal;
      
      // With stability 1 and 1 day elapsed, retrievability should be around 0.9 (request_retention)
      // The formula is R = (1 + factor * t / S) ^ -w20
      // If t = S, R should be close to request_retention (0.9)
      expect(calculateRetrievability(crystal, now)).toBeCloseTo(0.9, 1);
    });
  });

  describe('scheduleReview', () => {
    it('should schedule next review correctly for "Good" rating', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const crystal = {
        id: '123',
        state: 'New',
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        last_review: null,
        next_review_due: now.toISOString(),
      } as unknown as Crystal;

      const result = scheduleReview(crystal, Rating.Good, now);

      expect(result.state).toBe('Learning');
      expect(result.reps).toBe(1);
      expect(new Date(result.next_review_due).getTime()).toBeGreaterThan(now.getTime());
      expect(result.last_review).toBe(now.toISOString());
    });

    it('should throw error for invalid rating', () => {
      const now = new Date();
      const crystal = {
        next_review_due: now.toISOString(),
        state: 'New',
      } as unknown as Crystal;

      expect(() => scheduleReview(crystal, 5 as Rating, now)).toThrow(/Invalid rating/);
    });
  });
});
