import { getDB } from '../../config/db.js';

export class UserSyncService {
  public static async syncUser(id: string, name: string, email: string, avatarUrl?: string) {
    const db = getDB();
    const query = `
      INSERT INTO public.users (id, name, email, full_name, avatar_url, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name      = EXCLUDED.name,
        email     = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        avatar_url= COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        updated_at= NOW()
      RETURNING *
    `;
    const values = [id, name, email, name, avatarUrl || null];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}
