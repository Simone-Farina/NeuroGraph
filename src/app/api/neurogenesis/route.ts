import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedUser } from '@/lib/auth/server';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { synthesize } from '@/lib/ai/synthesizer';
import { inferPrerequisites, createPrerequisiteSynapses } from '@/lib/ai/inferPrerequisites';
import { observe, buildTelemetry, langfuseProcessor } from '@/lib/ai/tracing';

// ─── Request schema ────────────────────────────────────────────────────────────

const neurogenesisRequestSchema = z.object({
  conversationId: z.string().uuid(),
});

type SimilarNeuronRow = {
  id: string;
  title: string;
  similarity: number;
};

// ─── POST /api/neurogenesis ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    // ── Request validation ────────────────────────────────────────────────────
    const parsed = neurogenesisRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { conversationId } = parsed.data;

    // ── Pipeline (wrapped in parent Langfuse span) ────────────────────────────
    // observe() is a HOF decorator: observe(fn, options?) returns a wrapped fn
    const pipeline = observe(
      async () => {
        // ── Step 1: Fetch messages server-side ──────────────────────────────
        const { data: rawMessages, error: messagesError } = await supabase
          .from('messages')
          .select('id, role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          throw new Error(`Failed to fetch messages: ${messagesError.message}`);
        }

        const messages = (rawMessages ?? []).filter(
          (m) => m.role === 'user' || m.role === 'assistant'
        );

        if (messages.length === 0) {
          throw Object.assign(new Error('No messages found for this conversation'), {
            status: 400,
          });
        }

        // ── Step 2: Synthesizer (fatal on failure) ──────────────────────────
        // synthesize() has its own 'neurogenesis-synthesizer' Langfuse span
        const synthesis = await synthesize(messages, user.id);

        // ── Step 3: Embedding + RAG (non-fatal) ─────────────────────────────
        const embeddingInput = `${synthesis.title} ${synthesis.definition} ${synthesis.core_insight}`;
        const embedding = await generateEmbedding(embeddingInput);

        let candidateNeurons: { id: string; title: string; definition: string }[] = [];

        try {
          const { data: similarNeurons, error: ragError } = await supabase.rpc(
            'find_similar_neurons',
            {
              query_embedding: embedding,
              match_user_id: user.id,
              match_count: 10,
              match_threshold: 0.15,
            }
          );

          if (ragError) {
            console.warn('[neurogenesis] find_similar_neurons failed (non-fatal):', ragError.message);
          } else {
            const similarRows = ((similarNeurons ?? []) as SimilarNeuronRow[]);

            if (similarRows.length > 0) {
              const candidateIds = similarRows.map((r) => r.id);
              const { data: fetched } = await supabase
                .from('neurons')
                .select('id, title, definition')
                .in('id', candidateIds);

              candidateNeurons = (fetched ?? []) as { id: string; title: string; definition: string }[];
            }
          }
        } catch (ragErr) {
          console.warn('[neurogenesis] RAG step failed (non-fatal):', ragErr);
        }

        // ── Step 4: Insert neuron ────────────────────────────────────────────
        const now = new Date();
        const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const { data: neuronData, error: insertError } = await supabase
          .from('neurons')
          .insert({
            title: synthesis.title,
            definition: synthesis.definition,
            core_insight: synthesis.core_insight,
            bloom_level: 'Analyze',
            source_conversation_id: conversationId,
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

        if (insertError) {
          if (insertError.code === '23505') {
            throw Object.assign(new Error('A neuron with this title already exists'), {
              status: 409,
            });
          }
          throw new Error(`Failed to insert neuron: ${insertError.message}`);
        }

        const neuron = neuronData!;

        // ── Step 5: Inquisitor (non-fatal) ───────────────────────────────────
        // inferPrerequisites() has its own 'inquisitor' Langfuse span
        let synapses: unknown[] = [];

        try {
          if (candidateNeurons.length > 0) {
            const inferenceResult = await inferPrerequisites(synthesis, candidateNeurons, user.id);

            if (inferenceResult.prerequisites.length > 0) {
              await createPrerequisiteSynapses(user.id, neuron.id, inferenceResult.prerequisites);

              // Fetch full synapse records for the graph update
              const { data: synapseData } = await supabase
                .from('synapses')
                .select('*')
                .eq('target_neuron_id', neuron.id);

              synapses = synapseData ?? [];
            }
          }
        } catch (inquisitorErr) {
          console.warn('[neurogenesis] Inquisitor step failed (non-fatal):', inquisitorErr);
        }

        return { neuron, synapses };
      },
      { name: 'neurogenesis-pipeline' }
    );

    const result = await pipeline();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status =
      error instanceof Error && 'status' in error
        ? (error as Error & { status: number }).status
        : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status });
  } finally {
    // Flush Langfuse telemetry before function exits (matches bloom-evaluate pattern)
    try {
      await langfuseProcessor.forceFlush();
    } catch {
      // Flush failure is non-fatal
    }
  }
}
