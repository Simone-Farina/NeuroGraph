-- Fix recursive reference in get_crystal_neighborhood
-- Issue: "recursive reference to query 'crystal_walk' must not appear within a subquery"

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
  neighborhood_ids uuid[];
  result_crystals json;
  result_edges json;
BEGIN
  -- 1. Get all involved crystal IDs using recursive CTE with path tracking
  -- Use ARRAY to track visited nodes to prevent cycles and duplicate processing
  WITH RECURSIVE
  -- Helper CTE to view edges as bidirectional (undirected)
  bidirectional_edges AS (
    SELECT source_crystal_id AS source, target_crystal_id AS target FROM crystal_edges
    UNION ALL
    SELECT target_crystal_id AS source, source_crystal_id AS target FROM crystal_edges
  ),
  traversal AS (
    -- Base case: root node
    SELECT 
      id,
      ARRAY[id] AS path,
      0 AS depth
    FROM crystals
    WHERE id = root_crystal_id
    
    UNION ALL
    
    -- Recursive step: traverse connected edges
    SELECT 
      e.target AS id,
      t.path || e.target,
      t.depth + 1
    FROM traversal t
    JOIN bidirectional_edges e ON e.source = t.id
    WHERE t.depth < max_depth
      AND NOT (e.target = ANY(t.path))
  )
  SELECT array_agg(DISTINCT id) INTO neighborhood_ids FROM traversal;

  -- 2. Aggregate crystals (nodes)
  SELECT json_agg(c.*) INTO result_crystals
  FROM crystals c
  WHERE c.id = ANY(neighborhood_ids);
  
  -- Handle empty result (though root should exist)
  IF result_crystals IS NULL THEN
    result_crystals := '[]'::json;
  END IF;

  -- 3. Aggregate edges (connections between neighborhood nodes)
  SELECT json_agg(e.*) INTO result_edges
  FROM crystal_edges e
  WHERE e.source_crystal_id = ANY(neighborhood_ids) 
    AND e.target_crystal_id = ANY(neighborhood_ids);

  IF result_edges IS NULL THEN
    result_edges := '[]'::json;
  END IF;

  -- 4. Return result
  RETURN QUERY SELECT result_crystals AS crystals, result_edges AS edges;
END;
$$;
