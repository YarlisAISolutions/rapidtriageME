/**
 * E2E Test Case Definitions
 *
 * Comprehensive test cases for all RapidTriageME functionality
 * with descriptions, expected results, and documentation.
 */

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type TestCategory =
  | 'authentication'
  | 'api_management'
  | 'screenshot'
  | 'console_logs'
  | 'network_logs'
  | 'lighthouse'
  | 'subscription'
  | 'dashboard'
  | 'session'
  | 'webhooks'
  | 'rate_limiting'
  | 'error_handling';

export interface TestCase {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  expectedResult: string;
  requiredTier: 'free' | 'user' | 'team' | 'enterprise' | 'any';
  prerequisites: string[];
  steps: string[];
  cleanup?: string[];
}

export interface TestResult {
  testCase: TestCase;
  status: TestStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  screenshotPath?: string;
  error?: string;
  actualResult?: string;
  logs?: string[];
}

/**
 * All E2E Test Cases organized by category
 */
export const TEST_CASES: TestCase[] = [
  // ============================================
  // AUTHENTICATION TESTS
  // ============================================
  {
    id: 'AUTH-001',
    name: 'User Registration',
    category: 'authentication',
    description: 'Test new user registration flow with email and password',
    expectedResult: 'User account created, JWT token returned, user document created in Firestore',
    requiredTier: 'any',
    prerequisites: ['Health endpoint accessible'],
    steps: [
      'Send POST /auth/register with email, password, displayName',
      'Verify 201 status code returned',
      'Verify JWT token in response',
      'Verify user document exists in Firestore',
      'Verify default tier is "free"',
    ],
  },
  {
    id: 'AUTH-002',
    name: 'User Login',
    category: 'authentication',
    description: 'Test user login with valid credentials',
    expectedResult: 'JWT token returned, refresh token set',
    requiredTier: 'any',
    prerequisites: ['User registered (AUTH-001)'],
    steps: [
      'Send POST /auth/login with email and password',
      'Verify 200 status code',
      'Verify JWT token in response',
      'Verify refresh token in cookies/response',
    ],
  },
  {
    id: 'AUTH-003',
    name: 'Token Refresh',
    category: 'authentication',
    description: 'Test JWT token refresh using refresh token',
    expectedResult: 'New JWT token issued without re-authentication',
    requiredTier: 'any',
    prerequisites: ['User logged in (AUTH-002)'],
    steps: [
      'Send POST /auth/refresh with refresh token',
      'Verify 200 status code',
      'Verify new JWT token in response',
      'Verify old token is invalidated (optional)',
    ],
  },
  {
    id: 'AUTH-004',
    name: 'User Logout',
    category: 'authentication',
    description: 'Test user logout and token invalidation',
    expectedResult: 'Session terminated, tokens invalidated',
    requiredTier: 'any',
    prerequisites: ['User logged in (AUTH-002)'],
    steps: [
      'Send POST /auth/logout with JWT token',
      'Verify 200 status code',
      'Verify refresh token is invalidated',
      'Verify subsequent requests with old token fail',
    ],
  },
  {
    id: 'AUTH-005',
    name: 'Invalid Login Attempt',
    category: 'authentication',
    description: 'Test login with invalid credentials',
    expectedResult: '401 Unauthorized returned, no tokens issued',
    requiredTier: 'any',
    prerequisites: ['User registered (AUTH-001)'],
    steps: [
      'Send POST /auth/login with wrong password',
      'Verify 401 status code',
      'Verify error message returned',
      'Verify no tokens in response',
    ],
  },

  // ============================================
  // API KEY MANAGEMENT TESTS
  // ============================================
  {
    id: 'API-001',
    name: 'Create API Key',
    category: 'api_management',
    description: 'Test API key creation for authenticated user',
    expectedResult: 'API key created and returned, stored in Firestore',
    requiredTier: 'user',
    prerequisites: ['User logged in (AUTH-002)', 'User tier >= user'],
    steps: [
      'Call createApiKey callable function',
      'Verify API key returned in response',
      'Verify API key stored in Firestore apiKeys collection',
      'Verify API key has correct permissions',
    ],
  },
  {
    id: 'API-002',
    name: 'Use API Key for Authentication',
    category: 'api_management',
    description: 'Test using API key to authenticate API requests',
    expectedResult: 'Request authenticated successfully with API key',
    requiredTier: 'user',
    prerequisites: ['API key created (API-001)'],
    steps: [
      'Send request to /api/health with X-API-Key header',
      'Verify 200 status code',
      'Verify request context has user ID',
    ],
  },
  {
    id: 'API-003',
    name: 'Revoke API Key',
    category: 'api_management',
    description: 'Test API key revocation',
    expectedResult: 'API key revoked, subsequent requests fail',
    requiredTier: 'user',
    prerequisites: ['API key created (API-001)'],
    steps: [
      'Call revokeApiKey callable function',
      'Verify success response',
      'Send request with revoked API key',
      'Verify 401 Unauthorized',
    ],
  },
  {
    id: 'API-004',
    name: 'Free Tier Cannot Create API Key',
    category: 'api_management',
    description: 'Verify free tier users cannot create API keys',
    expectedResult: 'Permission denied error returned',
    requiredTier: 'free',
    prerequisites: ['Free tier user logged in'],
    steps: [
      'Call createApiKey callable function as free user',
      'Verify permission-denied error',
      'Verify no API key created',
    ],
  },

  // ============================================
  // SCREENSHOT CAPTURE TESTS
  // ============================================
  {
    id: 'SCREEN-001',
    name: 'Capture Screenshot',
    category: 'screenshot',
    description: 'Test screenshot capture for a web page',
    expectedResult: 'Screenshot captured and stored in Firebase Storage',
    requiredTier: 'free',
    prerequisites: ['User logged in', 'Browser session active'],
    steps: [
      'Call captureScreenshot callable function with URL',
      'Verify screenshot ID returned',
      'Verify screenshot stored in Firebase Storage',
      'Verify metadata in Firestore screenshots collection',
      'Verify usage counter incremented',
    ],
  },
  {
    id: 'SCREEN-002',
    name: 'Screenshot with Custom Options',
    category: 'screenshot',
    description: 'Test screenshot with viewport and format options',
    expectedResult: 'Screenshot captured with specified dimensions and format',
    requiredTier: 'user',
    prerequisites: ['User tier >= user'],
    steps: [
      'Call captureScreenshot with width, height, format options',
      'Verify screenshot matches requested dimensions',
      'Verify screenshot format (PNG/JPEG)',
    ],
  },
  {
    id: 'SCREEN-003',
    name: 'Screenshot Usage Limit - Free Tier',
    category: 'screenshot',
    description: 'Verify free tier screenshot limit (10/month)',
    expectedResult: 'After 10 screenshots, further captures are blocked',
    requiredTier: 'free',
    prerequisites: ['Free tier user with 10 screenshots used'],
    steps: [
      'Attempt to capture 11th screenshot',
      'Verify quota-exceeded error',
      'Verify usage count remains at 10',
    ],
  },

  // ============================================
  // CONSOLE LOGS TESTS
  // ============================================
  {
    id: 'CONSOLE-001',
    name: 'Capture Console Logs',
    category: 'console_logs',
    description: 'Test capturing browser console logs via extension',
    expectedResult: 'Console logs captured and returned via API',
    requiredTier: 'free',
    prerequisites: ['Extension connected', 'Browser session active'],
    steps: [
      'Inject console.log statements into test page',
      'Send GET /api/console-logs',
      'Verify logs array returned',
      'Verify log levels (log, warn, error) captured',
      'Verify timestamps present',
    ],
  },
  {
    id: 'CONSOLE-002',
    name: 'Capture Console Errors Only',
    category: 'console_logs',
    description: 'Test filtering for console errors only',
    expectedResult: 'Only error-level logs returned',
    requiredTier: 'free',
    prerequisites: ['Console logs available (CONSOLE-001)'],
    steps: [
      'Send GET /api/console-errors',
      'Verify only error level logs returned',
      'Verify warnings and info logs excluded',
    ],
  },
  {
    id: 'CONSOLE-003',
    name: 'Clear Console Logs',
    category: 'console_logs',
    description: 'Test clearing captured console logs',
    expectedResult: 'Console logs cleared from session',
    requiredTier: 'free',
    prerequisites: ['Console logs captured (CONSOLE-001)'],
    steps: [
      'Send POST /api/wipe-logs',
      'Verify 200 status',
      'Send GET /api/console-logs',
      'Verify empty logs array',
    ],
  },

  // ============================================
  // NETWORK LOGS TESTS
  // ============================================
  {
    id: 'NETWORK-001',
    name: 'Capture Network Requests',
    category: 'network_logs',
    description: 'Test capturing browser network requests',
    expectedResult: 'Network requests captured with method, URL, status',
    requiredTier: 'free',
    prerequisites: ['Extension connected', 'Browser session active'],
    steps: [
      'Navigate to page that makes API calls',
      'Send GET /api/network-logs',
      'Verify requests array returned',
      'Verify request details (method, URL, status, timing)',
    ],
  },
  {
    id: 'NETWORK-002',
    name: 'Capture Network Errors',
    category: 'network_logs',
    description: 'Test capturing failed network requests',
    expectedResult: 'Only failed requests (4xx, 5xx) returned',
    requiredTier: 'free',
    prerequisites: ['Network requests captured (NETWORK-001)'],
    steps: [
      'Trigger failing network request on test page',
      'Send GET /api/network-errors',
      'Verify only error responses returned',
      'Verify error details present',
    ],
  },

  // ============================================
  // LIGHTHOUSE AUDIT TESTS
  // ============================================
  {
    id: 'LIGHT-001',
    name: 'Run Accessibility Audit',
    category: 'lighthouse',
    description: 'Run Lighthouse accessibility audit on a URL',
    expectedResult: 'Accessibility score and issues returned',
    requiredTier: 'user',
    prerequisites: ['User tier >= user'],
    steps: [
      'Send POST /api/lighthouse with category=accessibility',
      'Verify audit runs (may take 10-30 seconds)',
      'Verify accessibility score returned (0-100)',
      'Verify issues/suggestions array',
    ],
  },
  {
    id: 'LIGHT-002',
    name: 'Run Performance Audit',
    category: 'lighthouse',
    description: 'Run Lighthouse performance audit on a URL',
    expectedResult: 'Performance score and metrics returned',
    requiredTier: 'user',
    prerequisites: ['User tier >= user'],
    steps: [
      'Send POST /api/lighthouse with category=performance',
      'Verify performance score returned',
      'Verify Core Web Vitals present (LCP, FID, CLS)',
    ],
  },
  {
    id: 'LIGHT-003',
    name: 'Run SEO Audit',
    category: 'lighthouse',
    description: 'Run Lighthouse SEO audit on a URL',
    expectedResult: 'SEO score and recommendations returned',
    requiredTier: 'user',
    prerequisites: ['User tier >= user'],
    steps: [
      'Send POST /api/lighthouse with category=seo',
      'Verify SEO score returned',
      'Verify SEO issues/recommendations array',
    ],
  },
  {
    id: 'LIGHT-004',
    name: 'Run Best Practices Audit',
    category: 'lighthouse',
    description: 'Run Lighthouse best practices audit',
    expectedResult: 'Best practices score and issues returned',
    requiredTier: 'user',
    prerequisites: ['User tier >= user'],
    steps: [
      'Send POST /api/lighthouse with category=best-practices',
      'Verify best practices score returned',
      'Verify issues array with recommendations',
    ],
  },
  {
    id: 'LIGHT-005',
    name: 'Full Lighthouse Audit',
    category: 'lighthouse',
    description: 'Run complete Lighthouse audit with all categories',
    expectedResult: 'All category scores and combined report returned',
    requiredTier: 'team',
    prerequisites: ['User tier >= team'],
    steps: [
      'Send POST /api/lighthouse with all categories',
      'Verify all scores returned',
      'Verify combined report generated',
    ],
  },

  // ============================================
  // SUBSCRIPTION TESTS
  // ============================================
  {
    id: 'SUB-001',
    name: 'Get Subscription Status',
    category: 'subscription',
    description: 'Get current user subscription details',
    expectedResult: 'Subscription tier, status, and usage returned',
    requiredTier: 'any',
    prerequisites: ['User logged in'],
    steps: [
      'Call getSubscription callable function',
      'Verify tier returned',
      'Verify pricing plans returned',
      'Verify subscription status if applicable',
    ],
  },
  {
    id: 'SUB-002',
    name: 'Create Checkout Session',
    category: 'subscription',
    description: 'Create Stripe checkout session for upgrade',
    expectedResult: 'Checkout session ID and URL returned',
    requiredTier: 'free',
    prerequisites: ['User logged in', 'Valid price ID'],
    steps: [
      'Call createCheckoutSession with priceId',
      'Verify sessionId returned',
      'Verify checkout URL returned',
      'Verify URL is valid Stripe checkout URL',
    ],
  },
  {
    id: 'SUB-003',
    name: 'Create Portal Session',
    category: 'subscription',
    description: 'Create Stripe billing portal session',
    expectedResult: 'Portal URL returned for subscription management',
    requiredTier: 'user',
    prerequisites: ['User has active subscription'],
    steps: [
      'Call createPortalSession with returnUrl',
      'Verify portal URL returned',
      'Verify URL is valid Stripe portal URL',
    ],
  },
  {
    id: 'SUB-004',
    name: 'Cancel Subscription',
    category: 'subscription',
    description: 'Cancel subscription at period end',
    expectedResult: 'Subscription set to cancel, access retained until period end',
    requiredTier: 'user',
    prerequisites: ['User has active subscription'],
    steps: [
      'Call cancelSubscription callable function',
      'Verify success response',
      'Verify cancelAtPeriodEnd = true in Firestore',
      'Verify user still has access',
    ],
  },
  {
    id: 'SUB-005',
    name: 'Reactivate Subscription',
    category: 'subscription',
    description: 'Reactivate a subscription set to cancel',
    expectedResult: 'Subscription reactivated, will renew normally',
    requiredTier: 'user',
    prerequisites: ['Subscription set to cancel (SUB-004)'],
    steps: [
      'Call reactivateSubscription callable function',
      'Verify success response',
      'Verify cancelAtPeriodEnd = false',
    ],
  },

  // ============================================
  // DASHBOARD TESTS
  // ============================================
  {
    id: 'DASH-001',
    name: 'Get Dashboard Stats',
    category: 'dashboard',
    description: 'Get user dashboard statistics',
    expectedResult: 'User info, subscription, usage, recent audits returned',
    requiredTier: 'any',
    prerequisites: ['User logged in'],
    steps: [
      'Send GET /api/dashboard/stats',
      'Verify user info in response',
      'Verify subscription details',
      'Verify usage statistics',
      'Verify recent audits array',
    ],
  },
  {
    id: 'DASH-002',
    name: 'Check Scan Allowed',
    category: 'dashboard',
    description: 'Check if user can perform a scan (quota check)',
    expectedResult: 'Allowed status and remaining scans returned',
    requiredTier: 'any',
    prerequisites: ['User logged in'],
    steps: [
      'Send GET /api/dashboard/check-scan',
      'Verify allowed boolean returned',
      'Verify scansUsed count',
      'Verify scansRemaining count',
    ],
  },
  {
    id: 'DASH-003',
    name: 'Get Billing History',
    category: 'dashboard',
    description: 'Get user billing/invoice history',
    expectedResult: 'List of invoices returned',
    requiredTier: 'user',
    prerequisites: ['User has subscription history'],
    steps: [
      'Send GET /api/dashboard/billing-history',
      'Verify invoices array returned',
      'Verify invoice details (amount, date, status)',
    ],
  },

  // ============================================
  // SESSION MANAGEMENT TESTS
  // ============================================
  {
    id: 'SESSION-001',
    name: 'Create Browser Session',
    category: 'session',
    description: 'Create a new browser debugging session',
    expectedResult: 'Session ID returned, session stored in Firestore',
    requiredTier: 'free',
    prerequisites: ['User logged in'],
    steps: [
      'Send POST /api/sessions with origin URL',
      'Verify sessionId returned',
      'Verify session in Firestore',
      'Verify session status is active',
    ],
  },
  {
    id: 'SESSION-002',
    name: 'Get Session Status',
    category: 'session',
    description: 'Get current session details',
    expectedResult: 'Session info, logs count, duration returned',
    requiredTier: 'free',
    prerequisites: ['Session created (SESSION-001)'],
    steps: [
      'Send GET /api/sessions/:sessionId',
      'Verify session details returned',
      'Verify logs counts',
      'Verify duration/timing info',
    ],
  },
  {
    id: 'SESSION-003',
    name: 'End Browser Session',
    category: 'session',
    description: 'End an active browser session',
    expectedResult: 'Session ended, final stats calculated',
    requiredTier: 'free',
    prerequisites: ['Session active (SESSION-001)'],
    steps: [
      'Send POST /api/sessions/:sessionId/end',
      'Verify session status is ended',
      'Verify endedAt timestamp set',
      'Verify final stats calculated',
    ],
  },

  // ============================================
  // WEBHOOK TESTS
  // ============================================
  {
    id: 'HOOK-001',
    name: 'Stripe Subscription Webhook',
    category: 'webhooks',
    description: 'Test Stripe subscription.updated webhook handling',
    expectedResult: 'Subscription status updated in Firestore',
    requiredTier: 'any',
    prerequisites: ['Stripe webhook secret configured'],
    steps: [
      'Send POST /stripeWebhook with test subscription event',
      'Verify 200 status',
      'Verify Firestore subscription updated',
    ],
  },
  {
    id: 'HOOK-002',
    name: 'Invalid Webhook Signature',
    category: 'webhooks',
    description: 'Test webhook with invalid signature is rejected',
    expectedResult: '400 error returned, no changes made',
    requiredTier: 'any',
    prerequisites: [],
    steps: [
      'Send POST /stripeWebhook with invalid signature',
      'Verify 400 status returned',
      'Verify error message about signature',
    ],
  },

  // ============================================
  // RATE LIMITING TESTS
  // ============================================
  {
    id: 'RATE-001',
    name: 'Rate Limit Enforcement',
    category: 'rate_limiting',
    description: 'Test API rate limiting (100 req/min)',
    expectedResult: 'After 100 requests, 429 Too Many Requests returned',
    requiredTier: 'any',
    prerequisites: [],
    steps: [
      'Send 100 rapid API requests',
      'Verify first 100 succeed',
      'Send 101st request',
      'Verify 429 status returned',
      'Verify Retry-After header present',
    ],
  },
  {
    id: 'RATE-002',
    name: 'Rate Limit Headers',
    category: 'rate_limiting',
    description: 'Verify rate limit headers in responses',
    expectedResult: 'X-RateLimit headers present in responses',
    requiredTier: 'any',
    prerequisites: [],
    steps: [
      'Send API request',
      'Verify X-RateLimit-Limit header',
      'Verify X-RateLimit-Remaining header',
      'Verify X-RateLimit-Reset header',
    ],
  },

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  {
    id: 'ERR-001',
    name: 'Invalid Endpoint',
    category: 'error_handling',
    description: 'Test 404 handling for invalid endpoints',
    expectedResult: '404 Not Found with error message',
    requiredTier: 'any',
    prerequisites: [],
    steps: [
      'Send request to /api/nonexistent',
      'Verify 404 status',
      'Verify error message in response',
    ],
  },
  {
    id: 'ERR-002',
    name: 'Unauthenticated Request',
    category: 'error_handling',
    description: 'Test 401 handling for requests without auth',
    expectedResult: '401 Unauthorized returned',
    requiredTier: 'any',
    prerequisites: [],
    steps: [
      'Send request to protected endpoint without token',
      'Verify 401 status',
      'Verify authentication error message',
    ],
  },
  {
    id: 'ERR-003',
    name: 'Invalid Request Body',
    category: 'error_handling',
    description: 'Test 400 handling for malformed requests',
    expectedResult: '400 Bad Request with validation errors',
    requiredTier: 'any',
    prerequisites: ['User logged in'],
    steps: [
      'Send POST request with invalid/missing required fields',
      'Verify 400 status',
      'Verify validation error details',
    ],
  },
];

/**
 * Get test cases by category
 */
export function getTestCasesByCategory(category: TestCategory): TestCase[] {
  return TEST_CASES.filter((tc) => tc.category === category);
}

/**
 * Get test cases by required tier
 */
export function getTestCasesByTier(tier: TestCase['requiredTier']): TestCase[] {
  if (tier === 'any') {
    return TEST_CASES;
  }
  const tierHierarchy = ['free', 'user', 'team', 'enterprise'];
  const tierIndex = tierHierarchy.indexOf(tier);
  return TEST_CASES.filter((tc) => {
    if (tc.requiredTier === 'any') return true;
    const tcTierIndex = tierHierarchy.indexOf(tc.requiredTier);
    return tcTierIndex <= tierIndex;
  });
}

/**
 * Get test case by ID
 */
export function getTestCaseById(id: string): TestCase | undefined {
  return TEST_CASES.find((tc) => tc.id === id);
}

export default TEST_CASES;
