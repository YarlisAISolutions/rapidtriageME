/**
 * Authentication Middleware for Firebase Functions
 * Supports Bearer token, API key (rtm_*), and JWT authentication
 */

import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { getSecretValues } from '../config/secrets.js';
import { Collections, getFirestore } from '../config/firebase.config.js';

/**
 * API Key structure stored in Firestore
 */
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  requestCount: number;
  rateLimit: number;
  permissions: string[];
  ipWhitelist: string[];
  isActive: boolean;
}

/**
 * Authenticated user information
 */
export interface AuthenticatedUser {
  type: 'api_token' | 'api_key' | 'jwt' | 'firebase';
  userId?: string;
  email?: string;
  keyId?: string;
  permissions?: string[];
  rateLimit?: number;
  ipWhitelist?: string[];
  legacy?: boolean;
  source?: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Extended Express Request with auth info
 */
export interface AuthenticatedRequest extends Request {
  auth?: AuthResult;
  user?: AuthenticatedUser;
}

/**
 * Authentication Middleware Class
 */
export class AuthMiddleware {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Verify JWT token
   */
  private async verifyJWT(token: string): Promise<AuthenticatedUser | null> {
    try {
      const secrets = getSecretValues();
      if (!secrets.jwtSecret) {
        console.warn('JWT_SECRET not configured');
        return null;
      }

      const decoded = jwt.verify(token, secrets.jwtSecret) as jwt.JwtPayload;

      return {
        type: 'jwt',
        userId: decoded.sub,
        email: decoded.email,
      };
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Verify Firebase ID token
   */
  private async verifyFirebaseToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      return {
        type: 'firebase',
        userId: decodedToken.uid,
        email: decodedToken.email,
      };
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return null;
    }
  }

  /**
   * Verify API key from Firestore
   */
  private async verifyApiKey(key: string): Promise<AuthenticatedUser | null> {
    try {
      // Query by key value
      const snapshot = await this.db
        .collection(Collections.API_KEYS)
        .where('key', '==', key)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const apiKey = { id: doc.id, ...doc.data() } as ApiKey;

      // Check if key has expired
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        return null;
      }

      // Update last used timestamp and request count
      await doc.ref.update({
        lastUsedAt: new Date().toISOString(),
        requestCount: admin.firestore.FieldValue.increment(1),
      });

      // Track daily requests
      const today = new Date().toISOString().split('T')[0];
      await this.db.collection(Collections.METRICS).doc(`apikey:${apiKey.id}:${today}`).set({
        date: today,
        keyId: apiKey.id,
        userId: apiKey.userId,
        requests: admin.firestore.FieldValue.increment(1),
      }, { merge: true });

      return {
        type: 'api_key',
        keyId: apiKey.id,
        userId: apiKey.userId,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist,
      };
    } catch (error) {
      console.error('API key verification failed:', error);
      return null;
    }
  }

  /**
   * Main verification method
   */
  async verify(request: Request): Promise<AuthResult> {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return { authenticated: false, error: 'No authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');

    // Check against static API tokens
    const secrets = getSecretValues();

    if (token === secrets.rapidtriageApiToken) {
      return {
        authenticated: true,
        user: {
          type: 'api_token',
          source: 'rapidtriage',
        },
      };
    }

    if (token === secrets.authToken) {
      return {
        authenticated: true,
        user: {
          type: 'api_token',
          legacy: true,
        },
      };
    }

    // Check if it's an API key (starts with rtm_)
    if (token.startsWith('rtm_')) {
      const user = await this.verifyApiKey(token);
      if (user) {
        return { authenticated: true, user };
      }
      return { authenticated: false, error: 'Invalid API key' };
    }

    // Try Firebase ID token first
    if (token.length > 100) {
      const firebaseUser = await this.verifyFirebaseToken(token);
      if (firebaseUser) {
        return { authenticated: true, user: firebaseUser };
      }
    }

    // Try JWT authentication
    if (token.split('.').length === 3) {
      const jwtUser = await this.verifyJWT(token);
      if (jwtUser) {
        return { authenticated: true, user: jwtUser };
      }
    }

    return { authenticated: false, error: 'Invalid token' };
  }

  /**
   * Express middleware function
   */
  middleware() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await this.verify(req);
        req.auth = result;
        req.user = result.user;

        if (!result.authenticated) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: result.error || 'Authentication required',
          });
          return;
        }

        next();
      } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Authentication error',
        });
      }
    };
  }

  /**
   * Optional auth middleware - doesn't reject unauthenticated requests
   */
  optionalMiddleware() {
    return async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await this.verify(req);
        req.auth = result;
        req.user = result.user;
      } catch (error) {
        console.error('Optional auth error:', error);
      }
      next();
    };
  }

  /**
   * Permission check middleware
   */
  requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.auth?.authenticated) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      const permissions = req.user?.permissions || [];
      if (!permissions.includes(permission) && !permissions.includes('admin')) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Missing required permission: ${permission}`,
        });
        return;
      }

      next();
    };
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();

// Export middleware functions for direct use
export const authenticate = authMiddleware.middleware();
export const optionalAuth = authMiddleware.optionalMiddleware();
export const requirePermission = (p: string) => authMiddleware.requirePermission(p);
