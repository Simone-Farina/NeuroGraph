import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateEmbedding } from '@/lib/ai/embeddings';
import type { PrerequisiteInferenceResult } from '@/lib/ai/inferPrerequisites';

/**
 * Projects ghost nodes into the graph as organic "next step" suggestions.
 * Called after a successful Neurogenesis when the AI suggests follow-up concepts.
 *
 * Ghost nodes are placeholder neurons with is_ghost=true and ghost_depth=1.
 * They appear as dashed-border nodes in the graph, inviting the user to learn next.
 */
export async function projectGhostNodes(
  userId: string,
  sourceNeuronId: string,
  suggestedNext: NonNullable<PrerequisiteInferenceResult['suggested_next']>,
  sourceConversationId: string,
): Promise<{ id: string; title: string }[]> {
  if (!suggestedNext || suggestedNext.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  const createdGhosts: { id: string; title: string }[] = [];

  for (const suggestion of suggestedNext.slice(0, 2)) {
    // Check if a neuron (real or ghost) with this title already exists
    const { data: existing } = await supabase
      .from('neurons')
      .select('id')
      .eq('user_id', userId)
      .eq('title', suggestion.title)
      .limit(1);

    if (existing && existing.length > 0) {
      continue; // Don't create duplicate ghost nodes
    }

    // Generate embedding for the ghost node
    const embedding = await generateEmbedding(suggestion.title);

    // Create the ghost neuron
    const { data: ghost, error } = await supabase
      .from('neurons')
      .insert({
        user_id: userId,
        title: suggestion.title,
        definition: `Suggested next concept after mastering related topics.`,
        core_insight: suggestion.reasoning,
        bloom_level: 'Remember',
        source_conversation_id: sourceConversationId,
        source_message_ids: [],
        embedding,
        is_ghost: true,
        ghost_depth: 1,
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
      console.error('[projectGhostNodes] Failed to create ghost node:', error);
      continue;
    }

    // Create a PREREQUISITE synapse: source neuron → ghost node
    // (the user must master the source before working on the ghost)
    await supabase
      .from('synapses')
      .insert({
        user_id: userId,
        source_neuron_id: sourceNeuronId,
        target_neuron_id: ghost.id,
        type: 'PREREQUISITE',
        weight: 0.7,
        ai_suggested: true,
      });

    createdGhosts.push({ id: ghost.id, title: ghost.title });
  }

  return createdGhosts;
}
