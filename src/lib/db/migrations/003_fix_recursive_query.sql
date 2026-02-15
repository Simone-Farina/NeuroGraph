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
  WITH RECURSIVE traversal AS (
    -- Base case: root node
    SELECT 
      id,
      ARRAY[id] AS path,
      0 AS depth
    FROM crystals
    WHERE id = root_crystal_id
    
    UNION ALL
    
    -- Recursive step
    SELECT 
      next_node.id,
      t.path || next_node.id,
      t.depth + 1
    FROM traversal t
    -- Find connected edges (either direction)
    JOIN crystal_edges e ON (e.source_crystal_id = t.id OR e.target_crystal_id = t.id)
    -- Find the adjacent node
    JOIN crystals next_node ON (
      CASE 
        WHEN e.source_crystal_id = t.id THEN e.target_crystal_id 
        ELSE e.source_crystal_id 
      END = next_node.id
    )
    WHERE t.depth < max_depth
      -- Prevent cycles: next_node must not be in the current path
      AND NOT (next_node.id = ANY(t.path))
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
