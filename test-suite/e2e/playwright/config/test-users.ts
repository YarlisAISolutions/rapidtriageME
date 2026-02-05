/**
 * Test User Roles Configuration
 *
 * Defines test users with different subscription tiers and permissions
 * for role-based E2E testing.
 */

export type SubscriptionTier = 'free' | 'user' | 'team' | 'enterprise';
export type UserRole = 'free' | 'user' | 'team' | 'enterprise' | 'admin';

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  tier: SubscriptionTier;
  permissions: string[];
  limits: {
    monthlyScans: number | null; // null = unlimited
    maxApiKeys: number;
    maxTeamMembers: number;
  };
  features: {
    apiKeyEnabled: boolean;
    lighthouseEnabled: boolean;
    exportEnabled: boolean;
    teamDashboard: boolean;
    sso: boolean;
    customIntegrations: boolean;
  };
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
    },
    features: {
      apiKeyEnabled: false,
      lighthouseEnabled: false,
      exportEnabled: false,
      teamDashboard: false,
      sso: false,
      customIntegrations: false,
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
    },
    features: {
      apiKeyEnabled: true,
      lighthouseEnabled: true,
      exportEnabled: true,
      teamDashboard: false,
      sso: false,
      customIntegrations: false,
    },
  },

  team: {
    id: 'test-user-team',
    email: 'test-team@rapidtriage.test',
    displayName: 'Team Tier',
    role: 'team',
    tier: 'team',
    permissions: ['read', 'write', 'scan', 'export', 'lighthouse', 'api', 'team_dashboard'],
    limits: {
      monthlyScans: 500,
      maxApiKeys: 10,
      maxTeamMembers: 5,
    },
    features: {
      apiKeyEnabled: true,
      lighthouseEnabled: true,
      exportEnabled: true,
      teamDashboard: true,
      sso: false,
      customIntegrations: false,
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
      monthlyScans: null, // unlimited
      maxApiKeys: -1, // unlimited
      maxTeamMembers: -1, // unlimited
    },
    features: {
      apiKeyEnabled: true,
      lighthouseEnabled: true,
      exportEnabled: true,
      teamDashboard: true,
      sso: true,
      customIntegrations: true,
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
      monthlyScans: null,
      maxApiKeys: -1,
      maxTeamMembers: -1,
    },
    features: {
      apiKeyEnabled: true,
      lighthouseEnabled: true,
      exportEnabled: true,
      teamDashboard: true,
      sso: true,
      customIntegrations: true,
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
export function canPerformAction(user: TestUser, action: 'scan' | 'createApiKey' | 'addTeamMember', currentCount: number): boolean {
  switch (action) {
    case 'scan':
      return user.limits.monthlyScans === null || currentCount < user.limits.monthlyScans;
    case 'createApiKey':
      return user.limits.maxApiKeys === -1 || currentCount < user.limits.maxApiKeys;
    case 'addTeamMember':
      return user.limits.maxTeamMembers === -1 || currentCount < user.limits.maxTeamMembers;
    default:
      return false;
  }
}

/**
 * Get all users that have a specific feature enabled
 */
export function getUsersWithFeature(feature: keyof TestUser['features']): TestUser[] {
  return Object.values(TEST_USERS).filter(user => user.features[feature]);
}

/**
 * Get minimum tier required for a feature
 */
export function getMinimumTierForFeature(feature: keyof TestUser['features']): SubscriptionTier {
  const tiers: SubscriptionTier[] = ['free', 'user', 'team', 'enterprise'];
  for (const tier of tiers) {
    const user = Object.values(TEST_USERS).find(u => u.tier === tier);
    if (user && user.features[feature]) {
      return tier;
    }
  }
  return 'enterprise';
}

export default {
  TEST_USERS,
  getTestUser,
  hasPermission,
  canPerformAction,
  getUsersWithFeature,
  getMinimumTierForFeature,
};
