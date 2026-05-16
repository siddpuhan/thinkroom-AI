import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../../.env', import.meta.url) });

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

    // Create AI documents table (decisions, meeting notes, architecture, summaries)
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        summary TEXT,
        type TEXT NOT NULL CHECK(type IN ('decision', 'meeting_notes', 'architecture', 'summary')),
        participants JSONB DEFAULT '[]',
        source_messages JSONB DEFAULT '[]',
        confidence FLOAT,
        created_by_ai BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_room_id ON documents(room_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);`);

    // Create lightweight decisions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS decisions (
        decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id TEXT NOT NULL,
        title TEXT NOT NULL,
        decision TEXT NOT NULL,
        reason TEXT,
        participants JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_decisions_room_id ON decisions(room_id);`);

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
