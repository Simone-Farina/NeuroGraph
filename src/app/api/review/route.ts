import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Card, Rating, State } from 'ts-fsrs';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { crystalQueries } from '@/lib/db/queries';
import { scheduleReview, scheduler, mapStateToFSRS } from '@/lib/ai/fsrs';

// Schema for the review submission
const reviewSchema = z.object({
  crystalId: z.string().uuid(),
  rating: z.number().int().min(1).max(4), // 1=Again, 2=Hard, 3=Good, 4=Easy
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

    const crystals = await crystalQueries.getDueForReview(supabase, user.id);

    const now = new Date();

    const reviewsWithIntervals = (crystals || []).map((crystal) => {
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
        ...crystal,
        intervals,
      };
    });

    return NextResponse.json({ reviews: reviewsWithIntervals });
  } catch (error) {
    console.error('Review fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
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

    const { crystalId, rating } = parsed.data;

    // 1. Fetch the crystal
    const crystal = await crystalQueries.getById(supabase, crystalId);

    if (!crystal) {
      return NextResponse.json({ error: 'Crystal not found' }, { status: 404 });
    }

    if (crystal.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Calculate the new schedule using FSRS
    // We cast the rating to the specific Rating enum type (safe due to zod validation)
    const fsrsRating = rating as Rating;
    const updates = scheduleReview(crystal, fsrsRating);

    // 3. Update the crystal in the database
    // We also increment review_count and update consecutive_correct for stats
    const isCorrect = fsrsRating >= Rating.Hard; // Hard, Good, Easy count as correct
    
    const finalUpdates = {
      ...updates,
      review_count: crystal.review_count + 1,
      consecutive_correct: isCorrect ? crystal.consecutive_correct + 1 : 0,
    };

    const updatedCrystal = await crystalQueries.update(supabase, crystal.id, finalUpdates);

    return NextResponse.json({ crystal: updatedCrystal });
  } catch (error) {
    console.error('Review error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
