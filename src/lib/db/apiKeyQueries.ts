import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ApiKey } from '@/types/database';

type TypedClient = SupabaseClient<Database>;
type ApiKeyInsert = Database['public']['Tables']['user_api_keys']['Insert'];

export const apiKeyQueries = {
  async create(client: TypedClient, data: ApiKeyInsert): Promise<ApiKey> {
    const { data: key, error } = await client
      .from('user_api_keys')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return key;
  },

  async findByHash(client: TypedClient, keyHash: string): Promise<ApiKey | null> {
    const { data, error } = await client
      .from('user_api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .is('revoked_at', null)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async updateLastUsed(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('user_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async revoke(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('user_api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getActiveByUserId(client: TypedClient, userId: string): Promise<ApiKey | null> {
    const { data, error } = await client
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },
};
