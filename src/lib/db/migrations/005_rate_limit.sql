-- Create table for rate limiting
CREATE TABLE IF NOT EXISTS user_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage this table directly
CREATE POLICY "Service role can manage rate limits" ON user_rate_limits
  USING (auth.role() = 'service_role');

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_limit INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_request_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  -- If not authenticated, deny
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO user_rate_limits (user_id, request_count, window_start)
  VALUES (v_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET
    request_count = CASE
      WHEN user_rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN 1
      ELSE user_rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN user_rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN NOW()
      ELSE user_rate_limits.window_start
    END
  RETURNING request_count INTO v_request_count;

  RETURN v_request_count <= p_limit;
END;
$$;
