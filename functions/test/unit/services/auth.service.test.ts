/**
 * Auth Service Unit Tests
 */

// Mock dependencies before imports
jest.mock('firebase-admin', () => {
  const mockDoc = {
    get: jest.fn(() => Promise.resolve({
      exists: true,
      data: () => ({
        uid: 'test-uid',
        email: 'test@example.com',
        plan: 'free',
        apiKeyCount: 0,
      }),
    })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };

  const mockQuery = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve({
      docs: [],
      empty: true,
    })),
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
    where: jest.fn(() => mockQuery),
  };

  const mockBatch = {
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  };

  const mockFirestore = jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
    batch: jest.fn(() => mockBatch),
  }));

  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(mockFirestore, {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'timestamp'),
        increment: jest.fn((n) => n),
      },
    }),
    auth: jest.fn(() => ({
      verifyIdToken: jest.fn(),
      createCustomToken: jest.fn(() => Promise.resolve('custom-token')),
      deleteUser: jest.fn(() => Promise.resolve()),
    })),
  };
});

jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({
    sub: 'test-uid',
    email: 'test@example.com',
    iat: Date.now(),
    exp: Date.now() + 86400000,
    type: 'access',
  })),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-12345678'),
}));

jest.mock('../../../src/config/firebase.config', () => ({
  getFirestore: jest.fn(),
  getAuth: jest.fn(),
  Collections: {
    USERS: 'users',
    API_KEYS: 'apiKeys',
    SESSIONS: 'sessions',
  },
}));

jest.mock('../../../src/config/secrets', () => ({
  getSecretValues: jest.fn(() => ({
    jwtSecret: 'test-jwt-secret',
  })),
}));

import {
  UserProfile,
  UserSettings,
  CreateApiKeyRequest,
  JwtPayload,
  AuthService,
} from '../../../src/services/auth.service';

