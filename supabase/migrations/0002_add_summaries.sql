-- Migration: 0002_add_summaries.sql
-- Description: Create summaries table, enable RLS, set policies, and register for realtime.

CREATE TABLE IF NOT EXISTS public.summaries (
  room_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all operations
DROP POLICY IF EXISTS "summaries_all_authenticated" ON public.summaries;
CREATE POLICY "summaries_all_authenticated" ON public.summaries
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Register for Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'summaries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.summaries;
  END IF;
END $$;

ALTER TABLE public.summaries REPLICA IDENTITY FULL;
