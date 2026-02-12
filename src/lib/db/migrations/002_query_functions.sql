-- NeuroGraph Query Functions
-- RPC functions for complex queries (vector similarity, graph traversal)

-- ============================================================
-- FUNCTION: find_similar_crystals
-- Vector similarity search using cosine distance
-- ============================================================
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
  ease_factor numeric,
  retrievability numeric,
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
    c.*,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM crystals c
  WHERE c.user_id = match_user_id
    AND c.embedding IS NOT NULL
    AND (1 - (c.embedding <=> query_embedding)) >= (1 - match_threshold)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- FUNCTION: get_crystal_neighborhood
-- Recursive CTE graph traversal for connected crystals
-- ============================================================
CREATE OR REPLACE FUNCTION get_crystal_neighborhood(
  root_crystal_id uuid,
  max_depth int DEFAULT 2
)
RETURNS TABLE (
  crystals json,
  edges json
)
LANGUAGE plpgsql
AS $$
DECLARE
  result_crystals json;
  result_edges json;
BEGIN
  WITH RECURSIVE crystal_walk AS (
    SELECT 
      c.id,
      c.user_id,
      0 AS depth
    FROM crystals c
    WHERE c.id = root_crystal_id
    
    UNION
    
    SELECT 
      c.id,
      c.user_id,
      cw.depth + 1
    FROM crystals c
    INNER JOIN crystal_edges e ON (
      (e.source_crystal_id = c.id AND e.target_crystal_id IN (SELECT id FROM crystal_walk))
      OR
      (e.target_crystal_id = c.id AND e.source_crystal_id IN (SELECT id FROM crystal_walk))
    )
    INNER JOIN crystal_walk cw ON (
      cw.id = e.source_crystal_id OR cw.id = e.target_crystal_id
    )
    WHERE cw.depth < max_depth
      AND c.id NOT IN (SELECT id FROM crystal_walk)
  ),
  neighborhood_crystal_ids AS (
    SELECT DISTINCT id FROM crystal_walk
  )
  SELECT 
    json_agg(c.*) INTO result_crystals
  FROM crystals c
  WHERE c.id IN (SELECT id FROM neighborhood_crystal_ids);
  
  SELECT 
    json_agg(e.*) INTO result_edges
  FROM crystal_edges e
  WHERE e.source_crystal_id IN (SELECT id FROM neighborhood_crystal_ids)
    AND e.target_crystal_id IN (SELECT id FROM neighborhood_crystal_ids);
  
  RETURN QUERY SELECT result_crystals, result_edges;
END;
$$;

-- ============================================================
-- COMPLETION
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'Query functions installed successfully';
  RAISE NOTICE 'Available: find_similar_crystals, get_crystal_neighborhood';
END $$;
