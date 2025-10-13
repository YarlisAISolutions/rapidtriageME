/**
 * Test Data Fixtures
 * Centralized test data for consistent testing across Chrome MVP
 */

export const TestUsers = {
  free: {
    email: 'test-free@rapidtriage.me',
    password: 'TestPassword123!',
    plan: 'free',
    expectedFeatures: ['basic-debugging', 'console-logs', 'screenshots']
  },
  pro: {
    email: 'test-pro@rapidtriage.me',
    password: 'TestPassword123!',
    plan: 'pro',
    expectedFeatures: ['basic-debugging', 'console-logs', 'screenshots', 'lighthouse-audits', 'network-analysis']
  },
  enterprise: {
    email: 'test-enterprise@rapidtriage.me',
    password: 'TestPassword123!',
    plan: 'enterprise',
    expectedFeatures: ['basic-debugging', 'console-logs', 'screenshots', 'lighthouse-audits', 'network-analysis', 'team-workspaces', 'sso']
  }
};

export const TestURLs = {
  production: 'https://rapidtriage.me',
  staging: 'https://staging.rapidtriage.me',
  local: 'http://localhost:8787',

  // Critical pages for monetization testing
  landing: '/',
  pricing: '/pricing',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  billing: '/billing',
  profile: '/profile',
  settings: '/settings',

  // Legal pages
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  contact: '/contact'
};

export const PricingPlans = {
  free: {
    name: 'Free',
    price: '$0',
    billing: 'forever',
    features: [
      'Basic browser debugging',
      'Console log capture',
      'Screenshot tools',
      'Community support'
    ],
    limitations: {
      'screenshots-per-month': 100,
      'audit-reports': 5,
      'storage-days': 7
    }
  },
  pro: {
    name: 'Professional',
    monthlyPrice: '$29',
    annualPrice: '$290',
    billing: 'per month',
    features: [
      'All Free features',
      'Lighthouse audits',
      'Network analysis',
      'Performance monitoring',
      'Priority support',
      'Extended history'
    ],
    limitations: {
      'screenshots-per-month': 1000,
      'audit-reports': 100,
      'storage-days': 30
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    billing: 'contact sales',
    features: [
      'All Pro features',
      'Team workspaces',
      'SSO integration',
      'Custom integrations',
      'Dedicated support',
      'Unlimited storage'
    ],
    limitations: {
      'screenshots-per-month': 'unlimited',
      'audit-reports': 'unlimited',
      'storage-days': 'unlimited'
    }
  }
};

export const PerformanceThresholds = {
  pageLoad: {
    excellent: 1000,   // < 1s
    good: 2500,        // < 2.5s
    acceptable: 4000   // < 4s
  },
  interaction: {
    excellent: 100,    // < 100ms
    good: 300,         // < 300ms
    acceptable: 500    // < 500ms
  },
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 90
  }
};

export const ErrorMessages = {
  authentication: {
    invalidCredentials: 'Invalid email or password',
    tokenExpired: 'Your session has expired',
    insufficientPermissions: 'You do not have permission to access this resource'
  },
  billing: {
    planLimitReached: 'You have reached your plan limit',
    paymentFailed: 'Payment processing failed',
    subscriptionCancelled: 'Your subscription has been cancelled'
  },
  browser: {
    screenshotFailed: 'Failed to capture screenshot',
    connectionTimeout: 'Browser connection timeout',
    extensionNotFound: 'RapidTriage extension not found'
  }
};