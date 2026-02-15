-- Update find_similar_crystals RPC to match FSRS schema
DROP FUNCTION IF EXISTS find_similar_crystals(vector, uuid, float, int);

CREATE OR REPLACE FUNCTION find_similar_crystals(
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
  difficulty numeric,
  retrievability numeric,
  state text,
  reps int,
  lapses int,
  elapsed_days int,
  scheduled_days int,
  last_review timestamptz,
  next_review_due timestamptz,
  review_count int,
  consecutive_correct int,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.title,
    c.definition,
    c.core_insight,
    c.bloom_level,
    c.source_conversation_id,
    c.source_message_ids,
    c.embedding,
    c.stability,
    c.difficulty,
    c.retrievability,
    c.state,
    c.reps,
    c.lapses,
    c.elapsed_days,
    c.scheduled_days,
    c.last_review,
    c.next_review_due,
    c.review_count,
    c.consecutive_correct,
    c.created_at,
    c.updated_at,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM crystals c
  WHERE c.user_id = match_user_id
    AND c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> query_embedding)) >= (1 - match_threshold)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
