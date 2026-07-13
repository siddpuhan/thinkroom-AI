import { createClient } from '@supabase/supabase-js';
import { UserSyncService } from './userSync.service.js';
import { PermissionsService } from './permissions.service.js';
import { Request, Response, NextFunction } from 'express';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class AuthService {
  /**
   * Express middleware to require a valid Supabase JWT.
   * Reads the Bearer token from the Authorization header, validates it
   * against Supabase, and attaches the user payload to req.user.
   */
  public static requireAuth = async (req: any, res: any, next: NextFunction) => {
    try {
      console.log("\n=========================");
      console.log("REQUEST:", req.originalUrl);

      const authHeader = req.headers.authorization;
      console.log("AUTH HEADER:", authHeader?.substring(0, 50));

      if (!authHeader?.startsWith("Bearer ")) {
        console.log("❌ No Bearer token");
        return res.status(401).json({ error: "Missing authorization header" });
      }

      const token = authHeader.slice(7);

      console.log("TOKEN LENGTH:", token.length);
      console.log("SUPABASE URL:", SUPABASE_URL);

      const { data: { user }, error } = await supabase.auth.getUser(token);

      console.log("USER:", user);
      console.log("ERROR:", error);

      if (error || !user) {
        return res.status(401).json({
          error: "Invalid or expired token",
          supabaseError: error,
        });
      }

      req.user = {
        id: user.id,
        email: user.email,
        ...(user.user_metadata || {}),
      };

      console.log("✅ AUTH PASSED");

      next();
    } catch (e) {
      console.error("Token verification error:", e);
      return res.status(401).json({ error: "Token verification failed" });
    }
  };

  /**
   * Express middleware for Role-Based Access Control (RBAC).
   * Must be used AFTER requireAuth.
   */
  public static requireRole(requiredRole: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized: Missing user ID in token' });
        }

        const userRole = await PermissionsService.getUserRole(userId);

        if (!PermissionsService.hasPermission(userRole, requiredRole)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

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
    if (process.env.NODE_ENV === 'development' && token === 'mock-development-token') {
      return {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'mock-dev@example.com',
        full_name: 'Mock Developer',
      };
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }
    return {
      id: user.id,
      email: user.email,
      ...(user.user_metadata || {}),
    };
  }

  /**
   * Sync a user profile to the local database.
   */
  public static async syncUser(id: string, name: string, email: string, avatarUrl?: string) {
    return UserSyncService.syncUser(id, name, email, avatarUrl);
  }
}
