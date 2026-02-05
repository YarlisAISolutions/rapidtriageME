/**
 * Secrets and Token Management
 *
 * Centralized management of API tokens, credentials, and sensitive data.
 * In production, these should be loaded from environment variables or a secrets manager.
 */

export interface Credentials {
  username: string;
  password: string;
  email?: string;
}

export interface ApiToken {
  token: string;
  expiresAt?: Date;
  scope?: string[];
}

/**
 * Environment configuration
 */
export const ENV = {
  isCI: process.env.CI === 'true',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  rapidTriageUrl: process.env.RAPIDTRIAGE_API_URL || 'https://rapidtriage-me.web.app',
  rapidTriageToken: process.env.RAPIDTRIAGE_API_TOKEN || '',
  timeout: 30000,
};

/**
 * Test Site Credentials
 * These are public test credentials for the scraper-friendly sites
 */
export const TEST_CREDENTIALS: Record<string, Credentials> = {
  // The Internet - Herokuapp test credentials
  theInternet: {
    username: 'tomsmith',
    password: 'SuperSecretPassword!',
  },

  // Quotes to Scrape - test login
  quotesToScrape: {
    username: 'admin',
    password: 'admin',
  },

  // HTTPBin - Basic auth test
  httpbin: {
    username: 'user',
    password: 'passwd',
  },
};

/**
 * RapidTriage Test User Tokens (for different subscription tiers)
 */
export const RAPIDTRIAGE_TOKENS: Record<string, ApiToken> = {
  free: {
    token: process.env.RAPIDTRIAGE_FREE_TOKEN || 'test-free-token',
    scope: ['read', 'basic_scan'],
  },
  user: {
    token: process.env.RAPIDTRIAGE_USER_TOKEN || 'test-user-token',
    scope: ['read', 'write', 'scan', 'export', 'lighthouse'],
  },
  team: {
    token: process.env.RAPIDTRIAGE_TEAM_TOKEN || 'test-team-token',
    scope: ['read', 'write', 'scan', 'export', 'lighthouse', 'api', 'team_dashboard'],
  },
  enterprise: {
    token: process.env.RAPIDTRIAGE_ENTERPRISE_TOKEN || 'test-enterprise-token',
    scope: ['*'],
  },
  admin: {
    token: process.env.RAPIDTRIAGE_ADMIN_TOKEN || 'test-admin-token',
    scope: ['*'],
  },
};

/**
 * Get credentials for a specific site
 */
export function getCredentials(site: keyof typeof TEST_CREDENTIALS): Credentials {
  const creds = TEST_CREDENTIALS[site];
  if (!creds) {
    throw new Error(`No credentials found for site: ${site}`);
  }
  return creds;
}

/**
 * Get RapidTriage token for a specific tier
 */
export function getRapidTriageToken(tier: keyof typeof RAPIDTRIAGE_TOKENS): ApiToken {
  const token = RAPIDTRIAGE_TOKENS[tier];
  if (!token) {
    throw new Error(`No token found for tier: ${tier}`);
  }
  return token;
}

/**
 * Validate token has required scope
 */
export function hasScope(token: ApiToken, requiredScope: string): boolean {
  if (!token.scope) return false;
  return token.scope.includes('*') || token.scope.includes(requiredScope);
}

/**
 * Get API token string for a specific tier/role
 */
export function getApiToken(role: string): string {
  const tierMap: Record<string, keyof typeof RAPIDTRIAGE_TOKENS> = {
    free: 'free',
    user: 'user',
    team: 'team',
    enterprise: 'enterprise',
    admin: 'admin',
  };
  const tier = tierMap[role] || 'free';
  return RAPIDTRIAGE_TOKENS[tier]?.token || '';
}

export default {
  ENV,
  API_CONFIG,
  TEST_CREDENTIALS,
  RAPIDTRIAGE_TOKENS,
  getCredentials,
  getRapidTriageToken,
  getApiToken,
  hasScope,
};
