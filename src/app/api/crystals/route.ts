import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/server';
import { createCrystal, createCrystalSchema, processCrystalEdges } from '@/lib/crystals';
import { createServerSupabaseClient } from '@/lib/auth/supabase';

export async function GET() {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    const [{ data: crystals, error: crystalsError }, { data: edges, error: edgesError }] =
      await Promise.all([
        supabase
          .from('crystals')
          .select('id, user_id, title, definition, core_insight, bloom_level, source_conversation_id, stability, difficulty, state, reps, lapses, elapsed_days, scheduled_days, retrievability, last_review, next_review_due, review_count, consecutive_correct, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('crystal_edges').select('*').eq('user_id', user.id),
      ]);

    if (crystalsError || edgesError) {
      return NextResponse.json(
        { error: crystalsError?.message ?? edgesError?.message ?? 'Failed to load graph' },
        { status: 500 }
      );
    }

    return NextResponse.json({ crystals: crystals ?? [], edges: edges ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    const parsed = createCrystalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { related_crystals: relatedCrystalsInput = [], ...crystalInput } = parsed.data;

    const crystal = await createCrystal(supabase, user.id, crystalInput);

    const { createdEdges, edgeSuggestions } = await processCrystalEdges(
      supabase,
      user.id,
      crystal,
      relatedCrystalsInput
    );

    return NextResponse.json({ crystal, edges: createdEdges, edge_suggestions: edgeSuggestions }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
