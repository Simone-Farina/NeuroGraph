export type BloomLevel =
  | 'Remember'
  | 'Understand'
  | 'Apply'
  | 'Analyze'
  | 'Evaluate'
  | 'Create';

export type EdgeType = 'PREREQUISITE' | 'RELATED' | 'BUILDS_ON';
export type MessageRole = 'user' | 'assistant' | 'system';

export type Crystal = {
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
  created_at: string;
  updated_at: string;
};

export type CrystalEdge = {
  id: string;
  user_id: string;
  source_crystal_id: string;
  target_crystal_id: string;
  type: EdgeType;
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
      crystals: {
        Row: Crystal;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Crystal>;
        Relationships: [];
      };
      crystal_edges: {
        Row: CrystalEdge;
        Insert: {
          id?: string;
          user_id: string;
          source_crystal_id: string;
          target_crystal_id: string;
          type: EdgeType;
          weight?: number;
          ai_suggested?: boolean;
          created_at?: string;
        };
        Update: Partial<CrystalEdge>;
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
      find_similar_crystals: {
        Args: {
          query_embedding: number[];
          match_user_id: string;
          match_threshold?: number;
          match_count?: number;
        };
        Returns: Array<Crystal & { similarity: number }>;
      };
      get_crystal_neighborhood: {
        Args: {
          root_crystal_id: string;
          max_depth?: number;
        };
        Returns: Array<{ crystals: Crystal[] | null; edges: CrystalEdge[] | null }>;
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
