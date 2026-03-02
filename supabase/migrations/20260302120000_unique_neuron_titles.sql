-- Migration: Unique neuron titles per user
-- Deduplicate: keep the most recently updated neuron per (user_id, title)
DELETE FROM neurons a
USING neurons b
WHERE a.user_id = b.user_id
  AND a.title = b.title
  AND a.updated_at < b.updated_at;

ALTER TABLE neurons
  ADD CONSTRAINT unique_user_neuron_title UNIQUE (user_id, title);
