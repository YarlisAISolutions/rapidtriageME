/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin with proper credentials and settings
 */

import * as admin from 'firebase-admin';

/**
 * Firebase configuration interface
 */
export interface FirebaseConfig {
  projectId: string;
  storageBucket: string;
  databaseURL?: string;
}

/**
 * Default Firebase configuration for RapidTriageME
 */
export const firebaseConfig: FirebaseConfig = {
  projectId: 'rapidtriage-me',
  storageBucket: 'rapidtriage-me.firebasestorage.app',
};

/**
 * Initialize Firebase Admin SDK
 * Should be called once at application startup
 */
export function initializeFirebase(): admin.app.App {
  // Check if Firebase is already initialized
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  // Initialize with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS)
  return admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

/**
 * Get Firestore instance
 */
export function getFirestore(): admin.firestore.Firestore {
  return admin.firestore();
}

/**
 * Get Firebase Storage bucket
 */
export function getStorageBucket(): admin.storage.Storage {
  return admin.storage();
}

/**
 * Get Firebase Auth instance
 */
export function getAuth(): admin.auth.Auth {
  return admin.auth();
}

/**
 * Firestore collection names
 */
export const Collections = {
  USERS: 'users',
  SESSIONS: 'sessions',
  SCREENSHOTS: 'screenshots',
  API_KEYS: 'apiKeys',
  RATE_LIMITS: 'rateLimits',
  METRICS: 'metrics',
  CONSOLE_LOGS: 'consoleLogs',
  NETWORK_LOGS: 'networkLogs',
  WORKSPACES: 'workspaces',
  AUDIT_LOGS: 'auditLogs',
} as const;

/**
 * Storage paths
 */
export const StoragePaths = {
  SCREENSHOTS: 'screenshots',
  REPORTS: 'reports',
  EXPORTS: 'exports',
} as const;

/**
 * Environment configuration
 */
export const Environment = {
  isProduction: process.env.FUNCTIONS_EMULATOR !== 'true' &&
                process.env.NODE_ENV === 'production',
  isDevelopment: process.env.FUNCTIONS_EMULATOR === 'true' ||
                 process.env.NODE_ENV === 'development',
  projectId: process.env.GCLOUD_PROJECT || firebaseConfig.projectId,
} as const;
