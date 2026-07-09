-- ============================================================================
-- ThinkRoom AI — Initial Supabase Migration (Auth0 → Supabase Auth)
-- ============================================================================
-- Run this ONCE on a fresh Supabase project (SQL Editor or `supabase db push`).
-- It is fully idempotent: safe to re-run.
--
-- What it does:
--   1. Creates the public schema tables with UUID ownership fields.
--   2. Links public.users.id -> auth.users.id (Supabase Auth identity).
--   3. Creates an AFTER INSERT/UPDATE trigger that mirrors auth.users
--      into public.users (id, email, full_name, avatar_url, ...).
--   4. Enables Row Level Security with auth.uid() policies.
--   5. Enables Supabase Realtime for messages/tasks/notes/documents.
--   6. Adds indexes and constraints.
--
-- IMPORTANT:
--   * The Express backend connects with the `postgres` role (via the pooler
--     connection string) which has BYPASSRLS, so RLS never blocks the API.
--   * created_by / actor_id / assigned_by / assigned_to_name are kept as TEXT
--     on purpose: the server writes sentinel strings such as 'AI_SYSTEM' and
--     display names there, so they are NOT user FKs. The real user FKs are
--     messages.sender_id and task_assignments.user_id.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLES
-- ----------------------------------------------------------------------------

-- Mirror of Supabase Auth identities.
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  name        TEXT,                                  -- legacy display name (back-compat)
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'moderator', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages. sender_id is a real Supabase user UUID (nullable).
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL,
  sender_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  room_id     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disaster-relief resource board (needs / offers).
CREATE TABLE IF NOT EXISTS public.resources (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('need', 'offer')),
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI-extracted tasks.
CREATE TABLE IF NOT EXISTS public.tasks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id            TEXT,
  source_message_id  UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  assigned_to_name   TEXT,                            -- display name, NOT a user FK
  priority           TEXT DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status             TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  deadline           TIMESTAMPTZ,
  confidence         FLOAT,
  ai_generated       BOOLEAN DEFAULT false,
  created_by         TEXT,                            -- may be 'AI_SYSTEM' sentinel
  is_deleted         BOOLEAN DEFAULT false,
  deleted_at         TIMESTAMPTZ,
  is_archived        BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_activity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_id      TEXT,                                -- may be 'SYSTEM' sentinel
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, user_id)
);

-- Knowledge-hub documents (also stores decisions / summaries via `category`).
CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN (
                  'Decision', 'Meeting Summary', 'Catch Up Summary', 'Architecture',
                  'Brainstorm', 'Research', 'Requirements', 'Sprint Summary',
                  'Design Notes', 'General Documentation'
                )),
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'updating', 'waiting', 'final', 'archived')),
  summary      TEXT,
  content      TEXT,
  participants JSONB DEFAULT '[]',
  source_messages JSONB DEFAULT '[]',
  confidence   FLOAT,
  created_by   TEXT,                                 -- may be 'AI_SYSTEM' sentinel
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  archived     BOOLEAN DEFAULT false
);

-- AI shadow-notes.
CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
                'Reminder', 'Idea', 'Risk', 'Observation', 'Resource',
                'Decision', 'Insight', 'Architecture', 'Action Item', 'Conclusion'
              )),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  confidence  FLOAT NOT NULL DEFAULT 0.7,
  created_by  TEXT,                                  -- may be 'AI_SYSTEM' sentinel
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. TRIGGER: auth.users  ->  public.users  (user synchronization)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Keep public.users in sync when the Auth user is updated (email / avatar).
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET email      = COALESCE(NEW.email, users.email),
      full_name  = COALESCE(
                    NEW.raw_user_meta_data->>'full_name',
                    NEW.raw_user_meta_data->>'name',
                    users.full_name
                  ),
      avatar_url = COALESCE(
                    NEW.raw_user_meta_data->>'avatar_url',
                    users.avatar_url
                  ),
      updated_at = NOW()
  WHERE users.id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_messages_room_id     ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at  ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id  ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_tasks_room_id       ON public.tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at    ON public.tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_room_id       ON public.notes(room_id);
CREATE INDEX IF NOT EXISTS idx_notes_type          ON public.notes(type);
CREATE INDEX IF NOT EXISTS idx_notes_created_at    ON public.notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_room_id   ON public.documents(room_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status    ON public.documents(status);

CREATE INDEX IF NOT EXISTS idx_task_activity_task_id    ON public.task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON public.task_assignments(user_id);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY  (backend bypasses via postgres role; these protect
--    direct client access and document the intended ownership model)
-- ----------------------------------------------------------------------------

ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes         ENABLE ROW LEVEL SECURITY;

-- users: anyone authenticated can read; a user may only insert/update their own row.
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Content tables: room-scoped collaboration. No per-row user ownership column
-- exists (rooms are identified by room_id TEXT), so we require an authenticated
-- session for any operation. The API (service role) is unaffected.
DROP POLICY IF EXISTS "messages_all_authenticated" ON public.messages;
CREATE POLICY "messages_all_authenticated" ON public.messages
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "resources_all_authenticated" ON public.resources;
CREATE POLICY "resources_all_authenticated" ON public.resources
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_all_authenticated" ON public.tasks;
CREATE POLICY "tasks_all_authenticated" ON public.tasks
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "task_activity_all_authenticated" ON public.task_activity;
CREATE POLICY "task_activity_all_authenticated" ON public.task_activity
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "task_assignments_all_authenticated" ON public.task_assignments;
CREATE POLICY "task_assignments_all_authenticated" ON public.task_assignments
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "documents_all_authenticated" ON public.documents;
CREATE POLICY "documents_all_authenticated" ON public.documents
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notes_all_authenticated" ON public.notes;
CREATE POLICY "notes_all_authenticated" ON public.notes
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 5. REALTIME  (registers tables on the supabase_realtime publication)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  END IF;
END $$;

-- Replica identity FULL lets UPDATE/DELETE realtime events carry old values.
ALTER TABLE public.messages  REPLICA IDENTITY FULL;
ALTER TABLE public.tasks     REPLICA IDENTITY FULL;
ALTER TABLE public.notes     REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;
