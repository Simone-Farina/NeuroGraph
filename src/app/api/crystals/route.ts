import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import type { Database } from '@/types/database';

type SimilarCrystalRow = {
  id: string;
  title: string;
  similarity: number;
};

type EdgeType = Database['public']['Tables']['crystal_edges']['Row']['type'];
type EdgeInsert = Database['public']['Tables']['crystal_edges']['Insert'];
type EdgeRow = Database['public']['Tables']['crystal_edges']['Row'];

type EdgeSuggestion = {
  source_crystal_id: string;
  target_crystal_id: string;
  target_title: string;
  type: EdgeType;
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

function edgeKey(sourceCrystalId: string, targetCrystalId: string, type: EdgeType) {
  return `${sourceCrystalId}:${targetCrystalId}:${type}`;
}

const relatedCrystalSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(120).optional(),
  relationship_type: z.enum(['PREREQUISITE', 'RELATED', 'BUILDS_ON']),
});

const createCrystalSchema = z.object({
  title: z.string().min(3).max(120),
  definition: z.string().min(10).max(280),
  core_insight: z.string().min(10).max(500),
  bloom_level: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
  source_conversation_id: z.uuid(),
  source_message_ids: z.array(z.string()).optional(),
  related_crystals: z.array(relatedCrystalSchema).max(5).optional(),
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
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { related_crystals: relatedCrystalsInput = [], source_message_ids: _sourceMessageIds, ...crystalInput } = parsed.data;

    const now = new Date();
    const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const embeddingInput = `${crystalInput.title} ${crystalInput.definition} ${crystalInput.core_insight}`;
    const embedding = await generateEmbedding(embeddingInput);

    const { data: crystal, error } = await supabase
      .from('crystals')
      .insert({
        ...crystalInput,
        user_id: user.id,
        embedding,
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { count } = await supabase
      .from('crystals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('embedding', 'is', null);

    const { data: similarCrystals, error: similarError } = await supabase.rpc('find_similar_crystals', {
      query_embedding: embedding,
      match_user_id: user.id,
      match_count: 5,
      match_threshold: 0.3,
    });

    if (similarError) {
      return NextResponse.json({ error: similarError.message }, { status: 500 });
    }

    const similarRows = ((similarCrystals ?? []) as SimilarCrystalRow[]).filter(
      (row) => row.id !== crystal.id
    );

    const highConfidenceEdgeInserts: EdgeInsert[] = [];
    const autoEdgeKeys = new Set<string>();
    const mediumSuggestionsByKey = new Map<string, EdgeSuggestion>();

    similarRows.forEach((row) => {
      const distance = 1 - row.similarity;
      const type: EdgeType = 'RELATED';
      const key = edgeKey(crystal.id, row.id, type);
      const weight = clampWeight(row.similarity);

      if (distance < HIGH_CONFIDENCE_DISTANCE_THRESHOLD) {
        highConfidenceEdgeInserts.push({
          user_id: user.id,
          source_crystal_id: crystal.id,
          target_crystal_id: row.id,
          type,
          weight,
          ai_suggested: true,
        });
        autoEdgeKeys.add(key);
        return;
      }

      if (distance >= HIGH_CONFIDENCE_DISTANCE_THRESHOLD && distance < MEDIUM_CONFIDENCE_DISTANCE_THRESHOLD) {
        mediumSuggestionsByKey.set(key, {
          source_crystal_id: crystal.id,
          target_crystal_id: row.id,
          target_title: row.title,
          type,
          weight,
          confidence: 'medium',
          source: 'vector',
        });
      }
    });

    if (relatedCrystalsInput.length > 0) {
      const requestedTargetIds = Array.from(
        new Set(relatedCrystalsInput.map((item) => item.id))
      ).filter((id) => id !== crystal.id);

      let validTargets = new Map<string, { id: string; title: string }>();

      if (requestedTargetIds.length > 0) {
        const { data: relatedTargets, error: relatedTargetsError } = await supabase
          .from('crystals')
          .select('id, title')
          .eq('user_id', user.id)
          .in('id', requestedTargetIds);

        if (relatedTargetsError) {
          return NextResponse.json({ error: relatedTargetsError.message }, { status: 500 });
        }

        validTargets = new Map((relatedTargets ?? []).map((target) => [target.id, target]));
      }

      relatedCrystalsInput.forEach((related) => {
        const target = validTargets.get(related.id);
        if (!target) return;

        const key = edgeKey(crystal.id, target.id, related.relationship_type);
        if (autoEdgeKeys.has(key)) return;

        const nextSuggestion: EdgeSuggestion = {
          source_crystal_id: crystal.id,
          target_crystal_id: target.id,
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

    let createdEdges: EdgeRow[] = [];

    if (highConfidenceEdgeInserts.length > 0) {
      const { data: insertedEdges, error: edgesError } = await supabase
        .from('crystal_edges')
        .upsert(highConfidenceEdgeInserts, {
          onConflict: 'source_crystal_id,target_crystal_id,type',
          ignoreDuplicates: true,
        })
        .select('*');

      if (edgesError) {
        return NextResponse.json({ error: edgesError.message }, { status: 500 });
      }

      createdEdges = insertedEdges ?? [];
    }

    const mediumSuggestions = Array.from(mediumSuggestionsByKey.values());
    let edgeSuggestions = mediumSuggestions;

    if (mediumSuggestions.length > 0) {
      const targetIds = Array.from(
        new Set(mediumSuggestions.map((suggestion) => suggestion.target_crystal_id))
      );

      const { data: existingEdges, error: existingEdgesError } = await supabase
        .from('crystal_edges')
        .select('source_crystal_id, target_crystal_id, type')
        .eq('user_id', user.id)
        .eq('source_crystal_id', crystal.id)
        .in('target_crystal_id', targetIds);

      if (existingEdgesError) {
        return NextResponse.json({ error: existingEdgesError.message }, { status: 500 });
      }

      const existingEdgeKeys = new Set(
        (existingEdges ?? []).map((edge) =>
          edgeKey(edge.source_crystal_id, edge.target_crystal_id, edge.type as EdgeType)
        )
      );

      edgeSuggestions = mediumSuggestions.filter(
        (suggestion) =>
          !existingEdgeKeys.has(
            edgeKey(suggestion.source_crystal_id, suggestion.target_crystal_id, suggestion.type)
          )
      );
    }

    return NextResponse.json({ crystal, edges: createdEdges, edge_suggestions: edgeSuggestions }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
