import { supabase } from './client';
import type { Crystal, CrystalEdge, Conversation, Message, Database } from '@/types/database';

type CrystalInsert = Database['public']['Tables']['crystals']['Insert'];
type CrystalUpdate = Database['public']['Tables']['crystals']['Update'];
type EdgeInsert = Database['public']['Tables']['crystal_edges']['Insert'];

export const crystalQueries = {
  async create(data: CrystalInsert): Promise<Crystal> {
    const { data: crystal, error } = await supabase
      .from('crystals')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return crystal;
  },

  async getById(id: string): Promise<Crystal | null> {
    const { data, error } = await supabase
      .from('crystals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getByUserId(userId: string): Promise<Crystal[]> {
    const { data, error } = await supabase
      .from('crystals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: CrystalUpdate): Promise<Crystal> {
    const { data, error } = await supabase
      .from('crystals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('crystals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getDueForReview(userId: string, limit: number = 20): Promise<Crystal[]> {
    const { data, error } = await supabase
      .from('crystals')
      .select('*')
      .eq('user_id', userId)
      .not('next_review_due', 'is', null)
      .lte('next_review_due', new Date().toISOString())
      .order('next_review_due', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async findSimilar(
    embedding: number[],
    userId: string,
    limit: number = 5,
    threshold: number = 0.3,
    client: typeof supabase = supabase
  ): Promise<Array<Crystal & { similarity: number }>> {
    const { data, error } = await client.rpc('find_similar_crystals', {
      query_embedding: embedding,
      match_user_id: userId,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) throw error;
    return data || [];
  },

  async getNeighborhood(
    crystalId: string,
    maxDepth: number = 2,
    client: typeof supabase = supabase
  ): Promise<{
    crystals: Crystal[];
    edges: CrystalEdge[];
  }> {
    const { data, error } = await client.rpc('get_crystal_neighborhood', {
      root_crystal_id: crystalId,
      max_depth: maxDepth,
    });

    if (error) throw error;

    const firstRow = data?.[0];

    return {
      crystals: firstRow?.crystals || [],
      edges: firstRow?.edges || [],
    };
  },
};

export const edgeQueries = {
  async create(data: EdgeInsert): Promise<CrystalEdge> {
    const { data: edge, error } = await supabase
      .from('crystal_edges')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return edge;
  },

  async getByUserId(userId: string): Promise<CrystalEdge[]> {
    const { data, error } = await supabase
      .from('crystal_edges')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async getByCrystalId(crystalId: string): Promise<CrystalEdge[]> {
    const { data, error } = await supabase
      .from('crystal_edges')
      .select('*')
      .or(`source_crystal_id.eq.${crystalId},target_crystal_id.eq.${crystalId}`);

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('crystal_edges')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const conversationQueries = {
  async create(userId: string, title: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getByUserId(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const messageQueries = {
  async create(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    youtubeUrl?: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        youtube_url: youtubeUrl || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getByConversationId(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },
};
