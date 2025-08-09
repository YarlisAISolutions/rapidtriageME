/**
 * Test Mode Initialization
 * Sets up the app for test mode execution
 * Initializes mock services and test data
 */

import { Platform } from 'react-native';
import { TestUtils, enableTestMode } from './utils/test-config';
import { ServiceFactory } from './services/service-factory';

/**
 * Initialize test mode
 * Sets up all required services and data for testing
 */
export async function initializeTestMode(): Promise<void> {
  // Only run in test environment
  if (!TestUtils.isTestMode()) {
    return;
  }

  console.log('🧪 Initializing Test Mode...');
  
  try {
    // Enable test mode with full mock configuration
    enableTestMode({
      isTestMode: true,
      enableMockAuth: true,
      enableMockAPI: true,
      autoLogin: TestUtils.shouldAutoLogin(),
      skipOnboarding: TestUtils.shouldSkipOnboarding(),
    });

    // Initialize all services
    await ServiceFactory.initializeServices();

    // Log test configuration
    TestUtils.logConfig();

    // Display test mode banner
    displayTestModeBanner();

    console.log('🧪 Test Mode initialized successfully');

  } catch (error) {
    console.error('🧪 Failed to initialize test mode:', error);
    throw error;
  }
}

/**
 * Display test mode information banner
 * Shows important test configuration details
 */
function displayTestModeBanner(): void {
  if (Platform.OS === 'web') {
    // Web-specific console styling
    console.log(
      '%c🧪 RapidTriage Mobile - Test Mode Active',
      'background: #2563EB; color: white; padding: 10px; border-radius: 5px; font-weight: bold;'
    );
    
    console.log(
      '%cTest Configuration:',
      'background: #10B981; color: white; padding: 5px; border-radius: 3px; font-weight: bold;'
    );
    
    const testUser = TestUtils.getTestUser();
    console.table({
      'Platform': Platform.OS,
      'Mock Auth': TestUtils.shouldUseMockAuth() ? '✅ Enabled' : '❌ Disabled',
      'Mock API': TestUtils.shouldUseMockAPI() ? '✅ Enabled' : '❌ Disabled',
      'Auto Login': TestUtils.shouldAutoLogin() ? '✅ Enabled' : '❌ Disabled',
      'Skip Onboarding': TestUtils.shouldSkipOnboarding() ? '✅ Enabled' : '❌ Disabled',
      'Test User Email': testUser.email,
      'Test User Password': testUser.password,
    });

    console.log(
      '%cMock Data Available:',
      'background: #F59E0B; color: white; padding: 5px; border-radius: 3px; font-weight: bold;'
    );
    
    console.log('• 📊 Sample triage reports with realistic scores');
    console.log('• 👥 Test user profiles with various subscription tiers');
    console.log('• 📈 Mock analytics data and trends');
    console.log('• 💳 Subscription and billing test scenarios');
    console.log('• 🔍 Performance, accessibility, and SEO audit results');

    console.log(
      '%cTesting Guide:',
      'background: #8B5CF6; color: white; padding: 5px; border-radius: 3px; font-weight: bold;'
    );
    
    console.log('1. 🚀 App will start with splash screen');
    console.log('2. 📝 Complete or skip onboarding flow');
    console.log('3. 🔐 Auto-login with test credentials (if enabled)');
    console.log('4. 🏠 Navigate: Home → Dashboard → Scan → Reports → Settings');
    console.log('5. 🧪 Test all interactive features with mock data');

  } else {
    // Mobile/native console output
    console.log('\n' + '='.repeat(50));
    console.log('🧪 RapidTriage Mobile - Test Mode Active');
    console.log('='.repeat(50));
    console.log('\n📱 Platform:', Platform.OS);
    console.log('🔐 Mock Auth:', TestUtils.shouldUseMockAuth() ? 'Enabled' : 'Disabled');
    console.log('🌐 Mock API:', TestUtils.shouldUseMockAPI() ? 'Enabled' : 'Disabled');
    console.log('🔄 Auto Login:', TestUtils.shouldAutoLogin() ? 'Enabled' : 'Disabled');
    
    const testUser = TestUtils.getTestUser();
    console.log('\n👤 Test User Credentials:');
    console.log('   Email:', testUser.email);
    console.log('   Password:', testUser.password);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

/**
 * Setup test data preloading
 * Preloads mock data for faster test execution
 */
export async function preloadTestData(): Promise<void> {
  if (!TestUtils.isTestMode()) {
    return;
  }

  console.log('🧪 Preloading test data...');

  try {
    // Import mock data generator
    const { MockDataGenerator } = await import('./utils/mock-data-generator');
    
    // Generate initial test data
    const testReports = MockDataGenerator.generateTriageReports(5);
    const testUsers = Array.from({ length: 3 }, () => MockDataGenerator.generateUser());
    
    console.log('🧪 Test data preloaded:');
    console.log(`   📊 ${testReports.length} sample reports`);
    console.log(`   👥 ${testUsers.length} test users`);
    
    // Store test data in global scope for easy access during testing
    if (typeof global !== 'undefined') {
      (global as any).__TEST_DATA__ = {
        reports: testReports,
        users: testUsers,
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    console.error('🧪 Failed to preload test data:', error);
  }
}

/**
 * Get preloaded test data
 * Returns test data for use in components
 */
export function getTestData(): {
  reports: any[];
  users: any[];
  timestamp: string;
} | null {
  if (typeof global !== 'undefined' && (global as any).__TEST_DATA__) {
    return (global as any).__TEST_DATA__;
  }
  return null;
}

/**
 * Reset test environment
 * Clears test data and resets services
 */
export async function resetTestEnvironment(): Promise<void> {
  if (!TestUtils.isTestMode()) {
    return;
  }

  console.log('🧪 Resetting test environment...');

  try {
    // Reset service factory
    ServiceFactory.resetAll();
    
    // Clear test data
    if (typeof global !== 'undefined') {
      delete (global as any).__TEST_DATA__;
    }

    // Re-initialize services
    await ServiceFactory.initializeServices();
    await preloadTestData();

    console.log('🧪 Test environment reset complete');

  } catch (error) {
    console.error('🧪 Failed to reset test environment:', error);
    throw error;
  }
}

// Export test mode utilities
export const TestModeUtils = {
  initialize: initializeTestMode,
  preloadData: preloadTestData,
  getTestData,
  reset: resetTestEnvironment,
  isActive: TestUtils.isTestMode,
  getTestUser: TestUtils.getTestUser,
  getServiceConfig: ServiceFactory.getServiceConfig
};