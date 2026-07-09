import pg from 'pg';
import { DATABASE_URL } from './env.js';

const { Pool } = pg;

const trimmedDatabaseUrl = DATABASE_URL.trim().replace(/^"(.+)"$/, '$1');
const cleanDatabaseUrl = trimmedDatabaseUrl
  ? trimmedDatabaseUrl.replace(/([?&])sslmode=[^&]*(&|$)/, (match, leading, trailing) => (leading === '?' && trailing ? '?' : leading === '?' ? '' : leading))
  : '';

const pool = new Pool({
  connectionString: cleanDatabaseUrl,
  ssl: { rejectUnauthorized: false },
});

const connectDB = async () => {
  let client: import('pg').PoolClient;
  try {
    client = await pool.connect();

    // messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        text TEXT NOT NULL,
        sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
        sender_name TEXT,
        room_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // users — mirrors auth.users (Supabase Auth identity)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        name TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'user'
              CHECK (role IN ('user','moderator','admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // trigger + trigger function: auth.users -> public.users
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
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
    `);

    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_user_update()
      RETURNS TRIGGER
      LANGUAGE plpgsql SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        UPDATE public.users
        SET email      = COALESCE(NEW.email, users.email),
            full_name  = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', users.full_name),
            avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', users.avatar_url),
            updated_at = NOW()
        WHERE users.id = NEW.id;
        RETURN NEW;
      END;
      $$;
    `);

    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;`);
    await client.query(`
      CREATE TRIGGER on_auth_user_updated
        AFTER UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
    `);

    // resources
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.resources (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('need','offer')),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT,
        source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to_name TEXT,
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
        deadline TIMESTAMPTZ,
        confidence FLOAT,
        ai_generated BOOLEAN DEFAULT false,
        created_by TEXT,
        is_deleted BOOLEAN DEFAULT false,
        deleted_at TIMESTAMPTZ,
        is_archived BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // task_activity
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.task_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        actor_id TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // task_assignments — user_id references public.users(id)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.task_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (task_id, user_id)
      );
    `);

    // documents
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN (
          'Decision', 'Meeting Summary', 'Catch Up Summary', 'Architecture',
          'Brainstorm', 'Research', 'Requirements', 'Sprint Summary',
          'Design Notes', 'General Documentation'
        )),
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','updating','waiting','final','archived')),
        summary TEXT,
        content TEXT,
        participants JSONB DEFAULT '[]',
        source_messages JSONB DEFAULT '[]',
        confidence FLOAT,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        archived BOOLEAN DEFAULT false
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_room_id ON public.documents(room_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);`);

    // notes
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN (
          'Reminder', 'Idea', 'Risk', 'Observation', 'Resource',
          'Decision', 'Insight', 'Architecture', 'Action Item', 'Conclusion'
        )),
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        confidence FLOAT NOT NULL DEFAULT 0.7,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        archived_at TIMESTAMPTZ
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_room_id ON public.notes(room_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_type ON public.notes(type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);`);

    // idempotent RLS enable
    await client.query(`ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE IF EXISTS public.resources ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE IF EXISTS public.task_activity ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE IF EXISTS public.task_assignments ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE IF EXISTS public.notes ENABLE ROW LEVEL SECURITY;`);

    // idempotent realtime registration
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public' AND tablename = 'messages'
        ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public' AND tablename = 'tasks'
        ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks; END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public' AND tablename = 'notes'
        ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.notes; END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime'
            AND schemaname = 'public' AND tablename = 'documents'
        ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.documents; END IF;
      END $$;
    `);

    await client.query(`ALTER TABLE IF EXISTS public.messages REPLICA IDENTITY FULL;`);
    await client.query(`ALTER TABLE IF EXISTS public.tasks REPLICA IDENTITY FULL;`);
    await client.query(`ALTER TABLE IF EXISTS public.notes REPLICA IDENTITY FULL;`);
    await client.query(`ALTER TABLE IF EXISTS public.documents REPLICA IDENTITY FULL;`);

    console.log('PostgreSQL connected successfully');
  } catch (error) {
    let dbHost = 'unknown';
    let dbUser = 'unknown';
    try {
      const dbUrl = new URL(cleanDatabaseUrl);
      dbHost = dbUrl.host;
      dbUser = dbUrl.username;
    } catch {
      // ignore
    }
    console.error('PostgreSQL connection error:', error.message || error);
    console.error('DATABASE_URL host:', dbHost);
    console.error('DATABASE_URL user:', dbUser);
    process.exit(1);
  } finally {
    client.release();
  }
};

export const getDB = () => pool;
export default connectDB;
