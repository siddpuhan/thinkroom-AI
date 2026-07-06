import { JwtService } from './jwt.service.js';
import { UserSyncService } from './userSync.service.js';
import { PermissionsService } from './permissions.service.js';
import { Request, Response, NextFunction } from 'express';

export class AuthService {
  /**
   * Express middleware to require a valid Auth0 JWT.
   * Returns 401 Unauthorized if the token is invalid or missing.
   */
  public static requireAuth = JwtService.checkJwt;

  /**
   * Express middleware for Role-Based Access Control (RBAC).
   * Must be used AFTER requireAuth.
   */
  public static requireRole(requiredRole: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).auth?.payload?.sub;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized: Missing user ID in token' });
        }

        const userRole = await PermissionsService.getUserRole(userId);
        
        if (!PermissionsService.hasPermission(userRole, requiredRole)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        
        // Attach role to request for downstream use
        (req as any).userRole = userRole;
        next();
      } catch (err) {
        console.error('RBAC Error:', err);
        return res.status(500).json({ error: 'Internal server error during authorization' });
      }
    };
  }

  /**
   * Verify a raw token (used for Socket.IO connections).
   */
  public static async verifySocketToken(token: string) {
    return await JwtService.verifyToken(token);
  }

  /**
   * Sync a user profile to the local database.
   */
  public static async syncUser(id: string, name: string, email: string) {
    return await UserSyncService.syncUser(id, name, email);
  }
}
