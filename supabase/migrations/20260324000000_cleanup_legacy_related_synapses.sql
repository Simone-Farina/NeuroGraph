-- Migration: Remove legacy RELATED edges created by pre-v1.2 vector-similarity auto-wiring.
-- These edges were created when the system used cosine similarity to auto-link neurons.
-- Since v1.2, only the Epistemological Inquisitor (inferPrerequisites) creates graph edges.
-- All remaining RELATED+ai_suggested=true rows are noise artifacts.
-- Safe: user-created RELATED edges (ai_suggested=false) are preserved.
-- Idempotent: second run deletes zero rows.

DELETE FROM synapses
WHERE type = 'RELATED'
  AND ai_suggested = true;
