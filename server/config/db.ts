import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url) });

const { Pool } = pg;

const rawDatabaseUrl = process.env.DATABASE_URL;
const trimmedDatabaseUrl = rawDatabaseUrl ? rawDatabaseUrl.trim().replace(/^"(.+)"$/, '$1') : '';
const databaseUrl = trimmedDatabaseUrl
  ? trimmedDatabaseUrl.replace(/([?&])sslmode=[^&]*(&|$)/, (match, leading, trailing) => (leading === '?' && trailing ? '?' : leading === '?' ? '' : leading))
  : '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Add it to the root .env file.');
}

// Connect to PostgreSQL using Supabase connection string from environment variables
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    
    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        text TEXT NOT NULL,
        sender_id TEXT,
        sender_name TEXT,
        room_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, -- Clerk ID
        name TEXT,
        email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create resources table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('need', 'offer')),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create tasks table
    // NOTE: assigned_to_name is a plain TEXT field (display name), NOT a FK to users.
    // This avoids FK violations when AI assigns tasks to names not registered as users.
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT,
        source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to_name TEXT,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        deadline TIMESTAMP WITH TIME ZONE,
        confidence FLOAT,
        ai_generated BOOLEAN DEFAULT false,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: If old column 'assigned_to' exists (with FK), rename it and add assigned_to_name
    try {
      await client.query(`
        DO $$
        BEGIN
          -- Add status if an older tasks table exists without it
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='tasks' AND column_name='status'
          ) THEN
            ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'pending';
          END IF;

          -- Add assigned_to_name if missing
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='tasks' AND column_name='assigned_to_name'
          ) THEN
            ALTER TABLE tasks ADD COLUMN assigned_to_name TEXT;
          END IF;
          -- Drop old FK column if it exists
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='tasks' AND column_name='assigned_to'
          ) THEN
            ALTER TABLE tasks DROP COLUMN assigned_to;
          END IF;
          -- Add 'cancelled' to status check if not already (re-add constraint)
          -- We do this by dropping and re-adding the constraint
          BEGIN
            ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
            ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
              CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled'));
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END $$;
      `);
      console.log("Tasks table migration completed");
    } catch (migErr) {
      console.warn("Tasks migration warning (non-fatal):", migErr.message);
    }

    // Migration: Add soft-delete and archive columns to tasks, documents, and decisions
    try {
      await client.query(`
        DO $$
        BEGIN
          -- Add is_deleted, deleted_at, is_archived to tasks
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_deleted') THEN
            ALTER TABLE tasks ADD COLUMN is_deleted BOOLEAN DEFAULT false;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='deleted_at') THEN
            ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_archived') THEN
            ALTER TABLE tasks ADD COLUMN is_archived BOOLEAN DEFAULT false;
          END IF;

          -- Add is_deleted, deleted_at, is_archived to documents
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='is_deleted') THEN
            ALTER TABLE documents ADD COLUMN is_deleted BOOLEAN DEFAULT false;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='deleted_at') THEN
            ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='is_archived') THEN
            ALTER TABLE documents ADD COLUMN is_archived BOOLEAN DEFAULT false;
          END IF;

          -- Add is_deleted, deleted_at, is_archived to decisions
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decisions' AND column_name='is_deleted') THEN
            ALTER TABLE decisions ADD COLUMN is_deleted BOOLEAN DEFAULT false;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decisions' AND column_name='deleted_at') THEN
            ALTER TABLE decisions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='decisions' AND column_name='is_archived') THEN
            ALTER TABLE decisions ADD COLUMN is_archived BOOLEAN DEFAULT false;
          END IF;
        END $$;
      `);
      console.log("Soft-delete and archive columns migration completed");
    } catch (migErr) {
      console.warn("Soft-delete migration warning (non-fatal):", migErr.message);
    }


    // Create task activity table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_activity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        actor_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create task assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        assigned_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Drop legacy redundant tables
    await client.query(`DROP TABLE IF EXISTS decisions CASCADE;`);

    // We will drop and recreate documents table to enforce the new schema.
    await client.query(`DROP TABLE IF EXISTS documents CASCADE;`);

    // Create single knowledge hub documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN (
          'Decision', 'Meeting Summary', 'Catch Up Summary', 'Architecture', 
          'Brainstorm', 'Research', 'Requirements', 'Sprint Summary', 
          'Design Notes', 'General Documentation'
        )),
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'updating', 'waiting', 'final', 'archived')),
        summary TEXT,
        content TEXT,
        participants JSONB DEFAULT '[]',
        source_messages JSONB DEFAULT '[]',
        confidence FLOAT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE,
        archived BOOLEAN DEFAULT false
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_room_id ON documents(room_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);`);

    // Create AI notes table (independent from tasks and decisions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('Reminder', 'Idea', 'Risk', 'Observation', 'Resource')),
        title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        confidence FLOAT NOT NULL DEFAULT 0.7,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE,
        archived_at TIMESTAMP WITH TIME ZONE
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_room_id ON notes(room_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);`);
    await client.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';`);
    await client.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS confidence FLOAT NOT NULL DEFAULT 0.7;`);
    await client.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_by TEXT;`);
    await client.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);
    await client.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`);
    await client.query(`ALTER TABLE notes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;`);

    // Migration: Update notes check constraint to allow new note types
    try {
      await client.query(`
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_type_check;
            ALTER TABLE notes ADD CONSTRAINT notes_type_check
              CHECK(type IN ('Reminder', 'Idea', 'Risk', 'Observation', 'Resource', 'Decision', 'Insight', 'Architecture', 'Action Item', 'Conclusion'));
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END $$;
      `);
      console.log("Notes check constraint migration completed");
    } catch (migErr: any) {
      console.warn("Notes check constraint migration warning (non-fatal):", migErr.message);
    }

    // Drop legacy summaries table
    await client.query(`DROP TABLE IF EXISTS summaries CASCADE;`);

    console.log("PostgreSQL connected successfully");
    client.release();
  } catch (error) {
    let dbHost = 'unknown';
    let dbUser = 'unknown';
    try {
      const dbUrl = new URL(databaseUrl);
      dbHost = dbUrl.host;
      dbUser = dbUrl.username;
    } catch {
      // Ignore URL parsing errors; report unknown host.
    }
    console.error('PostgreSQL connection error:', error.message || error);
    console.error('DATABASE_URL host:', dbHost);
    console.error('DATABASE_URL user:', dbUser);
    process.exit(1);
  }
};

export const getDB = () => pool;

export default connectDB;
