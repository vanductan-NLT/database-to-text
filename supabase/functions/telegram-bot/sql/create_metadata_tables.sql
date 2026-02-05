-- Database tables to support Smart Metadata Lookup and Auditing

-- 1. Metadata Table: Stores information about each table for dynamic context building
CREATE TABLE IF NOT EXISTS public.bot_table_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  description text,
  keywords text[],
  full_schema text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Audit Log Table: Tracks every query processed by the bot
CREATE TABLE IF NOT EXISTS public.bot_query_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  question text NOT NULL,
  generated_sql text,
  execution_status text, -- 'SUCCESS', 'ERROR', 'VALIDATION_FAILED'
  error_message text,
  execution_time_ms integer,
  row_count integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (Security)
ALTER TABLE public.bot_table_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_query_audit_log ENABLE ROW LEVEL SECURITY;

-- Grant access to service_role (Edge Functions)
GRANT ALL ON public.bot_table_metadata TO service_role;
GRANT ALL ON public.bot_query_audit_log TO service_role;

-- Allow anon/authenticated to read metadata (optional, but edge function uses service_role usually)
GRANT SELECT ON public.bot_table_metadata TO anon;
GRANT SELECT ON public.bot_table_metadata TO authenticated;
