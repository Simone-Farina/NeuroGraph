import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject, NoObjectGeneratedError, APICallError } from 'ai';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { getModelForRole } from '@/lib/ai/providers';
import { buildTelemetry } from '@/lib/ai/tracing';

/**
 * POST /api/neurons/curriculum
 *
 * Generates a ghost curriculum path toward a learning target.
 * Creates a chain of ghost neurons in the database with appropriate depths.
 *
 * Example: "I want to learn Machine Learning" generates:
 *   [Machine Learning (Beacon, depth 0)]
 *     ← [Model Evaluation (fog, depth 2)]
 *       ← [Supervised Learning (fog, depth 2)]
 *         ← [Linear Regression (next step, depth 1)]
 */

const curriculumRequestSchema = z.object({
  target_title: z.string().min(3).max(120),
  depth: z.number().int().min(3).max(12).default(6),
});

const curriculumStepSchema = z.object({
  title: z.string().max(120),
  definition: z.string().max(280),
  reasoning: z.string().max(200),
});

const curriculumResponseSchema = z.object({
  steps: z.array(curriculumStepSchema).min(2).max(12),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = curriculumRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { target_title, depth } = parsed.data;

    // Check if target already exists as a neuron
    const { data: existingTarget } = await supabase
      .from('neurons')
      .select('id, is_ghost')
      .eq('user_id', user.id)
      .eq('title', target_title)
      .limit(1);

    if (existingTarget && existingTarget.length > 0 && !existingTarget[0].is_ghost) {
      return NextResponse.json(
        { error: 'Target already exists as a mastered neuron' },
        { status: 409 }
      );
    }

    // Fetch user's existing neurons for context
    const { data: existingNeurons } = await supabase
      .from('neurons')
      .select('title')
      .eq('user_id', user.id)
      .eq('is_ghost', false)
      .limit(50);

    const existingTitles = (existingNeurons ?? []).map((n) => n.title);

    // Generate the curriculum path via AI
    const model = getModelForRole('inquisitor');

    const { object } = await generateObject({
      model,
      schema: curriculumResponseSchema,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(25_000),
      experimental_telemetry: buildTelemetry('curriculum', {
        userId: user.id,
        extra: { target: target_title },
      }),
      system: `You are a pedagogical curriculum designer for NeuroGraph.
Your task is to create a learning path from the user's current knowledge to a target concept.

Rules:
- Create a strictly ordered prerequisite chain (each step depends on the previous)
- Start from the most foundational step the user likely needs (considering what they already know)
- End with the target concept as the LAST step
- Each step should be a specific, learnable concept (not vague categories)
- Skip concepts the user has already mastered
- The chain should follow a natural learning progression
- Aim for ${depth} steps total, but use fewer if the path is shorter`,
      prompt: `Target concept: "${target_title}"

The user already knows these concepts:
${existingTitles.length > 0 ? existingTitles.map((t) => `- ${t}`).join('\n') : '(No existing neurons — start from fundamentals)'}

Generate a prerequisite learning path to reach "${target_title}".
Order: most foundational first → target concept last.`,
    });

    // Create ghost neurons and link them as a chain
    const createdGhosts: { id: string; title: string; ghost_depth: number }[] = [];
    const totalSteps = object.steps.length;

    for (let i = 0; i < totalSteps; i++) {
      const step = object.steps[i];
      const isTarget = i === totalSteps - 1;
      // Depth calculation: target = 0, immediate = 1, fog = 2+
      // Reverse depth so the closest-to-user is depth 1 and the target is depth 0
      const ghostDepth = isTarget ? 0 : Math.min(totalSteps - 1 - i, 1) === 0 ? 2 : (i === 0 ? 1 : 2);

      // Check if this neuron already exists (real or ghost)
      const { data: existing } = await supabase
        .from('neurons')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', step.title)
        .limit(1);

      if (existing && existing.length > 0) {
        createdGhosts.push({
          id: existing[0].id,
          title: step.title,
          ghost_depth: ghostDepth,
        });
        continue;
      }

      const embedding = await generateEmbedding(step.title + ' ' + step.definition);

      const { data: ghost, error } = await supabase
        .from('neurons')
        .insert({
          user_id: user.id,
          title: step.title,
          definition: step.definition,
          core_insight: step.reasoning,
          bloom_level: 'Remember',
          source_conversation_id: '00000000-0000-0000-0000-000000000000', // system-generated
          source_message_ids: [],
          embedding,
          is_ghost: true,
          ghost_depth: ghostDepth,
          ghost_target_title: isTarget ? target_title : null,
          stability: 0,
          difficulty: 5.0,
          state: 'New',
          reps: 0,
          lapses: 0,
          elapsed_days: 0,
          scheduled_days: 0,
          retrievability: 0,
          last_review: null,
          next_review_due: new Date().toISOString(),
          review_count: 0,
          consecutive_correct: 0,
        })
        .select('id, title')
        .single();

      if (error) {
        console.error('[curriculum] Failed to create ghost:', error);
        continue;
      }

      createdGhosts.push({ id: ghost.id, title: ghost.title, ghost_depth: ghostDepth });
    }

    // Create PREREQUISITE synapse chain: step[0] → step[1] → ... → step[N-1]
    for (let i = 0; i < createdGhosts.length - 1; i++) {
      await supabase.from('synapses').upsert(
        {
          user_id: user.id,
          source_neuron_id: createdGhosts[i].id,
          target_neuron_id: createdGhosts[i + 1].id,
          type: 'PREREQUISITE',
          weight: 0.8,
          ai_suggested: true,
        },
        {
          onConflict: 'source_neuron_id,target_neuron_id,type',
          ignoreDuplicates: true,
        }
      );
    }

    // Also link the first ghost to any existing neurons that are its prerequisites
    // (connects the ghost path to the real graph)
    if (createdGhosts.length > 0 && existingNeurons && existingNeurons.length > 0) {
      // Find the most relevant existing neuron to connect to the first ghost
      const firstGhostEmbedding = await generateEmbedding(createdGhosts[0].title);
      const { data: nearest } = await supabase.rpc('find_similar_neurons', {
        query_embedding: firstGhostEmbedding,
        match_user_id: user.id,
        match_count: 1,
        match_threshold: 0.5,
      });

      if (nearest && nearest.length > 0 && nearest[0].id !== createdGhosts[0].id) {
        await supabase.from('synapses').upsert(
          {
            user_id: user.id,
            source_neuron_id: nearest[0].id,
            target_neuron_id: createdGhosts[0].id,
            type: 'PREREQUISITE',
            weight: 0.6,
            ai_suggested: true,
          },
          {
            onConflict: 'source_neuron_id,target_neuron_id,type',
            ignoreDuplicates: true,
          }
        );
      }
    }

    return NextResponse.json(
      {
        target: target_title,
        path: createdGhosts,
        total_steps: createdGhosts.length,
      },
      { status: 201 }
    );
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('[curriculum] NoObjectGeneratedError:', error);
      return NextResponse.json(
        { error: 'Could not generate a valid curriculum. Try a more specific topic.' },
        { status: 422 }
      );
    }
    if (APICallError.isInstance(error)) {
      console.error('[curriculum] APICallError:', error.statusCode, error.message);
      return NextResponse.json({ error: 'AI provider error' }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
