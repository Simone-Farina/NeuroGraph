export type BloomLevel =
  | 'Remember'
  | 'Understand'
  | 'Apply'
  | 'Analyze'
  | 'Evaluate'
  | 'Create';

export type SynapseType = 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
export type MessageRole = 'user' | 'assistant' | 'system';

export type Neuron = {
  id: string;
  user_id: string;
  title: string;
  definition: string;
  core_insight: string;
  bloom_level: BloomLevel;
  source_conversation_id: string;
  source_message_ids: string[];
  embedding: number[] | null;
  stability: number;
  retrievability: number;
  difficulty: number;
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
  reps: number;
  lapses: number;
  elapsed_days: number;
  scheduled_days: number;
  last_review: string | null;
  next_review_due: string;
  review_count: number;
  consecutive_correct: number;
  content: string;
  user_modified: boolean;
  modified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Synapse = {
  id: string;
  user_id: string;
  source_neuron_id: string;
  target_neuron_id: string;
  type: SynapseType;
  weight: number;
  ai_suggested: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  youtube_url: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      neurons: {
        Row: Neuron;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          definition: string;
          core_insight: string;
          bloom_level: BloomLevel;
          source_conversation_id: string;
          source_message_ids?: string[];
          embedding?: number[] | null;
          stability?: number;
          retrievability?: number;
          difficulty?: number;
          state?: 'New' | 'Learning' | 'Review' | 'Relearning';
          reps?: number;
          lapses?: number;
          elapsed_days?: number;
          scheduled_days?: number;
          last_review?: string | null;
          next_review_due?: string;
          review_count?: number;
          consecutive_correct?: number;
          content?: string;
          user_modified?: boolean;
          modified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Neuron>;
        Relationships: [];
      };
      synapses: {
        Row: Synapse;
        Insert: {
          id?: string;
          user_id: string;
          source_neuron_id: string;
          target_neuron_id: string;
          type: SynapseType;
          weight?: number;
          ai_suggested?: boolean;
          created_at?: string;
        };
        Update: Partial<Synapse>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: {
          id?: string;
          conversation_id: string;
          role: MessageRole;
          content: string;
          youtube_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Message>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      find_similar_neurons: {
        Args: {
          query_embedding: number[];
          match_user_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: Array<Neuron & { similarity: number }>;
      };
      get_neuron_neighborhood: {
        Args: {
          root_neuron_id: string;
          max_depth?: number;
        };
        Returns: Array<{ neurons: Neuron[] | null; synapses: Synapse[] | null }>;
      };
      update_updated_at_column: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};
