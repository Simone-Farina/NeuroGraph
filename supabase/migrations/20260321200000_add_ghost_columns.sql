-- Migration: Add ghost node columns for Phase 2 (Graph Pedagogy)
-- Ghost nodes represent future learning targets in the DAG that the user hasn't mastered yet.

ALTER TABLE neurons
  ADD COLUMN IF NOT EXISTS is_ghost boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ghost_depth integer,
  ADD COLUMN IF NOT EXISTS ghost_target_title text;

-- Index for efficient ghost node filtering
CREATE INDEX IF NOT EXISTS idx_neurons_is_ghost ON neurons (is_ghost) WHERE is_ghost = true;

COMMENT ON COLUMN neurons.is_ghost IS 'Whether this neuron is a ghost (unmastered placeholder in a learning path)';
COMMENT ON COLUMN neurons.ghost_depth IS 'Distance from the nearest mastered ancestor. 0 = beacon/target, 1 = immediate next step, 2+ = fog';
COMMENT ON COLUMN neurons.ghost_target_title IS 'For beacon nodes (depth 0): the user-facing goal title';
