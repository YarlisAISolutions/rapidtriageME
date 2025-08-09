/**
 * Global Test Teardown
 * Cleans up after all tests have completed
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧪 Cleaning up global test environment...');
  
  // Clean up any global resources
  // In this case, we don't have any persistent resources to clean up
  
  console.log('🧪 Global test teardown complete');
}

export default globalTeardown;