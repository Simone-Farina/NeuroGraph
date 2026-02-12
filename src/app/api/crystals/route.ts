import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';

const createCrystalSchema = z.object({
  title: z.string().min(3).max(120),
  definition: z.string().min(10).max(280),
  core_insight: z.string().min(10).max(500),
  bloom_level: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
  source_conversation_id: z.string().uuid(),
  source_message_ids: z.array(z.string().uuid()).min(1),
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: crystals, error: crystalsError }, { data: edges, error: edgesError }] =
      await Promise.all([
        supabase
          .from('crystals')
          .select('*')
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
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = createCrystalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const now = new Date();
    const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('crystals')
      .insert({
        ...parsed.data,
        user_id: user.id,
        embedding: null,
        stability: 1,
        ease_factor: 2.5,
        retrievability: 1,
        last_review: null,
        next_review_due: nextReview.toISOString(),
        review_count: 0,
        consecutive_correct: 0,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ crystal: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
