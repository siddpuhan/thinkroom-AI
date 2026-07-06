import { getDB } from '../../config/db.js';

export class PermissionsService {
  /**
   * Retrieves the role assigned to a user in the local database.
   */
  public static async getUserRole(userId: string): Promise<string> {
    const db = getDB();
    const result = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return 'user'; // Default role
    }
    return result.rows[0].role || 'user';
  }

  /**
   * Evaluates if a user role has the required permission level.
   * Simple hierarchy: admin > moderator > user
   */
  public static hasPermission(userRole: string, requiredRole: string): boolean {
    const hierarchy = ['user', 'moderator', 'admin'];
    const userLevel = hierarchy.indexOf(userRole);
    const requiredLevel = hierarchy.indexOf(requiredRole);

    if (userLevel === -1 || requiredLevel === -1) {
      return false;
    }
    return userLevel >= requiredLevel;
  }
}
