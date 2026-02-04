/**
 * Revoke API Key Callable Function
 * Allows authenticated users to revoke their API keys
 */

import { onCall, CallableOptions, HttpsError } from 'firebase-functions/v2/https';
import { authService } from '../services/auth.service.js';
import { JWT_SECRET } from '../config/secrets.js';

/**
 * Request interface for revoking API key
 */
interface RevokeApiKeyRequest {
  keyId: string;
}

/**
 * Response interface
 */
interface RevokeApiKeyResponse {
  success: boolean;
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
 * Revoke API Key callable function
 */
export const revokeApiKey = onCall<RevokeApiKeyRequest, Promise<RevokeApiKeyResponse>>(
  options,
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { keyId } = request.data;

    // Validate input
    if (!keyId || typeof keyId !== 'string') {
      throw new HttpsError('invalid-argument', 'API key ID is required');
    }

    try {
      const revoked = await authService.revokeApiKey(keyId, request.auth.uid);

      if (!revoked) {
        throw new HttpsError('not-found', 'API key not found');
      }

      return {
        success: true,
        message: 'API key revoked successfully',
      };
    } catch (error) {
      // Handle authorization errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        throw new HttpsError('permission-denied', 'You can only revoke your own API keys');
      }

      // Handle not found
      if (error instanceof HttpsError) {
        throw error;
      }

      console.error('Revoke API key error:', error);
      throw new HttpsError(
        'internal',
        'Failed to revoke API key',
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
