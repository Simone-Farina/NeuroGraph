import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { edgeQueries } from '@/lib/db/queries';

// --- Types ---

export type EdgeType = Database['public']['Tables']['crystal_edges']['Row']['type'];
export type EdgeInsert = Database['public']['Tables']['crystal_edges']['Insert'];
export type EdgeRow = Database['public']['Tables']['crystal_edges']['Row'];
export type CrystalRow = Database['public']['Tables']['crystals']['Row'];

export type EdgeSuggestion = {
  source_crystal_id: string;
  target_crystal_id: string;
  target_title: string;
  type: EdgeType;
  weight: number;
  confidence: 'medium';
  source: 'vector' | 'ai';
};

type SimilarCrystalRow = {
  id: string;
  title: string;
  similarity: number;
};

// --- Constants ---

const HIGH_CONFIDENCE_DISTANCE_THRESHOLD = 0.2;
const MEDIUM_CONFIDENCE_DISTANCE_THRESHOLD = 0.3;
const AI_SUGGESTION_WEIGHT = 0.72;

// --- Schemas ---

export const relatedCrystalSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(120).optional(),
  relationship_type: z.enum(['PREREQUISITE', 'RELATED', 'BUILDS_ON']),
});

export const createCrystalSchema = z.object({
  title: z.string().min(3).max(120),
  definition: z.string().min(10).max(280),
  core_insight: z.string().min(10).max(500),
  bloom_level: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']),
  source_conversation_id: z.uuid(),
  source_message_ids: z.array(z.string()).optional(),
  related_crystals: z.array(relatedCrystalSchema).max(5).optional(),
});

export type CreateCrystalInput = z.infer<typeof createCrystalSchema>;

// --- Helper Functions ---

export function clampWeight(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function edgeKey(sourceCrystalId: string, targetCrystalId: string, type: EdgeType) {
  return `${sourceCrystalId}:${targetCrystalId}:${type}`;
}

// --- Main Logic ---

export async function createCrystal(
  client: SupabaseClient<Database>,
  userId: string,
  input: Omit<CreateCrystalInput, 'related_crystals'>
) {
  const now = new Date();
  const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await client
    .from('crystals')
    .insert({
      ...input,
      user_id: userId,
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

  if (error) throw error;

  const embeddingInput = `${data.title} ${data.definition} ${data.core_insight}`;
  const embedding = await generateEmbedding(embeddingInput);

  const { data: crystal, error: embeddingUpdateError } = await client
    .from('crystals')
    .update({ embedding })
    .eq('id', data.id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (embeddingUpdateError) throw embeddingUpdateError;

  return crystal;
}

export async function processCrystalEdges(
  client: SupabaseClient<Database>,
  userId: string,
  crystal: CrystalRow,
  relatedCrystalsInput: z.infer<typeof relatedCrystalSchema>[]
) {
  // Find similar crystals
  const { data: similarCrystals, error: similarError } = await client.rpc('find_similar_crystals', {
    query_embedding: crystal.embedding!,
    match_user_id: userId,
    match_count: 5,
    match_threshold: 0.3,
  });

  if (similarError) throw similarError;

  const similarRows = ((similarCrystals ?? []) as SimilarCrystalRow[]).filter(
    (row) => row.id !== crystal.id
  );

  const highConfidenceEdgeInserts: EdgeInsert[] = [];
  const autoEdgeKeys = new Set<string>();
  const mediumSuggestionsByKey = new Map<string, EdgeSuggestion>();

  // Process vector similarities
  similarRows.forEach((row) => {
    const distance = 1 - row.similarity;
    const type: EdgeType = 'RELATED';
    const key = edgeKey(crystal.id, row.id, type);
    const weight = clampWeight(row.similarity);

    if (distance < HIGH_CONFIDENCE_DISTANCE_THRESHOLD) {
      highConfidenceEdgeInserts.push({
        user_id: userId,
        source_crystal_id: crystal.id,
        target_crystal_id: row.id,
        type,
        weight,
        ai_suggested: true,
      });
      autoEdgeKeys.add(key);
      return;
    }

    if (
      distance >= HIGH_CONFIDENCE_DISTANCE_THRESHOLD &&
      distance < MEDIUM_CONFIDENCE_DISTANCE_THRESHOLD
    ) {
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

  // Process manual related crystals
  if (relatedCrystalsInput.length > 0) {
    const requestedTargetIds = Array.from(
      new Set(relatedCrystalsInput.map((item) => item.id))
    ).filter((id) => id !== crystal.id);

    let validTargets = new Map<string, { id: string; title: string }>();

    if (requestedTargetIds.length > 0) {
      const { data: relatedTargets, error: relatedTargetsError } = await client
        .from('crystals')
        .select('id, title')
        .eq('user_id', userId)
        .in('id', requestedTargetIds);

      if (relatedTargetsError) throw relatedTargetsError;

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

  // Insert high confidence edges
  let createdEdges: EdgeRow[] = [];
  if (highConfidenceEdgeInserts.length > 0) {
    createdEdges = await edgeQueries.upsert(client, highConfidenceEdgeInserts);
  }

  // Filter existing suggestions
  const mediumSuggestions = Array.from(mediumSuggestionsByKey.values());
  let edgeSuggestions = mediumSuggestions;

  if (mediumSuggestions.length > 0) {
    const targetIds = Array.from(
      new Set(mediumSuggestions.map((suggestion) => suggestion.target_crystal_id))
    );

    const { data: existingEdges, error: existingEdgesError } = await client
      .from('crystal_edges')
      .select('source_crystal_id, target_crystal_id, type')
      .eq('user_id', userId)
      .eq('source_crystal_id', crystal.id)
      .in('target_crystal_id', targetIds);

    if (existingEdgesError) throw existingEdgesError;

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

  return { createdEdges, edgeSuggestions };
}
