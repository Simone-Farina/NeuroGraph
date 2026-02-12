-- NeuroGraph Initial Schema Migration
-- Enables pgvector for embeddings and creates complete data model

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLE: conversations
-- Stores user chat conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: messages
-- Stores individual messages within conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  youtube_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: crystals
-- Core knowledge nodes with spaced repetition metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS crystals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  definition TEXT NOT NULL CHECK (char_length(definition) <= 280),
  core_insight TEXT NOT NULL,
  bloom_level TEXT NOT NULL CHECK (bloom_level IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
  
  -- Source tracking
  source_conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  source_message_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Vector embedding for similarity search (OpenAI ada-002 = 1536 dimensions)
  embedding vector(1536),
  
  -- Spaced Repetition (SM-2 algorithm)
  stability NUMERIC NOT NULL DEFAULT 1.0,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  retrievability NUMERIC NOT NULL DEFAULT 1.0 CHECK (retrievability >= 0.0 AND retrievability <= 1.0),
  last_review TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  review_count INTEGER NOT NULL DEFAULT 0,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: crystal_edges
-- Relationships between knowledge crystals
-- ============================================================
CREATE TABLE IF NOT EXISTS crystal_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_crystal_id UUID NOT NULL REFERENCES crystals(id) ON DELETE CASCADE,
  target_crystal_id UUID NOT NULL REFERENCES crystals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PREREQUISITE', 'RELATED', 'BUILDS_ON')),
  weight NUMERIC NOT NULL DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0),
  ai_suggested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate edges
  CONSTRAINT unique_edge UNIQUE (source_crystal_id, target_crystal_id, type)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Conversations: Fast user lookup
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Messages: Fast conversation lookup
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Crystals: User lookup, review queue, vector similarity
CREATE INDEX IF NOT EXISTS idx_crystals_user_id ON crystals(user_id);
CREATE INDEX IF NOT EXISTS idx_crystals_next_review_due ON crystals(next_review_due) WHERE next_review_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crystals_source_conversation ON crystals(source_conversation_id);

-- HNSW index for fast vector similarity search
-- Using cosine distance (<=>) for semantic similarity
CREATE INDEX IF NOT EXISTS idx_crystals_embedding ON crystals 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Crystal Edges: Fast graph traversal
CREATE INDEX IF NOT EXISTS idx_crystal_edges_user_id ON crystal_edges(user_id);
CREATE INDEX IF NOT EXISTS idx_crystal_edges_source ON crystal_edges(source_crystal_id);
CREATE INDEX IF NOT EXISTS idx_crystal_edges_target ON crystal_edges(target_crystal_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Ensure users can only access their own data
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crystals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crystal_edges ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only access their own
CREATE POLICY conversations_isolation ON conversations
  FOR ALL
  USING (auth.uid() = user_id);

-- Messages: Users can only access messages from their conversations
CREATE POLICY messages_isolation ON messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Crystals: Users can only access their own
CREATE POLICY crystals_isolation ON crystals
  FOR ALL
  USING (auth.uid() = user_id);

-- Crystal Edges: Users can only access their own
CREATE POLICY crystal_edges_isolation ON crystal_edges
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for crystals
CREATE TRIGGER update_crystals_updated_at
  BEFORE UPDATE ON crystals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMPLETION
-- ============================================================

-- Verify installation
DO $$
BEGIN
  RAISE NOTICE 'NeuroGraph schema migration complete!';
  RAISE NOTICE 'Tables created: conversations, messages, crystals, crystal_edges';
  RAISE NOTICE 'pgvector extension enabled with HNSW index on embeddings';
  RAISE NOTICE 'RLS policies active for user data isolation';
END $$;
