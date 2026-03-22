import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, KnowledgeQueueItem, QueueItemState } from '@/types/database';
import { VALID_TRANSITIONS } from '@/lib/validation/queue';

type TypedClient = SupabaseClient<Database>;
type QueueItemInsert = Database['public']['Tables']['knowledge_queue']['Insert'];

export const queueQueries = {
  async create(client: TypedClient, data: QueueItemInsert): Promise<KnowledgeQueueItem> {
    const { data: item, error } = await client
      .from('knowledge_queue')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return item;
  },

  async getActiveByUserId(client: TypedClient, userId: string): Promise<KnowledgeQueueItem[]> {
    const { data, error } = await client
      .from('knowledge_queue')
      .select('*')
      .eq('user_id', userId)
      .neq('state', 'mastered')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(client: TypedClient, id: string): Promise<KnowledgeQueueItem | null> {
    const { data, error } = await client
      .from('knowledge_queue')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async updateState(
    client: TypedClient,
    id: string,
    currentState: QueueItemState,
    newState: QueueItemState
  ): Promise<KnowledgeQueueItem> {
    const allowed = VALID_TRANSITIONS[currentState] || [];
    if (!allowed.includes(newState)) {
      throw new Error(`Invalid state transition: ${currentState} -> ${newState}`);
    }
    const { data, error } = await client
      .from('knowledge_queue')
      .update({ state: newState })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteItem(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('knowledge_queue')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
