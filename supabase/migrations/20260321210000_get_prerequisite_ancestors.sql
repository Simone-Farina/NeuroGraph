-- Migration: Add recursive function to find all prerequisite ancestors for Upward FIRe Healing
-- This allows the system to trace backwards from an advanced concept (target) to its foundations (sources).

CREATE OR REPLACE FUNCTION get_prerequisite_ancestors(match_neuron_id UUID)
RETURNS TABLE (
  neuron_id UUID
) LANGUAGE sql STABLE AS $$
  WITH RECURSIVE ancestors AS (
    -- Base case: immediate prerequisites of the given neuron
    SELECT source_neuron_id
    FROM synapses
    WHERE target_neuron_id = match_neuron_id
      AND type = 'PREREQUISITE'

    UNION

    -- Recursive step: prerequisites of prerequisites
    SELECT s.source_neuron_id
    FROM synapses s
    INNER JOIN ancestors a ON s.target_neuron_id = a.source_neuron_id
    WHERE s.type = 'PREREQUISITE'
  )
  SELECT DISTINCT source_neuron_id as neuron_id
  FROM ancestors;
$$;

-- Add comment for PostgREST documentation
COMMENT ON FUNCTION get_prerequisite_ancestors(UUID) IS 'Recursively finds all upstream PREREQUISITE ancestors for a given neuron ID (Upward FIRe Healing).';
