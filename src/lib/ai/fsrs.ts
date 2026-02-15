import { fsrs, FSRS, Card, Rating, State } from 'ts-fsrs';
import { Crystal } from '@/types/database';

// Initialize FSRS with default parameters (FSRS-6)
// These parameters work well for 90% of users without optimization
export const scheduler: FSRS = fsrs({
  request_retention: 0.9, // 90% retention
  maximum_interval: 36500, // Effectively unlimited (100 years)
  enable_short_term: true, // Allow same-day reviews
});

// Map database state string to FSRS State enum
function mapStateToFSRS(stateStr: string): State {
  switch (stateStr) {
    case 'New': return State.New;
    case 'Learning': return State.Learning;
    case 'Review': return State.Review;
    case 'Relearning': return State.Relearning;
    default: return State.New; // Fallback
  }
}

// Map FSRS State enum back to database string
function mapStateFromFSRS(state: State): 'New' | 'Learning' | 'Review' | 'Relearning' {
  switch (state) {
    case State.New: return 'New';
    case State.Learning: return 'Learning';
    case State.Review: return 'Review';
    case State.Relearning: return 'Relearning';
    default: return 'New';
  }
}

/**
 * Calculates the current retrievability of a crystal based on time elapsed since last review.
 * Used for UI visualization (decaying opacity/color).
 */
export function calculateRetrievability(crystal: Crystal, now: Date = new Date()): number {
  if (crystal.stability === 0) return 1.0;
  if (!crystal.last_review || crystal.state === 'New') return 1.0;
  
  const lastReviewDate = new Date(crystal.last_review);
  const elapsedDays = (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // FSRS-6 formula: R = (1 + factor * t / S) ^ -w20
  // w20 default is 0.1542
  const w20 = 0.1542; 
  const factor = Math.pow(0.9, -1 / w20) - 1;
  
  return Math.pow(1 + factor * elapsedDays / crystal.stability, -w20);
}

/**
 * Schedules the next review for a crystal based on user rating.
 * Returns the updated fields to be saved to the database.
 */
export function scheduleReview(crystal: Crystal, rating: Rating, now: Date = new Date()) {
  // 1. Construct the FSRS Card object from crystal data
  const card: Card = {
    due: new Date(crystal.next_review_due),
    stability: crystal.stability,
    difficulty: crystal.difficulty,
    elapsed_days: crystal.elapsed_days,
    scheduled_days: crystal.scheduled_days,
    reps: crystal.reps,
    lapses: crystal.lapses,
    state: mapStateToFSRS(crystal.state),
    last_review: crystal.last_review ? new Date(crystal.last_review) : undefined,
    learning_steps: 0, // Not persisted in DB yet, defaulted
  };

  // 2. Calculate the new schedule
  const result = scheduler.repeat(card, now);
  
  // 3. Get the specific log for the chosen rating
  // Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
  const scheduleLog = result[rating]; 
  
  if (!scheduleLog) {
    throw new Error(`Invalid rating: ${rating}. Must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).`);
  }

  const newCard = scheduleLog.card;

  // 4. Return updated fields
  return {
    stability: newCard.stability,
    difficulty: newCard.difficulty,
    elapsed_days: newCard.elapsed_days,
    scheduled_days: newCard.scheduled_days,
    reps: newCard.reps,
    lapses: newCard.lapses,
    state: mapStateFromFSRS(newCard.state),
    next_review_due: newCard.due.toISOString(),
    last_review: now.toISOString(),
    retrievability: calculateRetrievability({
        ...crystal,
        last_review: now.toISOString(),
        stability: newCard.stability
    }, now) // Should be ~1.0 immediately after review
  };
}
