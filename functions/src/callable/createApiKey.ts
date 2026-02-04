/**
 * Create API Key Callable Function
 * Allows authenticated users to create new API keys
 */

import { onCall, CallableOptions, HttpsError } from 'firebase-functions/v2/https';
import { authService } from '../services/auth.service.js';
import { JWT_SECRET } from '../config/secrets.js';

/**
 * Request interface for creating API key
 */
interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresIn?: number; // Days until expiration
  rateLimit?: number;
  ipWhitelist?: string[];
}

/**
 * Response interface
 */
interface CreateApiKeyResponse {
  success: boolean;
  data?: {
    id: string;
    name: string;
    key: string;
    prefix: string;
    createdAt: string;
    expiresAt: string | null;
    permissions: string[];
    rateLimit: number;
  };
  message?: string;
  error?: string;
}

/**
 * Callable function options
 */
const options: CallableOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 30,
  secrets: [JWT_SECRET],
};

/**
 * Create API Key callable function
 */
export const createApiKey = onCall<CreateApiKeyRequest, Promise<CreateApiKeyResponse>>(
  options,
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { name, permissions, expiresIn, rateLimit, ipWhitelist } = request.data;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'API key name is required');
    }

    if (name.length > 100) {
      throw new HttpsError('invalid-argument', 'API key name must be 100 characters or less');
    }

    // Validate permissions if provided
    const validPermissions = ['read', 'write', 'admin', 'screenshot', 'logs', 'audit'];
    if (permissions) {
      if (!Array.isArray(permissions)) {
        throw new HttpsError('invalid-argument', 'Permissions must be an array');
      }
      for (const perm of permissions) {
        if (!validPermissions.includes(perm)) {
          throw new HttpsError('invalid-argument', `Invalid permission: ${perm}`);
        }
      }
    }

    // Validate expiresIn
    if (expiresIn !== undefined) {
      if (typeof expiresIn !== 'number' || expiresIn < 1 || expiresIn > 365) {
        throw new HttpsError('invalid-argument', 'expiresIn must be between 1 and 365 days');
      }
    }

    // Validate rateLimit
    if (rateLimit !== undefined) {
      if (typeof rateLimit !== 'number' || rateLimit < 10 || rateLimit > 10000) {
        throw new HttpsError('invalid-argument', 'rateLimit must be between 10 and 10000');
      }
    }

    try {
      const apiKey = await authService.createApiKey({
        userId: request.auth.uid,
        name: name.trim(),
        permissions: permissions || ['read', 'write'],
        expiresIn,
        rateLimit: rateLimit || 1000,
        ipWhitelist: ipWhitelist || [],
      });

      return {
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key, // Full key only shown once
          prefix: apiKey.prefix,
          createdAt: apiKey.createdAt,
          expiresAt: apiKey.expiresAt,
          permissions: apiKey.permissions,
          rateLimit: apiKey.rateLimit,
        },
        message: 'API key created successfully. Save this key - it will not be shown again.',
      };
    } catch (error) {
      console.error('Create API key error:', error);
      throw new HttpsError(
        'internal',
        'Failed to create API key',
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
