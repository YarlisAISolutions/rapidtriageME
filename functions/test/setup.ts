/**
 * Firebase Functions Test Setup
 *
 * Configures Jest test environment with Firebase Emulator connection.
 * This file is automatically loaded before each test suite.
 */

import * as admin from 'firebase-admin';
import * as functionsTest from 'firebase-functions-test';

// ============================================
// EMULATOR CONFIGURATION
// ============================================

/**
 * Firebase Emulator ports matching firebase.json configuration
 */
export const EmulatorPorts = {
  AUTH: 9099,
  FIRESTORE: 8080,
  STORAGE: 9199,
  FUNCTIONS: 5001,
  HOSTING: 5000,
  UI: 4000,
} as const;

/**
 * Emulator host configuration
 */
export const EmulatorHost = 'localhost';

/**
 * Full emulator URLs
 */
export const EmulatorUrls = {
  AUTH: `http://${EmulatorHost}:${EmulatorPorts.AUTH}`,
  FIRESTORE: `http://${EmulatorHost}:${EmulatorPorts.FIRESTORE}`,
  STORAGE: `http://${EmulatorHost}:${EmulatorPorts.STORAGE}`,
  FUNCTIONS: `http://${EmulatorHost}:${EmulatorPorts.FUNCTIONS}`,
} as const;

// ============================================
// ENVIRONMENT SETUP
// ============================================

/**
 * Set environment variables for emulator connection
 */
export function configureEmulatorEnvironment(): void {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `${EmulatorHost}:${EmulatorPorts.AUTH}`;
  process.env.FIRESTORE_EMULATOR_HOST = `${EmulatorHost}:${EmulatorPorts.FIRESTORE}`;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `${EmulatorHost}:${EmulatorPorts.STORAGE}`;
  process.env.FUNCTIONS_EMULATOR = 'true';
  process.env.GCLOUD_PROJECT = 'rapidtriage-me';
}

// ============================================
// TEST INSTANCE
// ============================================

/**
 * Firebase Functions Test instance
 * Provides offline mode testing capabilities
 */
let testEnv: ReturnType<typeof functionsTest> | null = null;

/**
 * Initialize Firebase Functions Test environment
 * @param useEmulator - If true, connects to running emulator; if false, uses offline mode
 */
export function initializeTestEnvironment(useEmulator: boolean = false): ReturnType<typeof functionsTest> {
  if (testEnv) {
    return testEnv;
  }

  if (useEmulator) {
    // Configure emulator environment variables
    configureEmulatorEnvironment();

    // Initialize with project configuration for emulator testing
    testEnv = functionsTest({
      projectId: 'rapidtriage-me',
      storageBucket: 'rapidtriage-me.firebasestorage.app',
    });
  } else {
    // Initialize in offline mode (no emulator required)
    testEnv = functionsTest();
  }

  return testEnv;
}

/**
 * Clean up test environment after tests complete
 */
export function cleanupTestEnvironment(): void {
  if (testEnv) {
    testEnv.cleanup();
    testEnv = null;
  }
}

// ============================================
// FIRESTORE HELPERS
// ============================================

/**
 * Get Firestore instance for testing
 * @returns Firestore instance connected to emulator or mock
 */
export function getTestFirestore(): admin.firestore.Firestore {
  return admin.firestore();
}

/**
 * Clear all data from a Firestore collection
 * @param collectionPath - Path to the collection to clear
 */
export async function clearCollection(collectionPath: string): Promise<void> {
  const firestore = getTestFirestore();
  const snapshot = await firestore.collection(collectionPath).get();

  const batch = firestore.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

/**
 * Clear all test data from emulator
 */
export async function clearAllTestData(): Promise<void> {
  const collections = [
    'users',
    'browserSessions',
    'screenshots',
    'apiKeyLookup',
    'refreshTokens',
    'rateLimits',
    'workspaces',
    'reports',
    'auditLogs',
    'serviceHealth',
    'metrics',
  ];

  for (const collection of collections) {
    try {
      await clearCollection(collection);
    } catch (error) {
      // Collection may not exist, ignore
    }
  }
}

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Create a mock authenticated context for callable functions
 * @param uid - User ID
 * @param email - User email
 * @param customClaims - Additional custom claims
 */
export function createAuthContext(
  uid: string,
  email: string = 'test@example.com',
  customClaims: Record<string, unknown> = {}
): { auth: { uid: string; token: Record<string, unknown> } } {
  return {
    auth: {
      uid,
      token: {
        email,
        email_verified: true,
        ...customClaims,
      },
    },
  };
}

/**
 * Create an admin authenticated context
 * @param uid - Admin user ID
 */
export function createAdminContext(uid: string = 'admin-user'): ReturnType<typeof createAuthContext> {
  return createAuthContext(uid, 'admin@rapidtriage.me', { admin: true });
}

// ============================================
// HTTP REQUEST HELPERS
// ============================================

/**
 * Create a mock HTTP request object
 */
export function createMockRequest(options: {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}): Partial<import('express').Request> {
  return {
    method: options.method || 'GET',
    path: options.path || '/',
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
    get: (header: string) => (options.headers || {})[header.toLowerCase()],
  };
}

/**
 * Create a mock HTTP response object with capture capabilities
 */
export function createMockResponse(): {
  response: Partial<import('express').Response>;
  getStatus: () => number;
  getBody: () => unknown;
  getHeaders: () => Record<string, string>;
} {
  let statusCode = 200;
  let body: unknown = null;
  const headers: Record<string, string> = {};

  const response: Partial<import('express').Response> = {
    status: function(code: number) {
      statusCode = code;
      return this as import('express').Response;
    },
    json: function(data: unknown) {
      body = data;
      return this as import('express').Response;
    },
    send: function(data: unknown) {
      body = data;
      return this as import('express').Response;
    },
    set: function(header: string, value: string) {
      headers[header] = value;
      return this as import('express').Response;
    },
    setHeader: function(header: string, value: string) {
      headers[header] = value;
      return this as unknown as import('express').Response;
    },
    end: function() {
      return this as import('express').Response;
    },
  };

  return {
    response,
    getStatus: () => statusCode,
    getBody: () => body,
    getHeaders: () => headers,
  };
}

// ============================================
// JEST LIFECYCLE HOOKS
// ============================================

/**
 * Global setup - runs once before all tests
 */
beforeAll(async () => {
  // Initialize test environment in offline mode by default
  initializeTestEnvironment(false);
});

/**
 * Global teardown - runs once after all tests
 */
afterAll(async () => {
  cleanupTestEnvironment();
});

// ============================================
// UTILITY EXPORTS
// ============================================

export { functionsTest };

/**
 * Test timeout configuration
 */
export const TestTimeouts = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
} as const;

/**
 * Test data generators
 */
export const TestData = {
  /**
   * Generate a random test user ID
   */
  generateUserId: (): string => `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generate a random session ID
   */
  generateSessionId: (): string => `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generate a test email
   */
  generateEmail: (): string => `test-${Date.now()}@rapidtriage.me`,

  /**
   * Create test user data
   */
  createUserData: (overrides: Partial<{
    email: string;
    displayName: string;
    photoURL: string;
    createdAt: Date;
  }> = {}) => ({
    email: overrides.email || TestData.generateEmail(),
    displayName: overrides.displayName || 'Test User',
    photoURL: overrides.photoURL || null,
    createdAt: overrides.createdAt || new Date(),
    tier: 'free',
    usage: {
      screenshots: 0,
      apiCalls: 0,
    },
  }),
};
