import type { SupabaseClient } from '@supabase/supabase-js';
import type { Crystal, CrystalEdge, Conversation, Message, Database } from '@/types/database';

type TypedClient = SupabaseClient<Database>;

type CrystalInsert = Database['public']['Tables']['crystals']['Insert'];
type CrystalUpdate = Database['public']['Tables']['crystals']['Update'];
type EdgeInsert = Database['public']['Tables']['crystal_edges']['Insert'];

export const crystalQueries = {
  async create(client: TypedClient, data: CrystalInsert): Promise<Crystal> {
    const { data: crystal, error } = await client
      .from('crystals')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return crystal;
  },

  async getById(client: TypedClient, id: string): Promise<Crystal | null> {
    const { data, error } = await client
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

  async getByUserId(client: TypedClient, userId: string): Promise<Crystal[]> {
    const { data, error } = await client
      .from('crystals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async update(client: TypedClient, id: string, updates: CrystalUpdate): Promise<Crystal> {
    const { data, error } = await client
      .from('crystals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('crystals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getDueForReview(client: TypedClient, userId: string, limit: number = 20): Promise<Crystal[]> {
    const { data, error } = await client
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
    client: TypedClient,
    embedding: number[],
    userId: string,
    limit: number = 5,
    threshold: number = 0.3
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
    client: TypedClient,
    crystalId: string,
    maxDepth: number = 2
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

  async getNeighborhoodsBatch(
    client: TypedClient,
    crystalIds: string[],
    maxDepth: number = 1
  ): Promise<Map<string, { crystals: Crystal[]; edges: CrystalEdge[] }>> {
    if (maxDepth !== 1) {
      throw new Error('Batch neighborhood retrieval only supports depth 1');
    }

    if (!crystalIds || crystalIds.length === 0) {
      return new Map();
    }

    // 1. Fetch edges connected to any of the crystalIds
    // Filter: source_crystal_id IN crystalIds OR target_crystal_id IN crystalIds
    const { data: edges, error: edgesError } = await client
      .from('crystal_edges')
      .select('*')
      .or(`source_crystal_id.in.(${crystalIds.join(',')}),target_crystal_id.in.(${crystalIds.join(',')})`);

    if (edgesError) throw edgesError;

    // 2. Collect all unique crystal IDs from edges + original IDs
    const allCrystalIds = new Set<string>(crystalIds);
    edges?.forEach(edge => {
      allCrystalIds.add(edge.source_crystal_id);
      allCrystalIds.add(edge.target_crystal_id);
    });

    // 3. Fetch all crystals
    const { data: crystals, error: crystalsError } = await client
      .from('crystals')
      .select('*')
      .in('id', Array.from(allCrystalIds));

    if (crystalsError) throw crystalsError;

    // 4. Group results by original crystalId
    const crystalsMap = new Map<string, Crystal>();
    crystals?.forEach(c => crystalsMap.set(c.id, c));

    const result = new Map<string, { crystals: Crystal[]; edges: CrystalEdge[] }>();

    crystalIds.forEach(id => {
      const crystalEdges = edges?.filter(e =>
        e.source_crystal_id === id || e.target_crystal_id === id
      ) || [];

      const neighborhoodCrystalIds = new Set<string>([id]);
      crystalEdges.forEach(e => {
        neighborhoodCrystalIds.add(e.source_crystal_id);
        neighborhoodCrystalIds.add(e.target_crystal_id);
      });

      const neighborhoodCrystals = Array.from(neighborhoodCrystalIds)
        .map(cid => crystalsMap.get(cid))
        .filter((c): c is Crystal => !!c);

      result.set(id, {
        crystals: neighborhoodCrystals,
        edges: crystalEdges
      });
    });

    return result;
  },
};

export const edgeQueries = {
  async create(client: TypedClient, data: EdgeInsert): Promise<CrystalEdge> {
    const { data: edge, error } = await client
      .from('crystal_edges')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return edge;
  },

  async upsert(
    client: TypedClient,
    data: EdgeInsert[]
  ): Promise<CrystalEdge[]> {
    const { data: edges, error } = await client
      .from('crystal_edges')
      .upsert(data, {
        onConflict: 'source_crystal_id,target_crystal_id,type',
        ignoreDuplicates: true,
      })
      .select('*');

    if (error) throw error;
    return edges || [];
  },

  async getByUserId(client: TypedClient, userId: string): Promise<CrystalEdge[]> {
    const { data, error } = await client
      .from('crystal_edges')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async getByCrystalId(client: TypedClient, crystalId: string): Promise<CrystalEdge[]> {
    const { data, error } = await client
      .from('crystal_edges')
      .select('*')
      .or(`source_crystal_id.eq.${crystalId},target_crystal_id.eq.${crystalId}`);

    if (error) throw error;
    return data;
  },

  async delete(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('crystal_edges')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const conversationQueries = {
  async create(client: TypedClient, userId: string, title: string): Promise<Conversation> {
    const { data, error } = await client
      .from('conversations')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getById(client: TypedClient, id: string): Promise<Conversation | null> {
    const { data, error } = await client
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

  async getByUserId(client: TypedClient, userId: string): Promise<Conversation[]> {
    const { data, error } = await client
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async delete(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const messageQueries = {
  async create(
    client: TypedClient,
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    youtubeUrl?: string
  ): Promise<Message> {
    const { data, error } = await client
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

  async getByConversationId(client: TypedClient, conversationId: string): Promise<Message[]> {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },
};
