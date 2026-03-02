import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import type { Database } from '@/types/database';

type SimilarNeuronRow = {
  id: string;
  title: string;
  similarity: number;
};

type SynapseType = Database['public']['Tables']['synapses']['Row']['type'];
type SynapseInsert = Database['public']['Tables']['synapses']['Insert'];
type SynapseRow = Database['public']['Tables']['synapses']['Row'];

type SynapseSuggestion = {
  source_neuron_id: string;
  target_neuron_id: string;
  target_title: string;
  type: SynapseType;
  weight: number;
  confidence: 'medium';
  source: 'vector' | 'ai';
};

const HIGH_CONFIDENCE_DISTANCE_THRESHOLD = 0.2;
const MEDIUM_CONFIDENCE_DISTANCE_THRESHOLD = 0.3;
const AI_SUGGESTION_WEIGHT = 0.72;

function clampWeight(value: number) {
  return Math.max(0, Math.min(1, value));
}

function synapseKey(sourceNeuronId: string, targetNeuronId: string, type: SynapseType) {
  return `${sourceNeuronId}:${targetNeuronId}:${type}`;
}

const relatedNeuronSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(120).optional(),
  relationship_type: z.enum(['PREREQUISITE', 'RELATED', 'BUILDS_ON']),
});

const createNeuronSchema = z.object({
  title: z.string().min(3).max(120),
  definition: z.string().min(10).max(280),
  core_insight: z.string().min(10).max(500),
  bloom_level: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
  source_conversation_id: z.uuid(),
  source_message_ids: z.array(z.string()).optional(),
  related_neurons: z.array(relatedNeuronSchema).max(5).optional(),
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
            'id, user_id, title, definition, core_insight, content, bloom_level, source_conversation_id, stability, difficulty, state, reps, lapses, elapsed_days, scheduled_days, retrievability, last_review, next_review_due, review_count, consecutive_correct, user_modified, modified_at, created_at, updated_at'
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

    const {
      related_neurons: relatedNeuronsInput = [],
      source_message_ids: sourceMessageIds,
      ...neuronInput
    } = parsed.data;

    const now = new Date();
    const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('neurons')
      .insert({
        ...neuronInput,
        source_message_ids: sourceMessageIds ?? [],
        user_id: user.id,
        embedding: null,
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

    const embeddingInput = `${data.title} ${data.definition} ${data.core_insight}`;
    const embedding = await generateEmbedding(embeddingInput);

    const { data: neuron, error: embeddingUpdateError } = await supabase
      .from('neurons')
      .update({ embedding })
      .eq('id', data.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (embeddingUpdateError) {
      return NextResponse.json({ error: embeddingUpdateError.message }, { status: 500 });
    }

    const { count } = await supabase
      .from('neurons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('embedding', 'is', null);

    const { data: similarNeurons, error: similarError } = await supabase.rpc('find_similar_neurons', {
      query_embedding: embedding,
      match_user_id: user.id,
      match_count: 5,
      match_threshold: 0.3,
    });

    if (similarError) {
      return NextResponse.json({ error: similarError.message }, { status: 500 });
    }

    const similarRows = ((similarNeurons ?? []) as SimilarNeuronRow[]).filter(
      (row) => row.id !== neuron.id
    );

    const highConfidenceSynapseInserts: SynapseInsert[] = [];
    const autoSynapseKeys = new Set<string>();
    const mediumSuggestionsByKey = new Map<string, SynapseSuggestion>();

    similarRows.forEach((row) => {
      const distance = 1 - row.similarity;
      const type: SynapseType = 'RELATED';
      const key = synapseKey(neuron.id, row.id, type);
      const weight = clampWeight(row.similarity);

      if (distance < HIGH_CONFIDENCE_DISTANCE_THRESHOLD) {
        highConfidenceSynapseInserts.push({
          user_id: user.id,
          source_neuron_id: neuron.id,
          target_neuron_id: row.id,
          type,
          weight,
          ai_suggested: true,
        });
        autoSynapseKeys.add(key);
        return;
      }

      if (distance >= HIGH_CONFIDENCE_DISTANCE_THRESHOLD && distance < MEDIUM_CONFIDENCE_DISTANCE_THRESHOLD) {
        mediumSuggestionsByKey.set(key, {
          source_neuron_id: neuron.id,
          target_neuron_id: row.id,
          target_title: row.title,
          type,
          weight,
          confidence: 'medium',
          source: 'vector',
        });
      }
    });

    if (relatedNeuronsInput.length > 0) {
      const requestedTargetIds = Array.from(
        new Set(relatedNeuronsInput.map((item) => item.id))
      ).filter((id) => id !== neuron.id);

      let validTargets = new Map<string, { id: string; title: string }>();

      if (requestedTargetIds.length > 0) {
        const { data: relatedTargets, error: relatedTargetsError } = await supabase
          .from('neurons')
          .select('id, title')
          .eq('user_id', user.id)
          .in('id', requestedTargetIds);

        if (relatedTargetsError) {
          return NextResponse.json({ error: relatedTargetsError.message }, { status: 500 });
        }

        validTargets = new Map((relatedTargets ?? []).map((target) => [target.id, target]));
      }

      relatedNeuronsInput.forEach((related) => {
        const target = validTargets.get(related.id);
        if (!target) return;

        const key = synapseKey(neuron.id, target.id, related.relationship_type);
        if (autoSynapseKeys.has(key)) return;

        const nextSuggestion: SynapseSuggestion = {
          source_neuron_id: neuron.id,
          target_neuron_id: target.id,
          target_title: target.title,
          type: related.relationship_type,
          weight: AI_SUGGESTION_WEIGHT,
          confidence: 'medium',
          source: 'ai',
        };

        const existing = mediumSuggestionsByKey.get(key);
        if (!existing || existing.source === 'vector') {
          mediumSuggestionsByKey.set(key, nextSuggestion);
        }
      });
    }

    let createdSynapses: SynapseRow[] = [];

    if (highConfidenceSynapseInserts.length > 0) {
      const { data: insertedSynapses, error: synapsesError } = await supabase
        .from('synapses')
        .upsert(highConfidenceSynapseInserts, {
          onConflict: 'source_neuron_id,target_neuron_id,type',
          ignoreDuplicates: true,
        })
        .select('*');

      if (synapsesError) {
        return NextResponse.json({ error: synapsesError.message }, { status: 500 });
      }

      createdSynapses = insertedSynapses ?? [];
    }

    const mediumSuggestions = Array.from(mediumSuggestionsByKey.values());
    let synapseSuggestions = mediumSuggestions;

    if (mediumSuggestions.length > 0) {
      const targetIds = Array.from(
        new Set(mediumSuggestions.map((suggestion) => suggestion.target_neuron_id))
      );

      const { data: existingSynapses, error: existingSynapsesError } = await supabase
        .from('synapses')
        .select('source_neuron_id, target_neuron_id, type')
        .eq('user_id', user.id)
        .eq('source_neuron_id', neuron.id)
        .in('target_neuron_id', targetIds);

      if (existingSynapsesError) {
        return NextResponse.json({ error: existingSynapsesError.message }, { status: 500 });
      }

      const existingSynapseKeys = new Set(
        (existingSynapses ?? []).map((synapse) =>
          synapseKey(synapse.source_neuron_id, synapse.target_neuron_id, synapse.type as SynapseType)
        )
      );

      synapseSuggestions = mediumSuggestions.filter(
        (suggestion) =>
          !existingSynapseKeys.has(
            synapseKey(suggestion.source_neuron_id, suggestion.target_neuron_id, suggestion.type)
          )
      );
    }

    return NextResponse.json(
      { neuron, synapses: createdSynapses, synapse_suggestions: synapseSuggestions },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
