import type { SupabaseClient } from '@supabase/supabase-js';
import type { Neuron, Synapse, Conversation, Message, Database } from '@/types/database';

type TypedClient = SupabaseClient<Database>;

type NeuronInsert = Database['public']['Tables']['neurons']['Insert'];
type NeuronUpdate = Database['public']['Tables']['neurons']['Update'];
type SynapseInsert = Database['public']['Tables']['synapses']['Insert'];

export const neuronQueries = {
  async create(client: TypedClient, data: NeuronInsert): Promise<Neuron> {
    const { data: neuron, error } = await client
      .from('neurons')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return neuron;
  },

  async getById(client: TypedClient, id: string): Promise<Neuron | null> {
    const { data, error } = await client
      .from('neurons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getByUserId(client: TypedClient, userId: string): Promise<Neuron[]> {
    const { data, error } = await client
      .from('neurons')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async update(client: TypedClient, id: string, updates: NeuronUpdate): Promise<Neuron> {
    const { data, error } = await client
      .from('neurons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('neurons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getDueForReview(client: TypedClient, userId: string, limit: number = 20): Promise<Neuron[]> {
    const { data, error } = await client
      .from('neurons')
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
  ): Promise<Array<Neuron & { similarity: number }>> {
    const { data, error } = await client.rpc('find_similar_neurons', {
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
    neuronId: string,
    maxDepth: number = 2
  ): Promise<{
    neurons: Neuron[];
    synapses: Synapse[];
  }> {
    const { data, error } = await client.rpc('get_neuron_neighborhood', {
      root_neuron_id: neuronId,
      max_depth: maxDepth,
    });

    if (error) throw error;

    const firstRow = data?.[0];

    return {
      neurons: firstRow?.neurons || [],
      synapses: firstRow?.synapses || [],
    };
  },

  async getNeighborhoodsBatch(
    client: TypedClient,
    neuronIds: string[],
    maxDepth: number = 1
  ): Promise<Map<string, { neurons: Neuron[]; synapses: Synapse[] }>> {
    if (maxDepth !== 1) {
      throw new Error('Batch neighborhood retrieval only supports depth 1');
    }

    if (!neuronIds || neuronIds.length === 0) {
      return new Map();
    }

    const { data: synapses, error: synapsesError } = await client
      .from('synapses')
      .select('*')
      .or(`source_neuron_id.in.(${neuronIds.join(',')}),target_neuron_id.in.(${neuronIds.join(',')})`);

    if (synapsesError) throw synapsesError;

    const allNeuronIds = new Set<string>(neuronIds);
    synapses?.forEach((synapse) => {
      allNeuronIds.add(synapse.source_neuron_id);
      allNeuronIds.add(synapse.target_neuron_id);
    });

    const { data: neurons, error: neuronsError } = await client
      .from('neurons')
      .select('*')
      .in('id', Array.from(allNeuronIds));

    if (neuronsError) throw neuronsError;

    const neuronsMap = new Map<string, Neuron>();
    neurons?.forEach((neuron) => neuronsMap.set(neuron.id, neuron));

    const result = new Map<string, { neurons: Neuron[]; synapses: Synapse[] }>();

    neuronIds.forEach((id) => {
      const neuronSynapses = synapses?.filter(
        (synapse) => synapse.source_neuron_id === id || synapse.target_neuron_id === id
      ) || [];

      const neighborhoodNeuronIds = new Set<string>([id]);
      neuronSynapses.forEach((synapse) => {
        neighborhoodNeuronIds.add(synapse.source_neuron_id);
        neighborhoodNeuronIds.add(synapse.target_neuron_id);
      });

      const neighborhoodNeurons = Array.from(neighborhoodNeuronIds)
        .map((currentNeuronId) => neuronsMap.get(currentNeuronId))
        .filter((neuron): neuron is Neuron => !!neuron);

      result.set(id, {
        neurons: neighborhoodNeurons,
        synapses: neuronSynapses,
      });
    });

    return result;
  },
};

export const synapseQueries = {
  async create(client: TypedClient, data: SynapseInsert): Promise<Synapse> {
    const { data: synapse, error } = await client
      .from('synapses')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return synapse;
  },

  async getByUserId(client: TypedClient, userId: string): Promise<Synapse[]> {
    const { data, error } = await client
      .from('synapses')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  async getByNeuronId(client: TypedClient, neuronId: string): Promise<Synapse[]> {
    const { data, error } = await client
      .from('synapses')
      .select('*')
      .or(`source_neuron_id.eq.${neuronId},target_neuron_id.eq.${neuronId}`);

    if (error) throw error;
    return data;
  },

  async delete(client: TypedClient, id: string): Promise<void> {
    const { error } = await client
      .from('synapses')
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
