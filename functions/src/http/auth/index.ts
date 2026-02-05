/**
 * Authentication Routes HTTP Function
 * Handles user authentication, token generation, and API key management
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { getCorsHeaders } from '../../config/cors.config.js';
import { authService } from '../../services/auth.service.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { RAPIDTRIAGE_API_TOKEN, JWT_SECRET } from '../../config/secrets.js';

/**
 * HTTP Function options
 */
const options: HttpsOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 30,
  minInstances: 0,
  maxInstances: 20,
  secrets: [RAPIDTRIAGE_API_TOKEN, JWT_SECRET],
};

/**
 * Handle authentication routes
 */
async function handleAuthRequest(req: Request, res: Response): Promise<void> {
  const path = req.path.replace(/^\/auth/, '') || '/';
  const method = req.method;

  try {
    // Login endpoint - creates a custom token for client-side Firebase auth
    if (path === '/login' && method === 'POST') {
      const { email, password, idToken } = req.body;

      // Option 1: Exchange Firebase ID token (from client-side signInWithEmailAndPassword)
      if (idToken) {
        try {
          const decodedToken = await authService.verifyIdToken(idToken);
          if (!decodedToken) {
            res.status(401).json({
              success: false,
              error: 'Invalid ID token',
            });
            return;
          }

          // Get or create user profile
          const user = await authService.getOrCreateUser(
            decodedToken.uid,
            decodedToken.email || '',
            decodedToken.name
          );

          // Generate our JWT tokens
          const accessToken = authService.generateToken(user.uid, user.email);
          const refreshToken = authService.generateRefreshToken(user.uid);

          res.status(200).json({
            success: true,
            data: {
              accessToken,
              refreshToken,
              expiresIn: 86400,
              user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                plan: user.plan,
              },
            },
          });
          return;
        } catch (error) {
          res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          return;
        }
      }

      // Option 2: Email/password validation (for creating custom token)
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required, or provide an idToken',
        });
        return;
      }

      // For email/password login, client should use Firebase Auth SDK directly,
      // then exchange the ID token. Return guidance on the proper flow.
      res.status(200).json({
        success: true,
        message: 'Use Firebase Auth SDK for login',
        instructions: {
          step1: 'Call signInWithEmailAndPassword(auth, email, password) on the client',
          step2: 'Get the ID token: const idToken = await user.getIdToken()',
          step3: 'POST to /auth/login or /auth/token with { idToken } to get API tokens',
        },
        endpoints: {
          login: 'POST /auth/login with { idToken }',
          token: 'POST /auth/token with { idToken }',
          verify: 'POST /auth/verify with Bearer token',
        },
      });
      return;
    }

    // Token exchange endpoint
    if (path === '/token' && method === 'POST') {
      const { idToken, refreshToken } = req.body;

      if (idToken) {
        // Verify Firebase ID token and generate JWT
        const decodedToken = await authService.verifyIdToken(idToken);

        if (!decodedToken) {
          res.status(401).json({
            success: false,
            error: 'Invalid ID token',
          });
          return;
        }

        // Get or create user profile
        const user = await authService.getOrCreateUser(
          decodedToken.uid,
          decodedToken.email || '',
          decodedToken.name
        );

        // Generate tokens
        const accessToken = authService.generateToken(user.uid, user.email);
        const newRefreshToken = authService.generateRefreshToken(user.uid);

        res.status(200).json({
          success: true,
          data: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 86400, // 24 hours
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              plan: user.plan,
            },
          },
        });
        return;
      }

      if (refreshToken) {
        // Verify refresh token and generate new access token
        const payload = authService.verifyToken(refreshToken);

        if (!payload || payload.type !== 'refresh') {
          res.status(401).json({
            success: false,
            error: 'Invalid refresh token',
          });
          return;
        }

        const accessToken = authService.generateToken(payload.sub);

        res.status(200).json({
          success: true,
          data: {
            accessToken,
            expiresIn: 86400,
          },
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'idToken or refreshToken required',
      });
      return;
    }

    // Verify token endpoint
    if (path === '/verify' && method === 'POST') {
      const authResult = await authMiddleware.verify(req);

      res.status(200).json({
        success: true,
        authenticated: authResult.authenticated,
        user: authResult.user,
      });
      return;
    }

    // Get user profile
    if (path === '/me' && method === 'GET') {
      const authResult = await authMiddleware.verify(req);

      if (!authResult.authenticated || !authResult.user?.userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const user = await authService.getOrCreateUser(
        authResult.user.userId,
        authResult.user.email || ''
      );

      res.status(200).json({
        success: true,
        data: user,
      });
      return;
    }

    // API Keys management
    if (path === '/api-keys') {
      const authResult = await authMiddleware.verify(req);

      if (!authResult.authenticated || !authResult.user?.userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const userId = authResult.user.userId;

      if (method === 'GET') {
        // List API keys
        const keys = await authService.getUserApiKeys(userId);
        res.status(200).json({
          success: true,
          data: keys,
        });
        return;
      }

      if (method === 'POST') {
        // Create API key
        const { name, permissions, expiresIn, rateLimit } = req.body;

        if (!name) {
          res.status(400).json({
            success: false,
            error: 'API key name is required',
          });
          return;
        }

        const apiKey = await authService.createApiKey({
          userId,
          name,
          permissions,
          expiresIn,
          rateLimit,
        });

        res.status(201).json({
          success: true,
          data: {
            ...apiKey,
            // Only show full key on creation
            key: apiKey.key,
          },
          message: 'Save this API key - it will not be shown again',
        });
        return;
      }
    }

    // Revoke API key
    if (path.startsWith('/api-keys/') && method === 'DELETE') {
      const authResult = await authMiddleware.verify(req);

      if (!authResult.authenticated || !authResult.user?.userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const keyId = path.split('/').pop();
      if (!keyId) {
        res.status(400).json({
          success: false,
          error: 'API key ID required',
        });
        return;
      }

      const revoked = await authService.revokeApiKey(keyId, authResult.user.userId);

      res.status(200).json({
        success: revoked,
        message: revoked ? 'API key revoked' : 'API key not found',
      });
      return;
    }

    // Logout
    if (path === '/logout' && method === 'POST') {
      // In a stateless JWT setup, logout is handled client-side
      // Could implement token blacklisting if needed
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
      return;
    }

    // Route not found
    res.status(404).json({
      success: false,
      error: 'Auth endpoint not found',
      path,
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Auth HTTP Function
 * Handles /auth/* routes
 */
export const auth = onRequest(options, async (request, response) => {
  // Handle CORS
  const origin = request.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.set(key, value);
  });

  // Handle preflight
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  await handleAuthRequest(request, response);
});
