/**
 * Test User Roles Configuration
 *
 * Defines test users with different subscription tiers and permissions
 * for role-based E2E testing.
 *
 * Subscription Tiers:
 * - FREE: Basic browser debugging, 10 scans/month
 * - USER: Individual paid plan, 100 scans/month, Lighthouse enabled
 * - TEAM: Team collaboration, 500 scans/month, team dashboard
 * - ENTERPRISE: Full platform access, unlimited, SSO, audit logs
 * - ADMIN: System administration access
 */

export type SubscriptionTier = 'free' | 'user' | 'team' | 'enterprise';
export type UserRole = 'free' | 'user' | 'team' | 'enterprise' | 'admin';

export interface UserLimits {
  monthlyScans: number; // -1 = unlimited
  maxApiKeys: number; // -1 = unlimited
  maxTeamMembers: number; // -1 = unlimited
  maxWorkspaces?: number;
  maxStorageMb?: number;
}

export interface UserFeatures {
  // Basic features (all tiers)
  consoleLogsEnabled: boolean;
  networkLogsEnabled: boolean;
  screenshotEnabled: boolean;
  elementInspectorEnabled: boolean;

  // Paid features (user+)
  lighthouseEnabled: boolean;
  apiKeyEnabled: boolean;
  exportEnabled: boolean;

  // Team features (team+)
  teamDashboardEnabled: boolean;
  sharedWorkspacesEnabled: boolean;

  // Enterprise features (enterprise+)
  ssoEnabled: boolean;
  auditLogsEnabled: boolean;
  prioritySupport: boolean;
  customBrandingEnabled: boolean;
  dedicatedInfraEnabled: boolean;

  // Admin features
  adminEnabled: boolean;
}

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  tier: SubscriptionTier;
  permissions: string[];
  limits: UserLimits;
  features: UserFeatures;
}

/**
 * Test Users by Role
 */
export const TEST_USERS: Record<UserRole, TestUser> = {
  free: {
    id: 'test-user-free',
    email: 'test-free@rapidtriage.test',
    displayName: 'Free Tier User',
    role: 'free',
    tier: 'free',
    permissions: ['read', 'basic_scan'],
    limits: {
      monthlyScans: 10,
      maxApiKeys: 0,
      maxTeamMembers: 1,
      maxWorkspaces: 1,
      maxStorageMb: 100,
    },
    features: {
      // Basic - enabled
      consoleLogsEnabled: true,
      networkLogsEnabled: true,
      screenshotEnabled: true,
      elementInspectorEnabled: true,
      // Paid - disabled
      lighthouseEnabled: false,
      apiKeyEnabled: false,
      exportEnabled: false,
      // Team - disabled
      teamDashboardEnabled: false,
      sharedWorkspacesEnabled: false,
      // Enterprise - disabled
      ssoEnabled: false,
      auditLogsEnabled: false,
      prioritySupport: false,
      customBrandingEnabled: false,
      dedicatedInfraEnabled: false,
      // Admin - disabled
      adminEnabled: false,
    },
  },

  user: {
    id: 'test-user-individual',
    email: 'test-user@rapidtriage.test',
    displayName: 'User Tier',
    role: 'user',
    tier: 'user',
    permissions: ['read', 'write', 'scan', 'export', 'lighthouse'],
    limits: {
      monthlyScans: 100,
      maxApiKeys: 3,
      maxTeamMembers: 1,
      maxWorkspaces: 3,
      maxStorageMb: 500,
    },
    features: {
      // Basic - enabled
      consoleLogsEnabled: true,
      networkLogsEnabled: true,
      screenshotEnabled: true,
      elementInspectorEnabled: true,
      // Paid - enabled
      lighthouseEnabled: true,
      apiKeyEnabled: true,
      exportEnabled: true,
      // Team - disabled
      teamDashboardEnabled: false,
      sharedWorkspacesEnabled: false,
      // Enterprise - disabled
      ssoEnabled: false,
      auditLogsEnabled: false,
      prioritySupport: false,
      customBrandingEnabled: false,
      dedicatedInfraEnabled: false,
      // Admin - disabled
      adminEnabled: false,
    },
  },

  team: {
    id: 'test-user-team',
    email: 'test-team@rapidtriage.test',
    displayName: 'Team Tier',
    role: 'team',
    tier: 'team',
    permissions: ['read', 'write', 'scan', 'export', 'lighthouse', 'api', 'team_dashboard', 'workspace'],
    limits: {
      monthlyScans: 500,
      maxApiKeys: 10,
      maxTeamMembers: 10,
      maxWorkspaces: 10,
      maxStorageMb: 2000,
    },
    features: {
      // Basic - enabled
      consoleLogsEnabled: true,
      networkLogsEnabled: true,
      screenshotEnabled: true,
      elementInspectorEnabled: true,
      // Paid - enabled
      lighthouseEnabled: true,
      apiKeyEnabled: true,
      exportEnabled: true,
      // Team - enabled
      teamDashboardEnabled: true,
      sharedWorkspacesEnabled: true,
      // Enterprise - disabled
      ssoEnabled: false,
      auditLogsEnabled: false,
      prioritySupport: false,
      customBrandingEnabled: false,
      dedicatedInfraEnabled: false,
      // Admin - disabled
      adminEnabled: false,
    },
  },

  enterprise: {
    id: 'test-user-enterprise',
    email: 'test-enterprise@rapidtriage.test',
    displayName: 'Enterprise Tier',
    role: 'enterprise',
    tier: 'enterprise',
    permissions: ['*'],
    limits: {
      monthlyScans: -1, // unlimited
      maxApiKeys: -1, // unlimited
      maxTeamMembers: -1, // unlimited
      maxWorkspaces: -1, // unlimited
      maxStorageMb: -1, // unlimited
    },
    features: {
      // Basic - enabled
      consoleLogsEnabled: true,
      networkLogsEnabled: true,
      screenshotEnabled: true,
      elementInspectorEnabled: true,
      // Paid - enabled
      lighthouseEnabled: true,
      apiKeyEnabled: true,
      exportEnabled: true,
      // Team - enabled
      teamDashboardEnabled: true,
      sharedWorkspacesEnabled: true,
      // Enterprise - enabled
      ssoEnabled: true,
      auditLogsEnabled: true,
      prioritySupport: true,
      customBrandingEnabled: true,
      dedicatedInfraEnabled: true,
      // Admin - disabled
      adminEnabled: false,
    },
  },

  admin: {
    id: 'test-user-admin',
    email: 'test-admin@rapidtriage.test',
    displayName: 'Admin User',
    role: 'admin',
    tier: 'enterprise',
    permissions: ['*', 'admin'],
    limits: {
      monthlyScans: -1,
      maxApiKeys: -1,
      maxTeamMembers: -1,
      maxWorkspaces: -1,
      maxStorageMb: -1,
    },
    features: {
      // All features enabled
      consoleLogsEnabled: true,
      networkLogsEnabled: true,
      screenshotEnabled: true,
      elementInspectorEnabled: true,
      lighthouseEnabled: true,
      apiKeyEnabled: true,
      exportEnabled: true,
      teamDashboardEnabled: true,
      sharedWorkspacesEnabled: true,
      ssoEnabled: true,
      auditLogsEnabled: true,
      prioritySupport: true,
      customBrandingEnabled: true,
      dedicatedInfraEnabled: true,
      adminEnabled: true,
    },
  },
};

