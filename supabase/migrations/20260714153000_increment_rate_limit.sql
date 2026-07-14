-- Migration: Add atomic rate limiting function

CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_identifier TEXT,
  p_interval INTEGER,
  p_limit INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  remaining INTEGER,
  reset BIGINT
) AS $$
DECLARE
  v_now BIGINT;
  v_window_start BIGINT;
  v_timestamps BIGINT[];
  v_new_timestamps BIGINT[];
  v_remaining INTEGER;
  v_success BOOLEAN;
  v_reset BIGINT;
BEGIN
  -- Get current time in milliseconds
  v_now := EXTRACT(EPOCH FROM now()) * 1000;
  v_window_start := v_now - p_interval;

  -- Create row if not exists to avoid issues with SELECT FOR UPDATE
  INSERT INTO ratelimit_windows (identifier, timestamps)
  VALUES (p_identifier, '{}'::BIGINT[])
  ON CONFLICT (identifier) DO NOTHING;

  -- Lock the row
  SELECT timestamps INTO v_timestamps
  FROM ratelimit_windows
  WHERE identifier = p_identifier
  FOR UPDATE;

  -- Filter old timestamps
  SELECT ARRAY(
    SELECT unnest(v_timestamps) AS t
    WHERE t > v_window_start
  ) INTO v_new_timestamps;
  
  IF v_new_timestamps IS NULL THEN
    v_new_timestamps := '{}'::BIGINT[];
  END IF;

  v_remaining := GREATEST(0, p_limit - COALESCE(array_length(v_new_timestamps, 1), 0));
  
  v_success := COALESCE(array_length(v_new_timestamps, 1), 0) < p_limit;

  IF v_success THEN
    v_new_timestamps := array_append(v_new_timestamps, v_now);
    v_remaining := v_remaining - 1;
  END IF;

  UPDATE ratelimit_windows
  SET timestamps = v_new_timestamps
  WHERE identifier = p_identifier;

  IF COALESCE(array_length(v_new_timestamps, 1), 0) > 0 THEN
    v_reset := v_new_timestamps[1] + p_interval;
  ELSE
    v_reset := v_now + p_interval;
  END IF;

  RETURN QUERY SELECT v_success, v_remaining, v_reset;
END;
$$ LANGUAGE plpgsql;
