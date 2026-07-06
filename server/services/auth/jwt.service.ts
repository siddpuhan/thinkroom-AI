import { auth } from 'express-oauth2-jwt-bearer';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';

// Load server and parent workspace env variables
dotenv.config({ path: new URL("./.env", import.meta.url) });
dotenv.config({ path: new URL("../../../.env.local", import.meta.url) });
dotenv.config({ path: new URL("../../../.env", import.meta.url) });

const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL || (process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : undefined);
const audience = process.env.AUTH0_AUDIENCE;

const hasAuth0Config = !!(issuerBaseUrl && audience);

export class JwtService {
  /**
   * Express middleware for protecting API routes
   */
  public static checkJwt = hasAuth0Config
    ? auth({
        audience: audience,
        issuerBaseURL: issuerBaseUrl,
        tokenSigningAlg: 'RS256'
      })
    : (req: any, res: any, next: any) => {
        console.error('CRITICAL: Request blocked. Auth0 configuration is missing! AUTH0_ISSUER_BASE_URL or AUTH0_AUDIENCE is not set.');
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Authentication service is not properly configured. Missing required Auth0 environment variables.'
        });
      };

  private static client = hasAuth0Config
    ? jwksClient({
        jwksUri: `${issuerBaseUrl}/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
      })
    : null;

  private static getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    if (!hasAuth0Config) {
      return callback(new Error('Auth0 configuration is missing'));
    }
    if (!header.kid) {
      return callback(new Error('No kid found in JWT header'));
    }
    JwtService.client!.getSigningKey(header.kid, (err, key) => {
      if (err) {
        return callback(err);
      }
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  }

  /**
   * Verifies a raw JWT string (useful for Socket.IO connection handling)
   */
  public static verifyToken(token: string): Promise<any> {
    if (!hasAuth0Config) {
      return Promise.reject(new Error('Auth0 configuration is missing'));
    }
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        JwtService.getKey,
        {
          audience: audience,
          issuer: `${issuerBaseUrl}/`,
          algorithms: ['RS256']
        },
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });
  }
}