/**
 * Get test user by role
 */
export function getTestUser(role: UserRole): TestUser {
  return TEST_USERS[role];
}

/**
 * Check if user has permission
 */
export function hasPermission(user: TestUser, permission: string): boolean {
  return user.permissions.includes('*') || user.permissions.includes(permission);
}

/**
 * Check if user can perform action based on limits
 */
export function canPerformAction(
  user: TestUser,
  action: 'scan' | 'createApiKey' | 'addTeamMember' | 'createWorkspace',
  currentCount: number
): boolean {
  switch (action) {
    case 'scan':
      return user.limits.monthlyScans === -1 || currentCount < user.limits.monthlyScans;
    case 'createApiKey':
      return user.limits.maxApiKeys === -1 || currentCount < user.limits.maxApiKeys;
    case 'addTeamMember':
      return user.limits.maxTeamMembers === -1 || currentCount < user.limits.maxTeamMembers;
    case 'createWorkspace':
      return (user.limits.maxWorkspaces ?? 0) === -1 || currentCount < (user.limits.maxWorkspaces ?? 0);
    default:
      return false;
  }
}

/**
 * Check if user has a specific feature enabled
 */
export function hasFeature(user: TestUser, feature: keyof UserFeatures): boolean {
  return user.features[feature] === true;
}

/**
 * Get all users that have a specific feature enabled
 */
export function getUsersWithFeature(feature: keyof UserFeatures): TestUser[] {
  return Object.values(TEST_USERS).filter(user => user.features[feature]);
}

/**
 * Get minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: keyof UserFeatures): SubscriptionTier {
  const tiers: SubscriptionTier[] = ['free', 'user', 'team', 'enterprise'];
  for (const tier of tiers) {
    const user = Object.values(TEST_USERS).find(u => u.tier === tier);
    if (user && user.features[feature]) {
      return tier;
    }
  }
  return 'enterprise';
}

/**
 * Check if a tier meets the minimum requirement
 */
export function tierMeetsMinimum(userTier: UserRole, minTier: UserRole): boolean {
  const tierOrder: UserRole[] = ['free', 'user', 'team', 'enterprise', 'admin'];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(minTier);
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier | UserRole): string {
  const names: Record<string, string> = {
    free: 'Free',
    user: 'User (Individual)',
    team: 'Team',
    enterprise: 'Enterprise',
    admin: 'Administrator',
  };
  return names[tier] || tier;
}

/**
 * Get tier pricing (monthly)
 */
export function getTierPricing(tier: SubscriptionTier): { monthly: number; yearly: number } {
  const pricing: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
    free: { monthly: 0, yearly: 0 },
    user: { monthly: 19, yearly: 190 },
    team: { monthly: 49, yearly: 490 },
    enterprise: { monthly: 199, yearly: 1990 },
  };
  return pricing[tier];
}

export default {
  TEST_USERS,
  getTestUser,
  hasPermission,
  hasFeature,
  canPerformAction,
  getUsersWithFeature,
  getMinimumTierForFeature,
  tierMeetsMinimum,
  getTierDisplayName,
  getTierPricing,
};
