-- Knowledge queue table for the Staging Area feature.
-- Stores items captured by users for later triage (inbox → active learning funnel).
-- Structurally isolated from neurons/synapses/conversations/messages tables.

CREATE TABLE IF NOT EXISTS knowledge_queue (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  url                   TEXT,                              -- nullable: pure thoughts have no URL
  notes                 TEXT,                              -- nullable: optional user annotation
  state                 TEXT NOT NULL DEFAULT 'inbox'
                          CHECK (state IN ('inbox', 'passive_debt', 'resource', 'mastered')),
  source_domain         TEXT,                              -- auto-extracted from URL on capture (Phase 6)
  favicon_url           TEXT,                              -- auto-extracted from URL on capture (Phase 6)
  estimated_read_time   INTEGER,                           -- minutes; auto-extracted on capture (Phase 6)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE knowledge_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'knowledge_queue'
      AND policyname = 'Users can CRUD own queue items'
  ) THEN
    CREATE POLICY "Users can CRUD own queue items"
      ON knowledge_queue FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Composite partial index: active items only (excludes mastered — terminal state, removed from list)
CREATE INDEX IF NOT EXISTS idx_knowledge_queue_user_active
  ON knowledge_queue(user_id, state, created_at DESC)
  WHERE state != 'mastered';

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_knowledge_queue_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knowledge_queue_updated_at ON knowledge_queue;
CREATE TRIGGER knowledge_queue_updated_at
  BEFORE UPDATE ON knowledge_queue
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_queue_updated_at();
