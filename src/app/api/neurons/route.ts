import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import {
  advanceQueueItemToMastered,
  resolveCrystallizeQueueItemId,
} from '@/lib/crystallize/provenance';
import { inferPrerequisites, createPrerequisiteSynapses } from '@/lib/ai/inferPrerequisites';
import { projectGhostNodes } from '@/lib/ai/projectGhostNodes';

type SimilarNeuronRow = {
  id: string;
  title: string;
  similarity: number;
};

const createNeuronSchema = z.object({
  title: z.string().min(3).max(120),
  definition: z.string().min(10).max(280),
  core_insight: z.string().min(10).max(500),
  bloom_level: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
  source_conversation_id: z.uuid(),
  source_message_ids: z.array(z.string()).optional(),
  is_ghost: z.boolean().optional(),
  ghost_depth: z.number().int().optional().nullable(),
  ghost_target_title: z.string().optional().nullable(),
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

    const [{ data: neurons, error: neuronsError }, { data: synapses, error: synapsesError }] =
      await Promise.all([
        supabase
          .from('neurons')
          .select(
            'id, user_id, title, definition, core_insight, content, bloom_level, source_conversation_id, stability, difficulty, state, reps, lapses, elapsed_days, scheduled_days, retrievability, last_review, next_review_due, review_count, consecutive_correct, user_modified, modified_at, created_at, updated_at, is_ghost, ghost_depth, ghost_target_title'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('synapses').select('*').eq('user_id', user.id),
      ]);

    if (neuronsError || synapsesError) {
      return NextResponse.json(
        { error: neuronsError?.message ?? synapsesError?.message ?? 'Failed to load graph' },
        { status: 500 }
      );
    }

    return NextResponse.json({ neurons: neurons ?? [], synapses: synapses ?? [] });
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

    const parsed = createNeuronSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    // Bloom-level gate: reject shallow neurons from user conversations (per D-04)
    const NEUROGENESIS_BLOOM_THRESHOLD = ['Analyze', 'Evaluate', 'Create'] as const;
    if (!parsed.data.is_ghost && !(NEUROGENESIS_BLOOM_THRESHOLD as readonly string[]).includes(parsed.data.bloom_level)) {
      return NextResponse.json(
        {
          error: `Neurogenesis requires Analyze, Evaluate, or Create level understanding. ` +
                 `Received "${parsed.data.bloom_level}". Continue the conversation to reach deeper insight.`,
        },
        { status: 422 }
      );
    }

    const {
      source_message_ids: sourceMessageIds,
      ...neuronInput
    } = parsed.data;

    const forceNew = request.nextUrl.searchParams.get('force') === 'true';

    const embeddingInput = `${neuronInput.title} ${neuronInput.definition} ${neuronInput.core_insight}`;
    const embedding = await generateEmbedding(embeddingInput);

    if (!forceNew && !neuronInput.is_ghost) {
      const { checkNeuronCollision } = await import('@/lib/ai/bouncer');
      const collision = await checkNeuronCollision(embedding, 0.85);
      
      if (collision) {
        return NextResponse.json({
          type: 'collision',
          matchId: collision.id,
          matchTitle: collision.title,
          insightText: neuronInput.core_insight,
        }, { status: 409 });
      }
    }

    const now = new Date();
    const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('neurons')
      .insert({
        ...neuronInput,
        source_message_ids: sourceMessageIds ?? [],
        user_id: user.id,
        embedding: embedding,
        stability: 1.0,
        difficulty: 5.0,
        state: 'New',
        reps: 0,
        lapses: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        retrievability: 1.0,
        last_review: null,
        next_review_due: nextReview.toISOString(),
        review_count: 0,
        consecutive_correct: 0,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A neuron with this title already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const neuron = data;

    // ─── Post-insert enrichment (all non-fatal) ───
    let prerequisiteLinks: string[] = [];
    let projectedGhosts: { id: string; title: string }[] = [];
    let masteredQueueItemId: string | undefined;

    try {
      // Crystallize queue advancement
      const crystallizeQueueItemId = await resolveCrystallizeQueueItemId(
        supabase,
        neuron.source_conversation_id
      );

      if (crystallizeQueueItemId) {
        const masteryResult = await advanceQueueItemToMastered(supabase, crystallizeQueueItemId);
        if (masteryResult === 'mastered' || masteryResult === 'already_mastered') {
          masteredQueueItemId = crystallizeQueueItemId;
        }
      }

      // Vector search for prerequisite candidates
      const { data: similarNeurons, error: similarError } = await supabase.rpc('find_similar_neurons', {
        query_embedding: embedding,
        match_user_id: user.id,
        match_count: 10,
        match_threshold: 0.15,
      });

      if (similarError) {
        console.warn('[neurons/POST] find_similar_neurons failed (non-fatal):', similarError.message);
      } else {
        // Vector search results are used as candidates for the LLM prerequisite inference.
        // We no longer auto-create RELATED synapses from vector similarity — only the
        // Epistemological Inquisitor (inferPrerequisites) can create graph edges.
        const similarRows = ((similarNeurons ?? []) as SimilarNeuronRow[]).filter(
          (row) => row.id !== neuron.id
        );

        // AI Prerequisite Inference & Ghost Node Projection
        const candidateIds = similarRows.map(r => r.id);
        if (candidateIds.length > 0) {
          const { data: candidateNeurons } = await supabase
            .from('neurons')
            .select('id, title, definition')
            .in('id', candidateIds);

          if (candidateNeurons && candidateNeurons.length > 0) {
            const inferenceResult = await inferPrerequisites(
              { title: neuron.title, definition: parsed.data.definition, core_insight: parsed.data.core_insight },
              candidateNeurons
            );

            prerequisiteLinks = await createPrerequisiteSynapses(
              user.id, neuron.id, inferenceResult.prerequisites
            );

            if (inferenceResult.suggested_next && inferenceResult.suggested_next.length > 0) {
              projectedGhosts = await projectGhostNodes(
                user.id, neuron.id, inferenceResult.suggested_next, parsed.data.source_conversation_id
              );
            }
          }
        }
      }
    } catch (enrichmentError) {
      // Non-fatal: the neuron is already persisted. Log and return partial success.
      console.warn('[neurons/POST] Post-insert enrichment failed (non-fatal):', enrichmentError);
    }

    return NextResponse.json(
      {
        neuron,
        prerequisite_links: prerequisiteLinks,
        projected_ghosts: projectedGhosts,
        mastered_queue_item_id: masteredQueueItemId,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
