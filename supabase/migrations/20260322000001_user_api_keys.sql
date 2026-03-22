-- API keys table for the Staging Area capture endpoint.
-- Stores SHA-256 hashes of API keys — never plaintext.
-- INSERT and UPDATE (last_used_at) are done by service role only (bypasses RLS).
-- Client-facing SELECT and DELETE are scoped by RLS to the owning user.

CREATE TABLE IF NOT EXISTS user_api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_prefix    TEXT NOT NULL,                         -- "ng_" + first 8 chars of raw key (display only)
  key_hash      TEXT NOT NULL UNIQUE,                  -- SHA-256 hex of raw key; never stored plaintext
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ,                           -- updated on each valid API call (service role)
  revoked_at    TIMESTAMPTZ                            -- NULL = active; non-null = revoked
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Two narrow policies: SELECT and DELETE only.
-- No INSERT policy — done by service role client (bypasses RLS).
-- No UPDATE policy — last_used_at updates done by service role client (bypasses RLS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_api_keys'
      AND policyname = 'Users can read own keys'
  ) THEN
    CREATE POLICY "Users can read own keys"
      ON user_api_keys FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_api_keys'
      AND policyname = 'Users can delete own keys'
  ) THEN
    CREATE POLICY "Users can delete own keys"
      ON user_api_keys FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Partial unique index: enforces maximum 1 active key per user at the database level.
-- NULL revoked_at = active key. Non-null = revoked (audit trail preserved).
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_api_keys_active_per_user
  ON user_api_keys(user_id)
  WHERE revoked_at IS NULL;
