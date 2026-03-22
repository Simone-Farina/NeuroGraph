import type { SupabaseClient } from '@supabase/supabase-js';

import { queueQueries } from '@/lib/db/queueQueries';
import type { Database, Json, QueueItemState } from '@/types/database';

type TypedClient = SupabaseClient<Database>;
type MasteryResult = 'mastered' | 'already_mastered' | 'not_found';

function readCrystallizeQueueItemId(metadata: Json | null | undefined) {
  if (!metadata || typeof metadata !== 'object' || !('crystallize' in metadata)) {
    return null;
  }

  const crystallize = (metadata as { crystallize?: unknown }).crystallize;
  if (!crystallize || typeof crystallize !== 'object' || !('queue_item_id' in crystallize)) {
    return null;
  }

  const queueItemId = (crystallize as { queue_item_id?: unknown }).queue_item_id;
  return typeof queueItemId === 'string' ? queueItemId : null;
}

export async function resolveCrystallizeQueueItemId(
  supabase: TypedClient,
  conversationId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('messages')
    .select('metadata')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  for (const message of data ?? []) {
    const queueItemId = readCrystallizeQueueItemId(message.metadata);
    if (queueItemId) {
      return queueItemId;
    }
  }

  return null;
}

async function transitionTo(
  supabase: TypedClient,
  id: string,
  currentState: QueueItemState,
  nextState: QueueItemState
) {
  return queueQueries.updateState(supabase, id, currentState, nextState);
}

export async function advanceQueueItemToMastered(
  supabase: TypedClient,
  queueItemId: string
): Promise<MasteryResult> {
  const item = await queueQueries.getById(supabase, queueItemId);

  if (!item) {
    return 'not_found';
  }

  if (item.state === 'mastered') {
    return 'already_mastered';
  }

  let currentState: Exclude<QueueItemState, 'mastered'> = item.state;

  if (currentState === 'inbox' || currentState === 'resource') {
    await transitionTo(supabase, queueItemId, currentState, 'passive_debt');
    currentState = 'passive_debt';
  }

  if (currentState === 'passive_debt') {
    await transitionTo(supabase, queueItemId, currentState, 'mastered');
    return 'mastered';
  }

  return 'not_found';
}
