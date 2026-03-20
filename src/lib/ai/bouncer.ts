import { createServerSupabaseClient } from '@/lib/auth/supabase';

export type CollisionResult = {
  id: string;
  title: string;
  similarity: number;
} | null;

/**
 * Checks if a new insight exactly/closely matches an existing Neuron
 * using pgvector cosine similarity.
 * 
 * @param embedding The 1536-dimensional OpenAI vector for the new insight
 * @param similarityThreshold The minimum similarity to trigger a block (default 0.85)
 */
export async function checkNeuronCollision(
  embedding: number[],
  similarityThreshold = 0.85
): Promise<CollisionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized Bouncer Check');
  }

  // The DB RPC function uses `(1 - match_threshold)` as the > check.
  // E.g., if threshold is 0.85, we pass (1 - 0.85) = 0.15 as `match_threshold`.
  const matchThreshold = 1 - similarityThreshold;

  const { data, error } = await supabase.rpc('find_similar_neurons', {
    query_embedding: embedding as any,
    match_user_id: user.id,
    match_threshold: matchThreshold,
    match_count: 1, // We only care about the single highest collision
  });

  if (error) {
    console.error('Bouncer Vector DB Error:', error);
    return null;
  }

  if (data && data.length > 0) {
    // A collision was found that exceeds the 0.85 similarity
    return {
      id: data[0].id,
      title: data[0].title,
      similarity: data[0].similarity,
    };
  }

  return null;
}
