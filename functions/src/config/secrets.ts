/**
 * Firebase Secrets Configuration
 * Handles secret management using Firebase Functions params
 */

import { defineSecret, defineString } from 'firebase-functions/params';

/**
 * Define secrets using Firebase Functions v2 params
 * These are accessed at runtime from Secret Manager
 */

// API Authentication
export const RAPIDTRIAGE_API_TOKEN = defineSecret('RAPIDTRIAGE_API_TOKEN');
export const AUTH_TOKEN = defineSecret('AUTH_TOKEN');

// JWT Configuration
export const JWT_SECRET = defineSecret('JWT_SECRET');

// External Service Keys
export const KEYCLOAK_CLIENT_SECRET = defineSecret('KEYCLOAK_CLIENT_SECRET');

/**
 * Environment variables (non-secret)
 */
export const ENVIRONMENT = defineString('ENVIRONMENT', { default: 'production' });
export const BROWSER_TOOLS_PORT = defineString('BROWSER_TOOLS_PORT', { default: '3025' });
export const SSE_ENDPOINT = defineString('SSE_ENDPOINT', { default: '/sse' });
export const HEALTH_ENDPOINT = defineString('HEALTH_ENDPOINT', { default: '/health' });
export const METRICS_ENDPOINT = defineString('METRICS_ENDPOINT', { default: '/metrics' });

/**
 * Keycloak Configuration
 */
export const KEYCLOAK_URL = defineString('KEYCLOAK_URL', {
  default: 'https://auth.yarlisaisolutions.com'
});
export const KEYCLOAK_REALM = defineString('KEYCLOAK_REALM', {
  default: 'rapidtriage'
});
export const KEYCLOAK_CLIENT_ID = defineString('KEYCLOAK_CLIENT_ID', {
  default: 'rapidtriage-client'
});

/**
 * Get all secrets that need to be passed to functions
 * Use this when defining functions that need access to secrets
 */
export const allSecrets = [
  RAPIDTRIAGE_API_TOKEN,
  AUTH_TOKEN,
  JWT_SECRET,
  KEYCLOAK_CLIENT_SECRET,
];

/**
 * Interface for secret values at runtime
 */
export interface SecretValues {
  rapidtriageApiToken: string;
  authToken: string;
  jwtSecret: string;
  keycloakClientSecret?: string;
}

/**
 * Get secret values at runtime
 * Call this inside a function handler, not at module load time
 */
export function getSecretValues(): SecretValues {
  return {
    rapidtriageApiToken: RAPIDTRIAGE_API_TOKEN.value() || '',
    authToken: AUTH_TOKEN.value() || '',
    jwtSecret: JWT_SECRET.value() || '',
    keycloakClientSecret: KEYCLOAK_CLIENT_SECRET.value() || undefined,
  };
}

/**
 * Validate that required secrets are configured
 */
export function validateSecrets(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  try {
    if (!RAPIDTRIAGE_API_TOKEN.value()) missing.push('RAPIDTRIAGE_API_TOKEN');
    if (!JWT_SECRET.value()) missing.push('JWT_SECRET');
  } catch {
    // Secrets not available (likely in emulator without secrets configured)
    return { valid: false, missing: ['SECRETS_NOT_CONFIGURED'] };
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
