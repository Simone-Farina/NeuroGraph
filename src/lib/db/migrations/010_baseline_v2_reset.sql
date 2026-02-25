CREATE EXTENSION IF NOT EXISTS vector;

DROP FUNCTION IF EXISTS find_similar_crystals(vector, uuid, float, int);
DROP FUNCTION IF EXISTS get_crystal_neighborhood(uuid, int);
DROP FUNCTION IF EXISTS find_similar_neurons(vector, uuid, float, int);
DROP FUNCTION IF EXISTS get_neuron_neighborhood(uuid, int);

DROP TABLE IF EXISTS crystal_edges CASCADE;
DROP TABLE IF EXISTS crystals CASCADE;
DROP TABLE IF EXISTS synapses CASCADE;
DROP TABLE IF EXISTS neurons CASCADE;

CREATE TABLE neurons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  definition TEXT NOT NULL CHECK (char_length(definition) <= 280),
  core_insight TEXT NOT NULL,
  bloom_level TEXT NOT NULL CHECK (bloom_level IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),

  source_conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  source_message_ids UUID[] NOT NULL DEFAULT '{}',

  embedding vector(1536),

  stability NUMERIC NOT NULL DEFAULT 1.0,
  retrievability NUMERIC NOT NULL DEFAULT 1.0 CHECK (retrievability >= 0.0 AND retrievability <= 1.0),
  difficulty NUMERIC NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'New' CHECK (state IN ('New', 'Learning', 'Review', 'Relearning')),
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  last_review TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  review_count INTEGER NOT NULL DEFAULT 0,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,

  content TEXT DEFAULT '',
  user_modified BOOLEAN DEFAULT FALSE,
  modified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE synapses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_neuron_id UUID NOT NULL REFERENCES neurons(id) ON DELETE CASCADE,
  target_neuron_id UUID NOT NULL REFERENCES neurons(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PREREQUISITE', 'RELATED', 'BUILDS_ON')),
  weight NUMERIC NOT NULL DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0),
  ai_suggested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_synapse UNIQUE (source_neuron_id, target_neuron_id, type)
);

CREATE INDEX idx_neurons_user_id ON neurons(user_id);
CREATE INDEX idx_neurons_next_review_due ON neurons(next_review_due) WHERE next_review_due IS NOT NULL;
CREATE INDEX idx_neurons_source_conversation ON neurons(source_conversation_id);
CREATE INDEX idx_neurons_embedding ON neurons
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_synapses_user_id ON synapses(user_id);
CREATE INDEX idx_synapses_source ON synapses(source_neuron_id);
CREATE INDEX idx_synapses_target ON synapses(target_neuron_id);

ALTER TABLE neurons ENABLE ROW LEVEL SECURITY;
ALTER TABLE synapses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS neurons_isolation ON neurons;
CREATE POLICY neurons_isolation ON neurons
  FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS synapses_isolation ON synapses;
CREATE POLICY synapses_isolation ON synapses
  FOR ALL
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_neurons_updated_at ON neurons;
CREATE TRIGGER update_neurons_updated_at
  BEFORE UPDATE ON neurons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION find_similar_neurons(
  query_embedding vector(1536),
  match_user_id uuid,
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  definition text,
  core_insight text,
  bloom_level text,
  source_conversation_id uuid,
  source_message_ids uuid[],
  embedding vector(1536),
  stability numeric,
  retrievability numeric,
  difficulty numeric,
  state text,
  reps int,
  lapses int,
  elapsed_days int,
  scheduled_days int,
  last_review timestamptz,
  next_review_due timestamptz,
  review_count int,
  consecutive_correct int,
  content text,
  user_modified boolean,
  modified_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.title,
    n.definition,
    n.core_insight,
    n.bloom_level,
    n.source_conversation_id,
    n.source_message_ids,
    n.embedding,
    n.stability,
    n.retrievability,
    n.difficulty,
    n.state,
    n.reps,
    n.lapses,
    n.elapsed_days,
    n.scheduled_days,
    n.last_review,
    n.next_review_due,
    n.review_count,
    n.consecutive_correct,
    n.content,
    n.user_modified,
    n.modified_at,
    n.created_at,
    n.updated_at,
    1 - (n.embedding <=> query_embedding) AS similarity
  FROM neurons n
  WHERE n.user_id = match_user_id
    AND n.embedding IS NOT NULL
    AND (1 - (n.embedding <=> query_embedding)) >= (1 - match_threshold)
  ORDER BY n.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION get_neuron_neighborhood(
  root_neuron_id uuid,
  max_depth int DEFAULT 2
)
RETURNS TABLE (
  neurons json,
  synapses json
)
LANGUAGE plpgsql
AS $$
DECLARE
  neighborhood_ids uuid[];
  result_neurons json;
  result_synapses json;
BEGIN
  WITH RECURSIVE
  bidirectional_synapses AS (
    SELECT source_neuron_id AS source, target_neuron_id AS target FROM synapses
    UNION ALL
    SELECT target_neuron_id AS source, source_neuron_id AS target FROM synapses
  ),
  traversal AS (
    SELECT
      id,
      ARRAY[id] AS path,
      0 AS depth
    FROM neurons
    WHERE id = root_neuron_id

    UNION ALL

    SELECT
      s.target AS id,
      t.path || s.target,
      t.depth + 1
    FROM traversal t
    JOIN bidirectional_synapses s ON s.source = t.id
    WHERE t.depth < max_depth
      AND NOT (s.target = ANY(t.path))
  )
  SELECT array_agg(DISTINCT id) INTO neighborhood_ids FROM traversal;

  SELECT json_agg(n.*) INTO result_neurons
  FROM neurons n
  WHERE n.id = ANY(neighborhood_ids);

  IF result_neurons IS NULL THEN
    result_neurons := '[]'::json;
  END IF;

  SELECT json_agg(s.*) INTO result_synapses
  FROM synapses s
  WHERE s.source_neuron_id = ANY(neighborhood_ids)
    AND s.target_neuron_id = ANY(neighborhood_ids);

  IF result_synapses IS NULL THEN
    result_synapses := '[]'::json;
  END IF;

  RETURN QUERY SELECT result_neurons AS neurons, result_synapses AS synapses;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE 'NeuroGraph baseline v2 reset complete';
  RAISE NOTICE 'Legacy tables dropped: crystals, crystal_edges';
  RAISE NOTICE 'New tables created: neurons, synapses';
  RAISE NOTICE 'RPC functions available: find_similar_neurons, get_neuron_neighborhood';
END $$;
