import { fsrs, FSRS, Card, Rating, State } from 'ts-fsrs';

import { Neuron } from '@/types/database';

export const scheduler: FSRS = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_short_term: true,
});

export function mapStateToFSRS(stateStr: string): State {
  switch (stateStr) {
    case 'New':
      return State.New;
    case 'Learning':
      return State.Learning;
    case 'Review':
      return State.Review;
    case 'Relearning':
      return State.Relearning;
    default:
      return State.New;
  }
}

function mapStateFromFSRS(state: State): 'New' | 'Learning' | 'Review' | 'Relearning' {
  switch (state) {
    case State.New:
      return 'New';
    case State.Learning:
      return 'Learning';
    case State.Review:
      return 'Review';
    case State.Relearning:
      return 'Relearning';
    default:
      return 'New';
  }
}

export function calculateRetrievability(neuron: Neuron, now: Date = new Date()): number {
  if (neuron.stability === 0) return 1.0;
  if (!neuron.last_review || neuron.state === 'New') return 1.0;

  const lastReviewDate = new Date(neuron.last_review);
  const elapsedDays = (now.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24);

  const w20 = 0.1542;
  const factor = Math.pow(0.9, -1 / w20) - 1;

  return Math.pow(1 + (factor * elapsedDays) / neuron.stability, -w20);
}

export function scheduleReview(neuron: Neuron, rating: Rating, now: Date = new Date()) {
  const card: Card = {
    due: new Date(neuron.next_review_due),
    stability: neuron.stability,
    difficulty: neuron.difficulty,
    elapsed_days: neuron.elapsed_days,
    scheduled_days: neuron.scheduled_days,
    reps: neuron.reps,
    lapses: neuron.lapses,
    state: mapStateToFSRS(neuron.state),
    last_review: neuron.last_review ? new Date(neuron.last_review) : undefined,
    learning_steps: 0,
  };

  const result = scheduler.repeat(card, now);
  const scheduleLog = result[rating];

  if (!scheduleLog) {
    throw new Error(`Invalid rating: ${rating}. Must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).`);
  }

  const newCard = scheduleLog.card;

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
    retrievability: calculateRetrievability(
      {
        ...neuron,
        last_review: now.toISOString(),
        stability: newCard.stability,
      },
      now
    ),
  };
}
