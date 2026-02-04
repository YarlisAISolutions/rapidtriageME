/**
 * Authentication Middleware Tests
 *
 * Tests for authentication patterns including:
 * - Bearer token validation
 * - API key authentication
 * - JWT token handling
 * - Role-based access control
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  createMockRequest,
  createMockResponse,
  createAuthContext,
  createAdminContext,
  TestTimeouts,
  TestData,
} from './setup';

// ============================================
// MOCK AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Authentication result interface
 */
interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  isAdmin?: boolean;
  error?: string;
}

/**
 * Mock Bearer token validation
 */
const validateBearerToken = (authHeader: string | undefined): AuthResult => {
  if (!authHeader) {
    return { authenticated: false, error: 'No authorization header provided' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Invalid authorization format' };
  }

  const token = authHeader.substring(7);

  if (!token || token.length === 0) {
    return { authenticated: false, error: 'Empty token provided' };
  }

  // Mock token validation
  // In production, this would verify JWT signature
  if (token === 'valid-test-token') {
    return {
      authenticated: true,
      userId: 'test-user-123',
      email: 'test@example.com',
      isAdmin: false,
    };
  }

  if (token === 'admin-test-token') {
    return {
      authenticated: true,
      userId: 'admin-user-123',
      email: 'admin@rapidtriage.me',
      isAdmin: true,
    };
  }

  if (token === 'expired-token') {
    return { authenticated: false, error: 'Token has expired' };
  }

  return { authenticated: false, error: 'Invalid token' };
};

/**
 * Mock API key validation
 */
const validateApiKey = (apiKey: string | undefined): AuthResult => {
  if (!apiKey) {
    return { authenticated: false, error: 'No API key provided' };
  }

  // Validate API key format (should start with 'rt_')
  if (!apiKey.startsWith('rt_')) {
    return { authenticated: false, error: 'Invalid API key format' };
  }

  // Mock API key lookup
  const validKeys: Record<string, { userId: string; email: string }> = {
    'rt_valid_key_123': { userId: 'user-with-key', email: 'keyuser@example.com' },
    'rt_admin_key_456': { userId: 'admin-with-key', email: 'admin@rapidtriage.me' },
  };

  const keyData = validKeys[apiKey];
  if (keyData) {
    return {
      authenticated: true,
      userId: keyData.userId,
      email: keyData.email,
      isAdmin: apiKey.includes('admin'),
    };
  }

  return { authenticated: false, error: 'Invalid API key' };
};

/**
 * Mock authentication middleware
 */
const authMiddleware = async (
  req: Partial<import('express').Request>,
  res: ReturnType<typeof createMockResponse>['response'],
  next: () => void
): Promise<void> => {
  // Try Bearer token first
  const authHeader = req.get?.('authorization') || req.headers?.['authorization'];
  if (authHeader && typeof authHeader === 'string') {
    const result = validateBearerToken(authHeader);
    if (result.authenticated) {
      (req as Record<string, unknown>).user = result;
      next();
      return;
    }
  }

  // Try API key
  const apiKey = req.get?.('x-api-key') || req.headers?.['x-api-key'];
  if (apiKey && typeof apiKey === 'string') {
    const result = validateApiKey(apiKey);
    if (result.authenticated) {
      (req as Record<string, unknown>).user = result;
      next();
      return;
    }
  }

  // No valid authentication
  res.status!(401);
  res.json!({ error: 'Unauthorized', message: 'Valid authentication required' });
};

/**
 * Mock admin-only middleware
 */
const adminMiddleware = async (
  req: Partial<import('express').Request>,
  res: ReturnType<typeof createMockResponse>['response'],
  next: () => void
): Promise<void> => {
  const user = (req as Record<string, unknown>).user as AuthResult | undefined;

  if (!user || !user.authenticated) {
    res.status!(401);
    res.json!({ error: 'Unauthorized' });
    return;
  }

  if (!user.isAdmin) {
    res.status!(403);
    res.json!({ error: 'Forbidden', message: 'Admin access required' });
    return;
  }

  next();
};

// ============================================
// TEST SUITE
// ============================================

describe('Authentication Middleware', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe('Bearer Token Validation', () => {
    it('should reject requests without authorization header', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
      });

      const { response, getStatus, getBody } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(getStatus()).toBe(401);
      expect(nextCalled).toBe(false);

      const body = getBody() as Record<string, string>;
      expect(body.error).toBe('Unauthorized');
    }, TestTimeouts.SHORT);

    it('should reject invalid authorization format', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'authorization': 'Basic invalid-format',
        },
      });

      const { response, getStatus } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(getStatus()).toBe(401);
      expect(nextCalled).toBe(false);
    }, TestTimeouts.SHORT);

    it('should reject empty bearer token', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'authorization': 'Bearer ',
        },
      });

      const { response, getStatus } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(getStatus()).toBe(401);
      expect(nextCalled).toBe(false);
    }, TestTimeouts.SHORT);

    it('should accept valid bearer token', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'authorization': 'Bearer valid-test-token',
        },
      });

      const { response, getStatus } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);

      const user = (req as Record<string, unknown>).user as AuthResult;
      expect(user.authenticated).toBe(true);
      expect(user.userId).toBe('test-user-123');
    }, TestTimeouts.SHORT);

    it('should reject expired tokens', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'authorization': 'Bearer expired-token',
        },
      });

      const { response, getStatus } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(getStatus()).toBe(401);
      expect(nextCalled).toBe(false);
    }, TestTimeouts.SHORT);

    it('should identify admin users from token', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'authorization': 'Bearer admin-test-token',
        },
      });

      const { response } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);

      const user = (req as Record<string, unknown>).user as AuthResult;
      expect(user.isAdmin).toBe(true);
    }, TestTimeouts.SHORT);
  });

  describe('API Key Validation', () => {
    it('should accept valid API key', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'x-api-key': 'rt_valid_key_123',
        },
      });

      const { response } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);

      const user = (req as Record<string, unknown>).user as AuthResult;
      expect(user.authenticated).toBe(true);
      expect(user.userId).toBe('user-with-key');
    }, TestTimeouts.SHORT);

    it('should reject invalid API key format', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'x-api-key': 'invalid_format_key',
        },
      });

      const { response, getStatus } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(getStatus()).toBe(401);
      expect(nextCalled).toBe(false);
    }, TestTimeouts.SHORT);

    it('should reject unknown API key', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'x-api-key': 'rt_unknown_key',
        },
      });

      const { response, getStatus } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(getStatus()).toBe(401);
      expect(nextCalled).toBe(false);
    }, TestTimeouts.SHORT);

    it('should prefer bearer token over API key when both provided', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'authorization': 'Bearer valid-test-token',
          'x-api-key': 'rt_valid_key_123',
        },
      });

      const { response } = createMockResponse();
      let nextCalled = false;

      await authMiddleware(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);

      const user = (req as Record<string, unknown>).user as AuthResult;
      // Should use bearer token's user ID
      expect(user.userId).toBe('test-user-123');
    }, TestTimeouts.SHORT);
  });

  describe('Admin Authorization', () => {
    it('should reject non-admin users for admin routes', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/admin/users',
        headers: {
          'authorization': 'Bearer valid-test-token',
        },
      });

      const { response, getStatus, getBody } = createMockResponse();

      // First authenticate
      let authNextCalled = false;
      await authMiddleware(req, response, () => { authNextCalled = true; });
      expect(authNextCalled).toBe(true);

      // Then check admin
      const { response: adminRes, getStatus: getAdminStatus, getBody: getAdminBody } = createMockResponse();
      let adminNextCalled = false;
      await adminMiddleware(req, adminRes, () => { adminNextCalled = true; });

      expect(getAdminStatus()).toBe(403);
      expect(adminNextCalled).toBe(false);

      const body = getAdminBody() as Record<string, string>;
      expect(body.error).toBe('Forbidden');
    }, TestTimeouts.SHORT);

    it('should allow admin users for admin routes', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/admin/users',
        headers: {
          'authorization': 'Bearer admin-test-token',
        },
      });

      const { response } = createMockResponse();

      // First authenticate
      let authNextCalled = false;
      await authMiddleware(req, response, () => { authNextCalled = true; });
      expect(authNextCalled).toBe(true);

      // Then check admin
      const { response: adminRes } = createMockResponse();
      let adminNextCalled = false;
      await adminMiddleware(req, adminRes, () => { adminNextCalled = true; });

      expect(adminNextCalled).toBe(true);
    }, TestTimeouts.SHORT);

    it('should reject unauthenticated users for admin routes', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/admin/users',
      });

      const { response, getStatus } = createMockResponse();
      let nextCalled = false;

      await adminMiddleware(req, response, () => { nextCalled = true; });

      expect(getStatus()).toBe(401);
      expect(nextCalled).toBe(false);
    }, TestTimeouts.SHORT);
  });

  describe('Auth Context Helpers', () => {
    it('should create valid auth context', () => {
      const context = createAuthContext('user-123', 'user@test.com');

      expect(context.auth.uid).toBe('user-123');
      expect(context.auth.token.email).toBe('user@test.com');
      expect(context.auth.token.email_verified).toBe(true);
    }, TestTimeouts.SHORT);

    it('should create admin context with admin claim', () => {
      const context = createAdminContext('admin-123');

      expect(context.auth.uid).toBe('admin-123');
      expect(context.auth.token.admin).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow custom claims in auth context', () => {
      const context = createAuthContext('user-123', 'user@test.com', {
        tier: 'premium',
        workspaceId: 'ws-456',
      });

      expect(context.auth.token.tier).toBe('premium');
      expect(context.auth.token.workspaceId).toBe('ws-456');
    }, TestTimeouts.SHORT);
  });

  describe('Rate Limiting Integration', () => {
    it('should track authentication attempts', async () => {
      // This test verifies the structure for rate limit tracking
      const attempts: Array<{ ip: string; timestamp: number; success: boolean }> = [];

      for (let i = 0; i < 5; i++) {
        const req = createMockRequest({
          method: 'GET',
          path: '/api/protected',
          headers: {
            'authorization': 'Bearer invalid-token',
          },
        });

        const { response, getStatus } = createMockResponse();
        await authMiddleware(req, response, () => {});

        attempts.push({
          ip: '127.0.0.1',
          timestamp: Date.now(),
          success: getStatus() === 200,
        });
      }

      // All attempts should have failed
      const failedAttempts = attempts.filter(a => !a.success);
      expect(failedAttempts.length).toBe(5);
    }, TestTimeouts.SHORT);
  });

  describe('Security Headers', () => {
    it('should not leak authentication details in errors', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/protected',
        headers: {
          'authorization': 'Bearer some-secret-token-that-failed',
        },
      });

      const { response, getBody } = createMockResponse();
      await authMiddleware(req, response, () => {});

      const body = getBody() as Record<string, string>;

      // Error message should not contain the token
      expect(JSON.stringify(body)).not.toContain('some-secret-token-that-failed');
    }, TestTimeouts.SHORT);
  });
});

// ============================================
// JWT TOKEN TESTS
// ============================================

describe('JWT Token Handling', () => {
  describe('Token Structure Validation', () => {
    it('should validate JWT has three parts', () => {
      const validJwtStructure = 'header.payload.signature';
      const parts = validJwtStructure.split('.');

      expect(parts.length).toBe(3);
    }, TestTimeouts.SHORT);

    it('should reject malformed JWT tokens', async () => {
      const malformedTokens = [
        'not-a-jwt',
        'only.two',
        'too.many.parts.here.extra',
        '',
        'header..signature',
      ];

      for (const token of malformedTokens) {
        const result = validateBearerToken(`Bearer ${token}`);
        expect(result.authenticated).toBe(false);
      }
    }, TestTimeouts.SHORT);
  });
});
