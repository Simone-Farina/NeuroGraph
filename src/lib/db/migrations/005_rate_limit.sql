-- Create a table for rate limiting
CREATE TABLE IF NOT EXISTS user_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS to secure the table
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits directly
CREATE POLICY "Service role can manage rate limits"
  ON user_rate_limits
  USING (auth.role() = 'service_role');

-- Create a function to check and update rate limits atomically
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass RLS for this function
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT request_count, window_start INTO v_count, v_window_start
  FROM user_rate_limits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First request from this user
    INSERT INTO user_rate_limits (user_id, request_count, window_start)
    VALUES (p_user_id, 1, NOW());
    RETURN TRUE;
  END IF;

  -- Check if window has expired
  IF NOW() > v_window_start + (p_window_seconds || ' seconds')::INTERVAL THEN
    -- New window, reset count
    UPDATE user_rate_limits
    SET request_count = 1, window_start = NOW()
    WHERE user_id = p_user_id;
    RETURN TRUE;
  ELSE
    -- Same window, check limit
    IF v_count < p_limit THEN
      UPDATE user_rate_limits
      SET request_count = request_count + 1
      WHERE user_id = p_user_id;
      RETURN TRUE;
    ELSE
      -- Limit exceeded
      RETURN FALSE;
    END IF;
  END IF;
END;
$$;
