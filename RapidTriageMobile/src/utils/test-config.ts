/**
 * Test Configuration Utility
 * Provides configuration management for test mode execution
 * Handles environment variables, mock settings, and test data setup
 */

import { Platform } from 'react-native';

/**
 * Test mode configuration interface
 * Defines all settings and flags available in test mode
 */
export interface TestConfig {
  // Environment settings
  isTestMode: boolean;
  enableMockAuth: boolean;
  enableMockAPI: boolean;
  autoLogin: boolean;
  skipOnboarding: boolean;
  
  // Test user credentials
  testUser: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  
  // Mock API delays for realistic testing
  delays: {
    auth: number;
    scan: number;
    api: number;
  };
  
  // Feature flags for testing specific features
  features: {
    referralProgram: boolean;
    trialExtension: boolean;
    emailMarketing: boolean;
    upgradePrompts: boolean;
  };
}

/**
 * Default test configuration
 * Provides sensible defaults for test mode execution
 */
const DEFAULT_TEST_CONFIG: TestConfig = {
  isTestMode: false,
  enableMockAuth: false,
  enableMockAPI: false,
  autoLogin: false,
  skipOnboarding: false,
  
  testUser: {
    email: 'test@rapidtriage.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User'
  },
  
  delays: {
    auth: 1000,
    scan: 3000,
    api: 500
  },
  
  features: {
    referralProgram: true,
    trialExtension: true,
    emailMarketing: true,
    upgradePrompts: true
  }
};

/**
 * Load test configuration from environment variables
 * Handles different platforms and fallback to defaults
 */
function loadTestConfig(): TestConfig {
  // Check if we're in a test environment
  const isTestMode = process.env.TEST_MODE === 'true' || 
                     process.env.APP_ENV === 'test' ||
                     process.env.NODE_ENV === 'test';

  if (!isTestMode) {
    return DEFAULT_TEST_CONFIG;
  }

  return {
    isTestMode: true,
    enableMockAuth: process.env.MOCK_AUTH === 'true',
    enableMockAPI: process.env.MOCK_API === 'true',
    autoLogin: process.env.AUTO_LOGIN === 'true',
    skipOnboarding: process.env.SKIP_ONBOARDING === 'true',
    
    testUser: {
      email: process.env.TEST_USER_EMAIL || DEFAULT_TEST_CONFIG.testUser.email,
      password: process.env.TEST_USER_PASSWORD || DEFAULT_TEST_CONFIG.testUser.password,
      firstName: process.env.TEST_USER_FIRST_NAME || DEFAULT_TEST_CONFIG.testUser.firstName,
      lastName: process.env.TEST_USER_LAST_NAME || DEFAULT_TEST_CONFIG.testUser.lastName
    },
    
    delays: {
      auth: parseInt(process.env.MOCK_AUTH_DELAY || '1000', 10),
      scan: parseInt(process.env.MOCK_SCAN_DELAY || '3000', 10),
      api: parseInt(process.env.MOCK_API_DELAY || '500', 10)
    },
    
    features: {
      referralProgram: process.env.ENABLE_REFERRAL_PROGRAM !== 'false',
      trialExtension: process.env.ENABLE_TRIAL_EXTENSION !== 'false',
      emailMarketing: process.env.ENABLE_EMAIL_MARKETING !== 'false',
      upgradePrompts: process.env.ENABLE_UPGRADE_PROMPTS !== 'false'
    }
  };
}

/**
 * Global test configuration instance
 * Loaded once and reused throughout the application
 */
export const testConfig = loadTestConfig();

/**
 * Utility functions for test mode operations
 */
export const TestUtils = {
  /**
   * Check if the app is running in test mode
   */
  isTestMode: () => testConfig.isTestMode,
  
  /**
   * Check if mock authentication should be used
   */
  shouldUseMockAuth: () => testConfig.isTestMode && testConfig.enableMockAuth,
  
  /**
   * Check if mock API should be used
   */
  shouldUseMockAPI: () => testConfig.isTestMode && testConfig.enableMockAPI,
  
  /**
   * Check if auto-login should be performed
   */
  shouldAutoLogin: () => testConfig.isTestMode && testConfig.autoLogin,
  
  /**
   * Check if onboarding should be skipped
   */
  shouldSkipOnboarding: () => testConfig.isTestMode && testConfig.skipOnboarding,
  
  /**
   * Get test user credentials
   */
  getTestUser: () => testConfig.testUser,
  
  /**
   * Get mock delay for specified operation
   */
  getDelay: (operation: 'auth' | 'scan' | 'api') => testConfig.delays[operation],
  
  /**
   * Check if a specific feature is enabled for testing
   */
  isFeatureEnabled: (feature: keyof TestConfig['features']) => testConfig.features[feature],
  
  /**
   * Log test configuration information
   * Helpful for debugging test setups
   */
  logConfig: () => {
    if (testConfig.isTestMode) {
      console.log('🧪 Test Mode Configuration:', {
        platform: Platform.OS,
        mockAuth: testConfig.enableMockAuth,
        mockAPI: testConfig.enableMockAPI,
        autoLogin: testConfig.autoLogin,
        skipOnboarding: testConfig.skipOnboarding,
        testUser: testConfig.testUser.email,
        delays: testConfig.delays,
        features: testConfig.features
      });
    }
  },
  
  /**
   * Create a mock delay for testing async operations
   * Simulates real-world API response times
   */
  createMockDelay: (operation: 'auth' | 'scan' | 'api') => {
    const delay = testConfig.delays[operation];
    return new Promise(resolve => setTimeout(resolve, delay));
  },
  
  /**
   * Generate mock data for testing
   * Creates realistic test data for various app components
   */
  generateMockUser: (overrides?: Partial<TestConfig['testUser']>) => ({
    id: 'test-user-' + Date.now(),
    email: overrides?.email || testConfig.testUser.email,
    firstName: overrides?.firstName || testConfig.testUser.firstName,
    lastName: overrides?.lastName || testConfig.testUser.lastName,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    subscription: {
      tierId: 'free' as const,
      status: 'active' as const,
      usage: {
        scansUsed: 3,
        scansLimit: 10
      }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }),
  
  /**
   * Generate mock triage report for testing
   */
  generateMockTriageReport: (url: string, overrides?: any) => ({
    id: 'report-' + Date.now(),
    url,
    status: 'completed' as const,
    results: {
      performance: {
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        metrics: {
          firstContentfulPaint: Math.floor(Math.random() * 1000) + 800,
          largestContentfulPaint: Math.floor(Math.random() * 2000) + 1500,
          cumulativeLayoutShift: Math.random() * 0.3,
          totalBlockingTime: Math.floor(Math.random() * 500) + 100,
          speedIndex: Math.floor(Math.random() * 1500) + 1200
        },
        opportunities: []
      },
      accessibility: {
        score: Math.floor(Math.random() * 20) + 80,
        violations: []
      },
      seo: {
        score: Math.floor(Math.random() * 25) + 75,
        audits: []
      },
      bestPractices: {
        score: Math.floor(Math.random() * 20) + 80,
        audits: []
      }
    },
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    ...overrides
  })
};

/**
 * Development helper to set test mode manually
 * Useful for development and debugging
 */
export const enableTestMode = (config?: Partial<TestConfig>) => {
  if (__DEV__) {
    Object.assign(testConfig, {
      isTestMode: true,
      enableMockAuth: true,
      enableMockAPI: true,
      ...config
    });
    TestUtils.logConfig();
  }
};

export default testConfig;