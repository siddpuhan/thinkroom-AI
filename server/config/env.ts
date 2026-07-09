import dotenv from 'dotenv';

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for backend environment variables.
//
// ESM guarantees this module's body runs before any module that imports it,
// so dotenv.config() always fires before the first process.env read.
// ─────────────────────────────────────────────────────────────────────────────
dotenv.config({ path: new URL('.env', import.meta.url) });
dotenv.config({ path: new URL('../.env', import.meta.url) });

function validateSupabaseUrl(raw: string | undefined, key: string): string {
  const value = raw?.trim();
  if (!value || value.includes('<your-project')) {
    console.error(
      `\n❌ Invalid ${key}: ${value ?? '<empty>'}\n` +
      `Expected format: https://your-project.supabase.co\n` +
      `Set ${key} in server/.env or the root .env file.\n`
    );
    process.exit(1);
  }
  if (!value.startsWith('https://')) {
    console.error(
      `\n❌ Invalid ${key}: ${value}\n` +
      `Expected format: https://your-project.supabase.co\n`
    );
    process.exit(1);
  }
  try {
    new URL(value);
  } catch {
    console.error(
      `\n❌ Invalid ${key}: ${value}\n` +
      `Expected format: https://your-project.supabase.co\n`
    );
    process.exit(1);
  }
  return value;
}

function requireKey(raw: string | undefined, key: string): string {
  const value = raw?.trim();
  if (!value || value.includes('<your-project')) {
    console.error(
      `\n❌ CRITICAL STARTUP ERROR: Missing required environment variable: ${key}\n` +
      `Set ${key} in server/.env or the root .env file.\n`
    );
    process.exit(1);
  }
  return value;
}

export const SUPABASE_URL = validateSupabaseUrl(process.env.SUPABASE_URL, 'SUPABASE_URL');
export const SUPABASE_ANON_KEY = requireKey(process.env.SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY');
export const DATABASE_URL = requireKey(process.env.DATABASE_URL, 'DATABASE_URL');
export const GEMINI_API_KEY = requireKey(process.env.GEMINI_API_KEY, 'GEMINI_API_KEY');
export const PORT = process.env.PORT || '5000';

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined;

console.log('Supabase URL: loaded ✓');
console.log('Anon Key: loaded ✓');
if (SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Service Role Key: loaded ✓');
}
console.log('Backend connected to Supabase ✓');
