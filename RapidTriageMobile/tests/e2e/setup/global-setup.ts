/**
 * Global Test Setup
 * Prepares the test environment before running all tests
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Setting up global test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  process.env.MOCK_AUTH = 'true';
  process.env.MOCK_API = 'true';
  process.env.SKIP_ONBOARDING = 'true';
  
  console.log('🧪 Global test setup complete');
}

export default globalSetup;