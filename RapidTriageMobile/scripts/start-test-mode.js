#!/usr/bin/env node

/**
 * Test Mode Startup Script
 * Launches the RapidTriage Mobile app in test mode with proper environment setup
 * Configures mock services, test data, and web-specific settings
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Environment variables for test mode
  env: {
    NODE_ENV: 'test',
    APP_ENV: 'test',
    TEST_MODE: 'true',
    MOCK_AUTH: 'true',
    MOCK_API: 'true',
    AUTO_LOGIN: 'true',
    SKIP_ONBOARDING: 'false',
    
    // Test user credentials
    TEST_USER_EMAIL: 'test@rapidtriage.com',
    TEST_USER_PASSWORD: 'TestPass123!',
    TEST_USER_FIRST_NAME: 'Test',
    TEST_USER_LAST_NAME: 'User',
    
    // Mock API configuration
    API_BASE_URL: 'https://api.test.rapidtriage.com',
    API_VERSION: 'v1',
    
    // Mock delays (in milliseconds)
    MOCK_AUTH_DELAY: '1000',
    MOCK_SCAN_DELAY: '3000',
    MOCK_API_DELAY: '500',
    
    // Feature flags
    ENABLE_REFERRAL_PROGRAM: 'true',
    ENABLE_TRIAL_EXTENSION: 'true',
    ENABLE_EMAIL_MARKETING: 'true',
    ENABLE_UPGRADE_PROMPTS: 'true',
    
    // Disable external services in test mode
    ENABLE_ANALYTICS: 'false',
    ENABLE_CRASH_REPORTING: 'false',
    ENABLE_PERFORMANCE_MONITORING: 'false'
  },
  
  // Expo web server options
  expoOptions: [
    '--web',
    '--port', '3000',
    '--host', 'localhost',
    '--dev-client', 'false'
  ]
};

/**
 * Console output utilities
 */
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(`  ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
  console.log('');
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Check if required dependencies are installed
 */
function checkDependencies() {
  logStep(1, 'Checking dependencies...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json not found. Please run this script from the project root directory.');
    process.exit(1);
  }
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    logError('node_modules not found. Please run "npm install" first.');
    process.exit(1);
  }
  
  logSuccess('Dependencies check passed');
}

/**
 * Set up test environment
 */
function setupTestEnvironment() {
  logStep(2, 'Setting up test environment...');
  
  // Set environment variables
  Object.entries(TEST_CONFIG.env).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  logSuccess('Test environment configured');
  logInfo('Test mode settings:');
  console.log('  📧 Test User:', TEST_CONFIG.env.TEST_USER_EMAIL);
  console.log('  🔑 Password:', TEST_CONFIG.env.TEST_USER_PASSWORD);
  console.log('  🌐 API URL:', TEST_CONFIG.env.API_BASE_URL);
  console.log('  🧪 Mock Services: Enabled');
  console.log('  🔄 Auto Login:', TEST_CONFIG.env.AUTO_LOGIN);
}

/**
 * Create test configuration file
 */
function createTestConfig() {
  logStep(3, 'Creating test configuration...');
  
  const testConfigContent = `// Auto-generated test configuration
// This file is created by the test startup script
export const TEST_MODE_CONFIG = {
  isTestMode: true,
  testUser: {
    email: '${TEST_CONFIG.env.TEST_USER_EMAIL}',
    password: '${TEST_CONFIG.env.TEST_USER_PASSWORD}',
    firstName: '${TEST_CONFIG.env.TEST_USER_FIRST_NAME}',
    lastName: '${TEST_CONFIG.env.TEST_USER_LAST_NAME}'
  },
  mockServices: {
    auth: true,
    api: true,
    analytics: true
  },
  delays: {
    auth: ${TEST_CONFIG.env.MOCK_AUTH_DELAY},
    scan: ${TEST_CONFIG.env.MOCK_SCAN_DELAY},
    api: ${TEST_CONFIG.env.MOCK_API_DELAY}
  },
  features: {
    autoLogin: ${TEST_CONFIG.env.AUTO_LOGIN},
    skipOnboarding: ${TEST_CONFIG.env.SKIP_ONBOARDING}
  }
};`;

  const configPath = path.join(process.cwd(), 'src', 'test-config.generated.ts');
  fs.writeFileSync(configPath, testConfigContent);
  
  logSuccess('Test configuration file created');
}

/**
 * Launch the Expo web server
 */
function launchExpoWeb() {
  logStep(4, 'Launching Expo web server...');
  
  logInfo('Starting Expo development server in test mode...');
  logInfo('The app will open in your default browser');
  logInfo('Server will be available at: http://localhost:3000');
  
  // Prepare environment for child process
  const childEnv = {
    ...process.env,
    ...TEST_CONFIG.env
  };
  
  // Spawn Expo web server
  const expoProcess = spawn('npx', ['expo', 'start', ...TEST_CONFIG.expoOptions], {
    stdio: 'inherit',
    env: childEnv,
    cwd: process.cwd()
  });
  
  // Handle process events
  expoProcess.on('error', (error) => {
    logError('Failed to start Expo server:');
    console.error(error);
    process.exit(1);
  });
  
  expoProcess.on('close', (code) => {
    if (code !== 0) {
      logError(`Expo server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle interrupt signals
  process.on('SIGINT', () => {
    log('\\nShutting down test server...', 'yellow');
    expoProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    log('\\nShutting down test server...', 'yellow');
    expoProcess.kill('SIGTERM');
  });
}

/**
 * Display post-launch information
 */
function displayInfo() {
  setTimeout(() => {
    console.log('');
    logHeader('🧪 RapidTriage Mobile - Test Mode Ready');
    
    logInfo('Test User Credentials:');
    console.log('  📧 Email: test@rapidtriage.com');
    console.log('  🔑 Password: TestPass123!');
    
    console.log('');
    logInfo('Available Test Features:');
    console.log('  ✅ Mock Authentication (auto-login enabled)');
    console.log('  ✅ Mock API with realistic data');
    console.log('  ✅ Simulated scan results');
    console.log('  ✅ Test user profiles and reports');
    console.log('  ✅ Mock subscription and billing');
    
    console.log('');
    logInfo('Testing Navigation:');
    console.log('  1. App starts with splash screen');
    console.log('  2. Proceeds through onboarding (if not skipped)');
    console.log('  3. Auto-login with test credentials');
    console.log('  4. Navigate to: Home → Dashboard → Scan → Reports → Settings');
    
    console.log('');
    logInfo('Mock Data:');
    console.log('  📊 Pre-generated scan reports');
    console.log('  👥 Test user profiles');
    console.log('  📈 Sample analytics data');
    console.log('  💳 Mock subscription info');
    
    console.log('');
    log('Press Ctrl+C to stop the test server', 'yellow');
    console.log('');
  }, 3000);
}

/**
 * Main execution function
 */
function main() {
  try {
    logHeader('🚀 Starting RapidTriage Mobile in Test Mode');
    
    checkDependencies();
    setupTestEnvironment();
    createTestConfig();
    launchExpoWeb();
    displayInfo();
    
  } catch (error) {
    logError('Failed to start test mode:');
    console.error(error);
    process.exit(1);
  }
}

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  logError('Uncaught exception:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError('Unhandled rejection:');
  console.error(reason);
  process.exit(1);
});

// Run the script
main();