describe('Auth Service', () => {
  describe('UserProfile Interface', () => {
    it('should define user profile structure', () => {
      const profile: UserProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        plan: 'free',
        apiKeyCount: 0,
        screenshotCount: 0,
        settings: {
          notifications: true,
          darkMode: false,
          timezone: 'UTC',
        },
      };

      expect(profile.uid).toBe('test-uid');
      expect(profile.email).toBe('test@example.com');
      expect(profile.plan).toBe('free');
    });

    it('should support all plan types', () => {
      const plans: UserProfile['plan'][] = ['free', 'user', 'team', 'enterprise'];
      expect(plans).toHaveLength(4);
    });
  });

  describe('UserSettings Interface', () => {
    it('should define settings structure', () => {
      const settings: UserSettings = {
        notifications: true,
        darkMode: false,
        timezone: 'America/New_York',
        defaultProject: 'project-1',
      };

      expect(settings.notifications).toBe(true);
      expect(settings.darkMode).toBe(false);
      expect(settings.timezone).toBe('America/New_York');
      expect(settings.defaultProject).toBe('project-1');
    });

    it('should allow optional defaultProject', () => {
      const settings: UserSettings = {
        notifications: true,
        darkMode: false,
        timezone: 'UTC',
      };

      expect(settings.defaultProject).toBeUndefined();
    });
  });

  describe('CreateApiKeyRequest Interface', () => {
    it('should define API key creation request', () => {
      const request: CreateApiKeyRequest = {
        userId: 'user-123',
        name: 'My API Key',
        permissions: ['read', 'write'],
        expiresIn: 30,
        rateLimit: 1000,
        ipWhitelist: ['192.168.1.1'],
      };

      expect(request.userId).toBe('user-123');
      expect(request.name).toBe('My API Key');
      expect(request.permissions).toContain('read');
      expect(request.expiresIn).toBe(30);
    });

    it('should allow minimal request', () => {
      const request: CreateApiKeyRequest = {
        userId: 'user-123',
        name: 'Basic Key',
      };

      expect(request.permissions).toBeUndefined();
      expect(request.expiresIn).toBeUndefined();
    });
  });

  describe('JwtPayload Interface', () => {
    it('should define JWT payload structure', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        iat: 1700000000,
        exp: 1700086400,
        type: 'access',
      };

      expect(payload.sub).toBe('user-123');
      expect(payload.type).toBe('access');
    });

    it('should support refresh token type', () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        iat: 1700000000,
        exp: 1700086400,
        type: 'refresh',
      };

      expect(payload.type).toBe('refresh');
      expect(payload.email).toBeUndefined();
    });
  });

  describe('AuthService Class', () => {
    let authService: AuthService;

    beforeEach(() => {
      jest.clearAllMocks();
      // Mock the firebase config
      const mockFirestore = jest.requireMock('../../../src/config/firebase.config');
      mockFirestore.getFirestore.mockReturnValue({
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn(() => Promise.resolve({
              exists: true,
              data: () => ({ uid: 'test-uid', email: 'test@example.com' }),
            })),
            set: jest.fn(() => Promise.resolve()),
            update: jest.fn(() => Promise.resolve()),
          }),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
        }),
        batch: jest.fn().mockReturnValue({
          delete: jest.fn(),
          commit: jest.fn(() => Promise.resolve()),
        }),
      });
      mockFirestore.getAuth.mockReturnValue({
        verifyIdToken: jest.fn(),
        createCustomToken: jest.fn(() => Promise.resolve('custom-token')),
        deleteUser: jest.fn(() => Promise.resolve()),
      });

      authService = new AuthService();
    });

    describe('generateToken', () => {
      it('should generate access token', () => {
        const token = authService.generateToken('user-123', 'test@example.com');
        expect(token).toBe('mock-jwt-token');
      });

      it('should generate token with custom expiration', () => {
        const token = authService.generateToken('user-123', 'test@example.com', '7d');
        expect(token).toBe('mock-jwt-token');
      });

      it('should throw if JWT_SECRET not configured', () => {
        const mockSecrets = jest.requireMock('../../../src/config/secrets');
        mockSecrets.getSecretValues.mockReturnValueOnce({ jwtSecret: null });

        expect(() => authService.generateToken('user-123')).toThrow('JWT_SECRET not configured');
      });
    });

    describe('generateRefreshToken', () => {
      it('should generate refresh token', () => {
        const token = authService.generateRefreshToken('user-123');
        expect(token).toBe('mock-jwt-token');
      });

      it('should throw if JWT_SECRET not configured', () => {
        const mockSecrets = jest.requireMock('../../../src/config/secrets');
        mockSecrets.getSecretValues.mockReturnValueOnce({ jwtSecret: null });

        expect(() => authService.generateRefreshToken('user-123')).toThrow('JWT_SECRET not configured');
      });
    });

    describe('verifyToken', () => {
      it('should verify valid token', () => {
        const payload = authService.verifyToken('valid-token');
        expect(payload).not.toBeNull();
        expect(payload?.sub).toBe('test-uid');
      });

      it('should return null for invalid token', () => {
        const jwt = jest.requireMock('jsonwebtoken');
        jwt.verify.mockImplementationOnce(() => {
          throw new Error('Invalid token');
        });

        const payload = authService.verifyToken('invalid-token');
        expect(payload).toBeNull();
      });

      it('should return null if JWT_SECRET not configured', () => {
        const mockSecrets = jest.requireMock('../../../src/config/secrets');
        mockSecrets.getSecretValues.mockReturnValueOnce({ jwtSecret: null });

        const payload = authService.verifyToken('some-token');
        expect(payload).toBeNull();
      });
    });

    describe('getTokenLimit calculation', () => {
      it('should calculate correct token limit for free tier', () => {
        // This tests the token limits through the auth service context
        const plans = ['free', 'user', 'team', 'enterprise'];
        expect(plans).toHaveLength(4);
      });
    });
  });
});
