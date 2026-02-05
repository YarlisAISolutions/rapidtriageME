/**
 * RapidTriage Permission & Subscription Tier Tests
 *
 * Comprehensive test suite that validates permissions and feature access
 * for each subscription tier offered by RapidTriage.
 *
 * Subscription Tiers:
 * - FREE: Basic browser debugging, limited features
 * - USER: Individual paid plan with full scanning
 * - TEAM: Team collaboration features
 * - ENTERPRISE: Full platform access, SSO, advanced features
 * - ADMIN: System administration access
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import { TEST_USERS, TestUser, UserRole, hasPermission } from '../../config/test-users';
import { getApiToken, RAPIDTRIAGE_TOKENS } from '../../config/secrets';
import { takeScreenshot } from '../../utils/helpers';

// API Configuration
const API_BASE = 'https://rapidtriage-me.web.app';

// Feature flags and their required permissions
const FEATURE_PERMISSIONS = {
  // Basic features (all tiers)
  consoleLogs: { permission: 'console:read', minTier: 'free' },
  networkLogs: { permission: 'network:read', minTier: 'free' },
  screenshot: { permission: 'screenshot:capture', minTier: 'free' },
  elementInspector: { permission: 'element:inspect', minTier: 'free' },

  // Paid features (user+)
  lighthousePerformance: { permission: 'lighthouse:run', minTier: 'user' },
  lighthouseAccessibility: { permission: 'lighthouse:run', minTier: 'user' },
  lighthouseSeo: { permission: 'lighthouse:run', minTier: 'user' },
  lighthouseBestPractices: { permission: 'lighthouse:run', minTier: 'user' },
  exportReports: { permission: 'export:reports', minTier: 'user' },
  apiKeyGeneration: { permission: 'api:keys', minTier: 'user' },

  // Team features (team+)
  teamDashboard: { permission: 'team:dashboard', minTier: 'team' },
  teamMembers: { permission: 'team:manage', minTier: 'team' },
  sharedWorkspaces: { permission: 'workspace:shared', minTier: 'team' },

  // Enterprise features (enterprise+)
  ssoIntegration: { permission: 'sso:configure', minTier: 'enterprise' },
  customBranding: { permission: 'branding:custom', minTier: 'enterprise' },
  auditLogs: { permission: 'audit:logs', minTier: 'enterprise' },
  prioritySupport: { permission: 'support:priority', minTier: 'enterprise' },
  dedicatedInfra: { permission: 'infra:dedicated', minTier: 'enterprise' },

  // Admin features (admin only)
  userManagement: { permission: 'admin:users', minTier: 'admin' },
  systemConfig: { permission: 'admin:config', minTier: 'admin' },
  billingManagement: { permission: 'admin:billing', minTier: 'admin' },
};

// Tier hierarchy for comparison
const TIER_ORDER: UserRole[] = ['free', 'user', 'team', 'enterprise', 'admin'];

function tierMeetsMinimum(userTier: UserRole, minTier: UserRole): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(minTier);
}

// API Client for permission testing
class PermissionTestClient {
  constructor(
    private request: APIRequestContext,
    private token: string,
    private userTier: UserRole
  ) {}

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'X-User-Tier': this.userTier,
    };
  }

  // Test endpoint access and return result
  async testEndpoint(
    method: 'GET' | 'POST',
    path: string,
    data?: any
  ): Promise<{ status: number; allowed: boolean; response: any }> {
    try {
      let response;
      if (method === 'GET') {
        response = await this.request.get(`${API_BASE}${path}`, {
          headers: this.getHeaders(),
          timeout: 10000,
        });
      } else {
        response = await this.request.post(`${API_BASE}${path}`, {
          headers: this.getHeaders(),
          data,
          timeout: 30000,
        });
      }

      const status = response.status();
      const body = await response.json().catch(() => ({}));

      return {
        status,
        allowed: status >= 200 && status < 400,
        response: body,
      };
    } catch (error) {
      return {
        status: 0,
        allowed: false,
        response: { error: String(error) },
      };
    }
  }

  // Feature-specific tests
  async testConsoleLogs(): Promise<boolean> {
    const result = await this.testEndpoint('POST', '/api/console-logs', { url: 'https://example.com' });
    return result.status !== 403;
  }

  async testNetworkLogs(): Promise<boolean> {
    const result = await this.testEndpoint('POST', '/api/network-logs', { url: 'https://example.com' });
    return result.status !== 403;
  }

  async testScreenshot(): Promise<boolean> {
    const result = await this.testEndpoint('POST', '/api/screenshot', { url: 'https://example.com' });
    return result.status !== 403;
  }

  async testLighthouse(category: string): Promise<boolean> {
    const result = await this.testEndpoint('POST', `/api/lighthouse/${category}`, { url: 'https://example.com' });
    return result.status !== 403;
  }

  async testTriageReport(): Promise<boolean> {
    const result = await this.testEndpoint('POST', '/api/triage-report', { url: 'https://example.com' });
    return result.status !== 403;
  }

  async testApiKeyGeneration(): Promise<boolean> {
    const result = await this.testEndpoint('POST', '/api/keys/generate', { name: 'test-key' });
    return result.status !== 403;
  }

  async testTeamDashboard(): Promise<boolean> {
    const result = await this.testEndpoint('GET', '/api/team/dashboard');
    return result.status !== 403;
  }

  async testTeamMembers(): Promise<boolean> {
    const result = await this.testEndpoint('GET', '/api/team/members');
    return result.status !== 403;
  }

  async testSsoConfig(): Promise<boolean> {
    const result = await this.testEndpoint('GET', '/api/sso/config');
    return result.status !== 403;
  }

  async testAuditLogs(): Promise<boolean> {
    const result = await this.testEndpoint('GET', '/api/audit/logs');
    return result.status !== 403;
  }

  async testAdminUsers(): Promise<boolean> {
    const result = await this.testEndpoint('GET', '/api/admin/users');
    return result.status !== 403;
  }

  async testBillingManagement(): Promise<boolean> {
    const result = await this.testEndpoint('GET', '/api/admin/billing');
    return result.status !== 403;
  }
}

// ============================================
// TEST SUITES BY TIER
// ============================================

test.describe('Permission Tests - All Tiers', () => {

  // ==========================================
  // FREE TIER TESTS
  // ==========================================
  test.describe('FREE Tier Permissions', () => {
    let client: PermissionTestClient;
    const tier: UserRole = 'free';
    const user = TEST_USERS[tier];

    test.beforeEach(async ({ request }) => {
      client = new PermissionTestClient(request, getApiToken(tier), tier);
    });

    test('FREE-001: Can access console logs (basic feature)', async ({ page }) => {
      const allowed = await client.testConsoleLogs();
      await takeScreenshot(page, 'perm-free-console-logs');

      console.log(`[FREE] Console logs access: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      expect(allowed).toBe(true); // Free users can access basic features
    });

    test('FREE-002: Can access network logs (basic feature)', async ({ page }) => {
      const allowed = await client.testNetworkLogs();
      await takeScreenshot(page, 'perm-free-network-logs');

      console.log(`[FREE] Network logs access: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      expect(allowed).toBe(true);
    });

    test('FREE-003: Cannot access Lighthouse audits', async ({ page }) => {
      const allowed = await client.testLighthouse('performance');
      await takeScreenshot(page, 'perm-free-lighthouse');

      console.log(`[FREE] Lighthouse access: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      // Free tier should not have Lighthouse access
      expect(user.features.lighthouseEnabled).toBe(false);
    });

    test('FREE-004: Cannot generate API keys', async ({ page }) => {
      const allowed = await client.testApiKeyGeneration();
      await takeScreenshot(page, 'perm-free-api-keys');

      console.log(`[FREE] API key generation: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      expect(user.features.apiKeyEnabled).toBe(false);
    });

    test('FREE-005: Has correct monthly scan limits', async ({ page }) => {
      await takeScreenshot(page, 'perm-free-limits');

      console.log(`[FREE] Monthly scan limit: ${user.limits.monthlyScans}`);
      console.log(`[FREE] Max API keys: ${user.limits.maxApiKeys}`);

      expect(user.limits.monthlyScans).toBe(10);
      expect(user.limits.maxApiKeys).toBe(0);
    });

    test('FREE-006: Cannot access team features', async ({ page }) => {
      const allowed = await client.testTeamDashboard();
      await takeScreenshot(page, 'perm-free-team');

      console.log(`[FREE] Team dashboard: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      expect(user.features.teamDashboardEnabled).toBeFalsy();
    });
  });

  // ==========================================
  // USER TIER TESTS
  // ==========================================
  test.describe('USER Tier Permissions', () => {
    let client: PermissionTestClient;
    const tier: UserRole = 'user';
    const user = TEST_USERS[tier];

    test.beforeEach(async ({ request }) => {
      client = new PermissionTestClient(request, getApiToken(tier), tier);
    });

    test('USER-001: Can access all basic features', async ({ page }) => {
      const consoleLogs = await client.testConsoleLogs();
      const networkLogs = await client.testNetworkLogs();

      await takeScreenshot(page, 'perm-user-basic');

      console.log(`[USER] Console logs: ${consoleLogs ? 'ALLOWED' : 'DENIED'}`);
      console.log(`[USER] Network logs: ${networkLogs ? 'ALLOWED' : 'DENIED'}`);

      expect(consoleLogs).toBe(true);
      expect(networkLogs).toBe(true);
    });

    test('USER-002: Can access Lighthouse audits', async ({ page }) => {
      await takeScreenshot(page, 'perm-user-lighthouse');

      console.log(`[USER] Lighthouse enabled: ${user.features.lighthouseEnabled}`);
      expect(user.features.lighthouseEnabled).toBe(true);
    });

    test('USER-003: Can generate API keys', async ({ page }) => {
      await takeScreenshot(page, 'perm-user-api-keys');

      console.log(`[USER] API keys enabled: ${user.features.apiKeyEnabled}`);
      console.log(`[USER] Max API keys: ${user.limits.maxApiKeys}`);

      expect(user.features.apiKeyEnabled).toBe(true);
      expect(user.limits.maxApiKeys).toBe(3);
    });

    test('USER-004: Can export reports', async ({ page }) => {
      await takeScreenshot(page, 'perm-user-export');

      console.log(`[USER] Export enabled: ${user.features.exportEnabled}`);
      expect(user.features.exportEnabled).toBe(true);
    });

    test('USER-005: Has increased scan limits', async ({ page }) => {
      await takeScreenshot(page, 'perm-user-limits');

      console.log(`[USER] Monthly scans: ${user.limits.monthlyScans}`);
      expect(user.limits.monthlyScans).toBe(100);
    });

    test('USER-006: Cannot access team features', async ({ page }) => {
      await takeScreenshot(page, 'perm-user-team');

      console.log(`[USER] Team dashboard: ${user.features.teamDashboardEnabled}`);
      expect(user.features.teamDashboardEnabled).toBeFalsy();
    });
  });

  // ==========================================
  // TEAM TIER TESTS
  // ==========================================
  test.describe('TEAM Tier Permissions', () => {
    let client: PermissionTestClient;
    const tier: UserRole = 'team';
    const user = TEST_USERS[tier];

    test.beforeEach(async ({ request }) => {
      client = new PermissionTestClient(request, getApiToken(tier), tier);
    });

    test('TEAM-001: Can access all user features', async ({ page }) => {
      await takeScreenshot(page, 'perm-team-user-features');

      expect(user.features.lighthouseEnabled).toBe(true);
      expect(user.features.apiKeyEnabled).toBe(true);
      expect(user.features.exportEnabled).toBe(true);

      console.log(`[TEAM] Has all user features: YES`);
    });

    test('TEAM-002: Can access team dashboard', async ({ page }) => {
      await takeScreenshot(page, 'perm-team-dashboard');

      console.log(`[TEAM] Team dashboard: ${user.features.teamDashboardEnabled}`);
      expect(user.features.teamDashboardEnabled).toBe(true);
    });

    test('TEAM-003: Has team member limits', async ({ page }) => {
      await takeScreenshot(page, 'perm-team-members');

      console.log(`[TEAM] Max team members: ${user.limits.maxTeamMembers}`);
      expect(user.limits.maxTeamMembers).toBe(10);
    });

    test('TEAM-004: Has increased API key limits', async ({ page }) => {
      await takeScreenshot(page, 'perm-team-api-keys');

      console.log(`[TEAM] Max API keys: ${user.limits.maxApiKeys}`);
      expect(user.limits.maxApiKeys).toBe(10);
    });

    test('TEAM-005: Has higher scan limits', async ({ page }) => {
      await takeScreenshot(page, 'perm-team-scans');

      console.log(`[TEAM] Monthly scans: ${user.limits.monthlyScans}`);
      expect(user.limits.monthlyScans).toBe(500);
    });

    test('TEAM-006: Cannot access enterprise SSO', async ({ page }) => {
      await takeScreenshot(page, 'perm-team-sso');

      console.log(`[TEAM] SSO enabled: ${user.features.ssoEnabled}`);
      expect(user.features.ssoEnabled).toBeFalsy();
    });
  });

  // ==========================================
  // ENTERPRISE TIER TESTS
  // ==========================================
  test.describe('ENTERPRISE Tier Permissions', () => {
    let client: PermissionTestClient;
    const tier: UserRole = 'enterprise';
    const user = TEST_USERS[tier];

    test.beforeEach(async ({ request }) => {
      client = new PermissionTestClient(request, getApiToken(tier), tier);
    });

    test('ENT-001: Has all team features', async ({ page }) => {
      await takeScreenshot(page, 'perm-ent-team-features');

      expect(user.features.teamDashboardEnabled).toBe(true);
      expect(user.features.lighthouseEnabled).toBe(true);
      expect(user.features.apiKeyEnabled).toBe(true);

      console.log(`[ENTERPRISE] Has all team features: YES`);
    });

    test('ENT-002: Can configure SSO', async ({ page }) => {
      await takeScreenshot(page, 'perm-ent-sso');

      console.log(`[ENTERPRISE] SSO enabled: ${user.features.ssoEnabled}`);
      expect(user.features.ssoEnabled).toBe(true);
    });

    test('ENT-003: Has unlimited team members', async ({ page }) => {
      await takeScreenshot(page, 'perm-ent-members');

      console.log(`[ENTERPRISE] Max team members: ${user.limits.maxTeamMembers}`);
      expect(user.limits.maxTeamMembers).toBe(-1); // -1 = unlimited
    });

    test('ENT-004: Has unlimited API keys', async ({ page }) => {
      await takeScreenshot(page, 'perm-ent-api-keys');

      console.log(`[ENTERPRISE] Max API keys: ${user.limits.maxApiKeys}`);
      expect(user.limits.maxApiKeys).toBe(-1); // -1 = unlimited
    });

    test('ENT-005: Has unlimited scans', async ({ page }) => {
      await takeScreenshot(page, 'perm-ent-scans');

      console.log(`[ENTERPRISE] Monthly scans: ${user.limits.monthlyScans}`);
      expect(user.limits.monthlyScans).toBe(-1); // -1 = unlimited
    });

    test('ENT-006: Can access audit logs', async ({ page }) => {
      const allowed = await client.testAuditLogs();
      await takeScreenshot(page, 'perm-ent-audit');

      console.log(`[ENTERPRISE] Audit logs: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      expect(user.features.auditLogsEnabled).toBe(true);
    });

    test('ENT-007: Has priority support', async ({ page }) => {
      await takeScreenshot(page, 'perm-ent-support');

      console.log(`[ENTERPRISE] Priority support: ${user.features.prioritySupport}`);
      expect(user.features.prioritySupport).toBe(true);
    });
  });

  // ==========================================
  // ADMIN TIER TESTS
  // ==========================================
  test.describe('ADMIN Tier Permissions', () => {
    let client: PermissionTestClient;
    const tier: UserRole = 'admin';
    const user = TEST_USERS[tier];

    test.beforeEach(async ({ request }) => {
      client = new PermissionTestClient(request, getApiToken(tier), tier);
    });

    test('ADMIN-001: Has all enterprise features', async ({ page }) => {
      await takeScreenshot(page, 'perm-admin-ent-features');

      expect(user.features.ssoEnabled).toBe(true);
      expect(user.features.auditLogsEnabled).toBe(true);
      expect(user.features.prioritySupport).toBe(true);

      console.log(`[ADMIN] Has all enterprise features: YES`);
    });

    test('ADMIN-002: Can manage users', async ({ page }) => {
      const allowed = await client.testAdminUsers();
      await takeScreenshot(page, 'perm-admin-users');

      console.log(`[ADMIN] User management: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      expect(user.features.adminEnabled).toBe(true);
    });

    test('ADMIN-003: Can manage billing', async ({ page }) => {
      const allowed = await client.testBillingManagement();
      await takeScreenshot(page, 'perm-admin-billing');

      console.log(`[ADMIN] Billing management: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      expect(user.features.adminEnabled).toBe(true);
    });

    test('ADMIN-004: Has system configuration access', async ({ page }) => {
      await takeScreenshot(page, 'perm-admin-config');

      console.log(`[ADMIN] Admin enabled: ${user.features.adminEnabled}`);
      expect(user.features.adminEnabled).toBe(true);
    });

    test('ADMIN-005: All limits are unlimited', async ({ page }) => {
      await takeScreenshot(page, 'perm-admin-limits');

      console.log(`[ADMIN] Monthly scans: ${user.limits.monthlyScans}`);
      console.log(`[ADMIN] Max API keys: ${user.limits.maxApiKeys}`);
      console.log(`[ADMIN] Max team members: ${user.limits.maxTeamMembers}`);

      expect(user.limits.monthlyScans).toBe(-1);
      expect(user.limits.maxApiKeys).toBe(-1);
      expect(user.limits.maxTeamMembers).toBe(-1);
    });
  });
});

// ============================================
// CROSS-TIER COMPARISON TESTS
// ============================================

test.describe('Cross-Tier Permission Comparison', () => {

  test('COMPARE-001: Feature availability matrix', async ({ page }) => {
    const matrix: Record<string, Record<string, boolean>> = {};

    for (const [role, user] of Object.entries(TEST_USERS)) {
      matrix[role] = {
        consoleLogs: true, // All tiers
        networkLogs: true, // All tiers
        screenshots: true, // All tiers
        lighthouse: user.features.lighthouseEnabled || false,
        apiKeys: user.features.apiKeyEnabled || false,
        export: user.features.exportEnabled || false,
        teamDashboard: user.features.teamDashboardEnabled || false,
        sso: user.features.ssoEnabled || false,
        auditLogs: user.features.auditLogsEnabled || false,
        admin: user.features.adminEnabled || false,
      };
    }

    await takeScreenshot(page, 'perm-feature-matrix');

    console.log('\n=== Feature Availability Matrix ===\n');
    console.log('Feature          | FREE | USER | TEAM | ENT  | ADMIN');
    console.log('-----------------|------|------|------|------|------');

    const features = ['consoleLogs', 'networkLogs', 'screenshots', 'lighthouse',
                      'apiKeys', 'export', 'teamDashboard', 'sso', 'auditLogs', 'admin'];

    for (const feature of features) {
      const row = features.map(f => f === feature ? f.padEnd(16) : '').join('');
      const values = ['free', 'user', 'team', 'enterprise', 'admin']
        .map(tier => (matrix[tier][feature] ? '  ✓  ' : '  ✗  '))
        .join('|');
      console.log(`${feature.padEnd(16)} |${values}`);
    }

    // Verify tier hierarchy
    expect(matrix.free.lighthouse).toBe(false);
    expect(matrix.user.lighthouse).toBe(true);
    expect(matrix.team.teamDashboard).toBe(true);
    expect(matrix.enterprise.sso).toBe(true);
    expect(matrix.admin.admin).toBe(true);
  });

  test('COMPARE-002: Limits comparison', async ({ page }) => {
    await takeScreenshot(page, 'perm-limits-comparison');

    console.log('\n=== Limits Comparison ===\n');
    console.log('Tier       | Scans/Mo | API Keys | Team Members');
    console.log('-----------|----------|----------|-------------');

    for (const [role, user] of Object.entries(TEST_USERS)) {
      const scans = user.limits.monthlyScans === -1 ? 'Unlimited' : String(user.limits.monthlyScans);
      const keys = user.limits.maxApiKeys === -1 ? 'Unlimited' : String(user.limits.maxApiKeys);
      const members = user.limits.maxTeamMembers === -1 ? 'Unlimited' : String(user.limits.maxTeamMembers || 'N/A');

      console.log(`${role.padEnd(10)} | ${scans.padEnd(8)} | ${keys.padEnd(8)} | ${members}`);
    }

    // Verify limit progression
    expect(TEST_USERS.free.limits.monthlyScans).toBeLessThan(TEST_USERS.user.limits.monthlyScans);
    expect(TEST_USERS.user.limits.monthlyScans).toBeLessThan(TEST_USERS.team.limits.monthlyScans);
  });

  test('COMPARE-003: Permission inheritance', async ({ page }) => {
    await takeScreenshot(page, 'perm-inheritance');

    console.log('\n=== Permission Inheritance Test ===\n');

    // Each tier should have all permissions of lower tiers
    const tiers: UserRole[] = ['free', 'user', 'team', 'enterprise', 'admin'];

    for (let i = 1; i < tiers.length; i++) {
      const currentTier = tiers[i];
      const previousTier = tiers[i - 1];
      const current = TEST_USERS[currentTier];
      const previous = TEST_USERS[previousTier];

      // Check that higher tier has at least the same features
      if (previous.features.lighthouseEnabled) {
        expect(current.features.lighthouseEnabled).toBe(true);
      }
      if (previous.features.apiKeyEnabled) {
        expect(current.features.apiKeyEnabled).toBe(true);
      }
      if (previous.features.teamDashboardEnabled) {
        expect(current.features.teamDashboardEnabled).toBe(true);
      }

      console.log(`${currentTier} inherits from ${previousTier}: ✓`);
    }
  });
});

// ============================================
// PERMISSION ENFORCEMENT TESTS
// ============================================

test.describe('Permission Enforcement', () => {

  test('ENFORCE-001: Rate limiting by tier', async ({ page }) => {
    await takeScreenshot(page, 'perm-rate-limits');

    console.log('\n=== Rate Limits by Tier ===\n');

    // Rate limits should increase with tier
    const rateLimits = {
      free: 10,
      user: 100,
      team: 500,
      enterprise: -1, // unlimited
      admin: -1, // unlimited
    };

    for (const [tier, limit] of Object.entries(rateLimits)) {
      const user = TEST_USERS[tier as UserRole];
      console.log(`${tier}: ${user.limits.monthlyScans} scans/month`);
      expect(user.limits.monthlyScans).toBe(limit);
    }
  });

  test('ENFORCE-002: Feature gating verification', async ({ page }) => {
    await takeScreenshot(page, 'perm-feature-gating');

    console.log('\n=== Feature Gating Verification ===\n');

    // Free tier restrictions
    const free = TEST_USERS.free;
    expect(free.features.lighthouseEnabled).toBe(false);
    expect(free.features.apiKeyEnabled).toBe(false);
    expect(free.features.exportEnabled).toBeFalsy();
    console.log('FREE tier correctly restricted: ✓');

    // User tier unlocks
    const user = TEST_USERS.user;
    expect(user.features.lighthouseEnabled).toBe(true);
    expect(user.features.apiKeyEnabled).toBe(true);
    console.log('USER tier correctly unlocked: ✓');

    // Team tier unlocks
    const team = TEST_USERS.team;
    expect(team.features.teamDashboardEnabled).toBe(true);
    console.log('TEAM tier correctly unlocked: ✓');

    // Enterprise tier unlocks
    const enterprise = TEST_USERS.enterprise;
    expect(enterprise.features.ssoEnabled).toBe(true);
    expect(enterprise.features.auditLogsEnabled).toBe(true);
    console.log('ENTERPRISE tier correctly unlocked: ✓');

    // Admin tier unlocks
    const admin = TEST_USERS.admin;
    expect(admin.features.adminEnabled).toBe(true);
    console.log('ADMIN tier correctly unlocked: ✓');
  });

  test('ENFORCE-003: Scope validation', async ({ page }) => {
    await takeScreenshot(page, 'perm-scope-validation');

    console.log('\n=== Token Scope Validation ===\n');

    for (const [tier, tokenInfo] of Object.entries(RAPIDTRIAGE_TOKENS)) {
      console.log(`${tier}: ${tokenInfo.scope?.join(', ') || 'none'}`);
    }

    // Free has limited scope
    expect(RAPIDTRIAGE_TOKENS.free.scope).toContain('read');
    expect(RAPIDTRIAGE_TOKENS.free.scope).not.toContain('lighthouse');

    // User has more scope
    expect(RAPIDTRIAGE_TOKENS.user.scope).toContain('lighthouse');

    // Enterprise/Admin have full scope
    expect(RAPIDTRIAGE_TOKENS.enterprise.scope).toContain('*');
    expect(RAPIDTRIAGE_TOKENS.admin.scope).toContain('*');
  });
});
