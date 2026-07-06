import { getDB } from '../../config/db.js';

export class UserSyncService {
  /**
   * Upserts the user into the database based on the Auth0 ID token claims.
   * This handles syncing the user profile from Auth0 to Postgres.
   */
  public static async syncUser(id: string, name: string, email: string) {
    const db = getDB();
    const query = `
      INSERT INTO users (id, name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name, email = EXCLUDED.email
      RETURNING *
    `;
    const values = [id, name, email];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}
