-- SQL function for Telegram Bot to execute READ-only queries safely
-- This function uses SECURITY DEFINER to bypass RLS while still validating queries
-- Execute this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION execute_bot_query(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with owner privileges (bypasses RLS)
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- VALIDATION 1: Must start with SELECT or WITH (for CTEs)
  IF NOT (trim(upper(query_text)) ~ '^(SELECT|WITH)') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- VALIDATION 2: Block destructive keywords
  IF query_text ~* '\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXECUTE)\b' THEN
    RAISE EXCEPTION 'Destructive operations are not allowed';
  END IF;

  -- Execute and return as JSON
  EXECUTE 'SELECT json_agg(t) FROM (' || query_text || ') t' INTO result;
  
  -- Return empty array instead of null for no results
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query error: %', SQLERRM;
END;
$$;

-- Grant execute permission to anon role (for Edge Functions with anon key)
GRANT EXECUTE ON FUNCTION execute_bot_query(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION execute_bot_query(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION execute_bot_query IS 'Safely execute READ-only SQL for Telegram Bot. Validates queries before execution.';
