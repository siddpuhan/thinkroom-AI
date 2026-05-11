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
