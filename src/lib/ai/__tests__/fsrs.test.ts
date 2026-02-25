import { describe, it, expect } from 'vitest';
import { calculateRetrievability, scheduleReview, mapStateToFSRS } from '../fsrs';
import { Neuron } from '@/types/database';
import { Rating, State } from 'ts-fsrs';

describe('FSRS Logic', () => {
  describe('calculateRetrievability', () => {
    it('should return 1.0 for new neurons', () => {
      const neuron = {
        state: 'New',
        stability: 0,
        last_review: null,
      } as unknown as Neuron;

      expect(calculateRetrievability(neuron)).toBe(1.0);
    });

    it('should return 1.0 immediately after review', () => {
      const now = new Date();
      const neuron = {
        state: 'Review',
        stability: 5,
        last_review: now.toISOString(),
      } as unknown as Neuron;

      expect(calculateRetrievability(neuron, now)).toBeCloseTo(1.0, 5);
    });

    it('should decay over time', () => {
      const now = new Date();
      const lastReview = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      const neuron = {
        state: 'Review',
        stability: 1,
        last_review: lastReview.toISOString(),
      } as unknown as Neuron;

      expect(calculateRetrievability(neuron, now)).toBeCloseTo(0.9, 1);
    });
  });

  describe('mapStateToFSRS', () => {
    it('should map all known states', () => {
      expect(mapStateToFSRS('New')).toBe(State.New);
      expect(mapStateToFSRS('Learning')).toBe(State.Learning);
      expect(mapStateToFSRS('Review')).toBe(State.Review);
      expect(mapStateToFSRS('Relearning')).toBe(State.Relearning);
    });

    it('should default to New for unknown state', () => {
      expect(mapStateToFSRS('Unknown')).toBe(State.New);
      expect(mapStateToFSRS('')).toBe(State.New);
    });
  });

  describe('scheduleReview', () => {
    it('should schedule next review correctly for "Good" rating', () => {
      const now = new Date('2024-01-01T12:00:00Z');
      const neuron = {
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
      } as unknown as Neuron;

      const result = scheduleReview(neuron, Rating.Good, now);

      expect(result.state).toBe('Learning');
      expect(result.reps).toBe(1);
      expect(new Date(result.next_review_due).getTime()).toBeGreaterThan(now.getTime());
      expect(result.last_review).toBe(now.toISOString());
    });

    it('should throw error for invalid rating', () => {
      const now = new Date();
      const neuron = {
        next_review_due: now.toISOString(),
        state: 'New',
      } as unknown as Neuron;

      expect(() => scheduleReview(neuron, 5 as Rating, now)).toThrow(/Invalid rating/);
    });
  });
});
