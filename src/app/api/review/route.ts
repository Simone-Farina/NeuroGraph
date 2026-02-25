import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Card, Rating } from 'ts-fsrs';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { neuronQueries } from '@/lib/db/queries';
import { scheduleReview, scheduler, mapStateToFSRS } from '@/lib/ai/fsrs';

const reviewSchema = z.object({
  neuronId: z.string().uuid(),
  rating: z.number().int().min(1).max(4),
});

function formatInterval(date: Date, now: Date): string {
  const diff = date.getTime() - now.getTime();
  const minutes = Math.max(1, Math.round(diff / (1000 * 60)));
  const hours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days / 365)}y`;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const neurons = await neuronQueries.getDueForReview(supabase, user.id);
    const now = new Date();

    const reviewsWithIntervals = (neurons || []).map((neuron) => {
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

      const schedule = scheduler.repeat(card, now);

      const intervals = {
        1: formatInterval(schedule[Rating.Again].card.due, now),
        2: formatInterval(schedule[Rating.Hard].card.due, now),
        3: formatInterval(schedule[Rating.Good].card.due, now),
        4: formatInterval(schedule[Rating.Easy].card.due, now),
      };

      return {
        ...neuron,
        intervals,
      };
    });

    return NextResponse.json({ reviews: reviewsWithIntervals });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('Review fetch error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = reviewSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { neuronId, rating } = parsed.data;
    const neuron = await neuronQueries.getById(supabase, neuronId);

    if (!neuron) {
      return NextResponse.json({ error: 'Neuron not found' }, { status: 404 });
    }

    if (neuron.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const fsrsRating = rating as Rating;
    const updates = scheduleReview(neuron, fsrsRating);
    const isCorrect = fsrsRating >= Rating.Hard;

    const finalUpdates = {
      ...updates,
      review_count: neuron.review_count + 1,
      consecutive_correct: isCorrect ? neuron.consecutive_correct + 1 : 0,
    };

    const updatedNeuron = await neuronQueries.update(supabase, neuron.id, finalUpdates);

    return NextResponse.json({ neuron: updatedNeuron });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('Review error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
