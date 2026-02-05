/**
 * E2E Test Users Configuration
 *
 * Defines test users with different subscription tiers and roles
 * for comprehensive end-to-end testing of RapidTriageME platform.
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: 'free' | 'user' | 'team' | 'enterprise' | 'admin';
  tier: 'free' | 'user' | 'team' | 'enterprise';
  permissions: string[];
  monthlyScans: number | null; // null = unlimited
  apiKeyEnabled: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Pre-configured test users for E2E testing
 */
export const TEST_USERS: Record<string, TestUser> = {
  // Free tier user - basic functionality
  FREE_USER: {
    id: 'test-user-free-001',
    email: 'test-free@rapidtriage.test',
    password: 'TestPass123!Free',
    displayName: 'Free Test User',
    role: 'free',
    tier: 'free',
    permissions: ['read', 'basic_scan'],
    monthlyScans: 10,
    apiKeyEnabled: false,
  },

  // User tier - individual developer
  USER_TIER: {
    id: 'test-user-individual-001',
    email: 'test-user@rapidtriage.test',
    password: 'TestPass123!User',
    displayName: 'User Tier Test',
    role: 'user',
    tier: 'user',
    permissions: ['read', 'write', 'scan', 'export', 'lighthouse'],
    monthlyScans: 100,
    apiKeyEnabled: true,
    stripeCustomerId: 'cus_test_user_001',
    stripeSubscriptionId: 'sub_test_user_001',
  },

  // Team tier - development team
  TEAM_TIER: {
    id: 'test-user-team-001',
    email: 'test-team@rapidtriage.test',
    password: 'TestPass123!Team',
    displayName: 'Team Tier Test',
    role: 'team',
    tier: 'team',
    permissions: ['read', 'write', 'scan', 'export', 'lighthouse', 'api', 'team_dashboard'],
    monthlyScans: 500,
    apiKeyEnabled: true,
    stripeCustomerId: 'cus_test_team_001',
    stripeSubscriptionId: 'sub_test_team_001',
  },

  // Enterprise tier - large organization
  ENTERPRISE_TIER: {
    id: 'test-user-enterprise-001',
    email: 'test-enterprise@rapidtriage.test',
    password: 'TestPass123!Enterprise',
    displayName: 'Enterprise Tier Test',
    role: 'enterprise',
    tier: 'enterprise',
    permissions: ['read', 'write', 'scan', 'export', 'lighthouse', 'api', 'team_dashboard', 'sso', 'custom_integrations', 'unlimited'],
    monthlyScans: null, // unlimited
    apiKeyEnabled: true,
    stripeCustomerId: 'cus_test_enterprise_001',
    stripeSubscriptionId: 'sub_test_enterprise_001',
  },

  // Admin user - platform administration
  ADMIN_USER: {
    id: 'test-user-admin-001',
    email: 'test-admin@rapidtriage.test',
    password: 'TestPass123!Admin',
    displayName: 'Admin Test User',
    role: 'admin',
    tier: 'enterprise',
    permissions: ['*'], // all permissions
    monthlyScans: null,
    apiKeyEnabled: true,
  },

  // Expired subscription user - for testing downgrade flows
  EXPIRED_USER: {
    id: 'test-user-expired-001',
    email: 'test-expired@rapidtriage.test',
    password: 'TestPass123!Expired',
    displayName: 'Expired Subscription User',
    role: 'free',
    tier: 'free',
    permissions: ['read', 'basic_scan'],
    monthlyScans: 10,
    apiKeyEnabled: false,
    stripeCustomerId: 'cus_test_expired_001',
    stripeSubscriptionId: 'sub_test_expired_001',
  },

  // Rate limited user - for testing rate limiting
  RATE_LIMITED_USER: {
    id: 'test-user-ratelimit-001',
    email: 'test-ratelimit@rapidtriage.test',
    password: 'TestPass123!Rate',
    displayName: 'Rate Limited User',
    role: 'free',
    tier: 'free',
    permissions: ['read', 'basic_scan'],
    monthlyScans: 0, // exhausted
    apiKeyEnabled: false,
  },
};

/**
 * Test user collections for Firestore seeding
 */
export interface UserFirestoreDoc {
  email: string;
  displayName: string;
  tier: string;
  role: string;
  stripeCustomerId?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionFirestoreDoc {
  userId: string;
  tier: string;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageFirestoreDoc {
  userId: string;
  year: number;
  month: number;
  scansCount: number;
  lastScanAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert TestUser to Firestore documents for seeding
 */
export function userToFirestoreDocs(user: TestUser): {
  userDoc: UserFirestoreDoc;
  subscriptionDoc: SubscriptionFirestoreDoc;
  usageDoc: UsageFirestoreDoc;
} {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    userDoc: {
      email: user.email,
      displayName: user.displayName,
      tier: user.tier,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      subscriptionTier: user.tier,
      subscriptionStatus: user.tier === 'free' ? 'active' : 'active',
      createdAt: now,
      updatedAt: now,
    },
    subscriptionDoc: {
      userId: user.id,
      tier: user.tier,
      status: 'active',
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    },
    usageDoc: {
      userId: user.id,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      scansCount: user.id.includes('ratelimit') ? (user.monthlyScans || 10) : 0,
      lastScanAt: now,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export default TEST_USERS;
