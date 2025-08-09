#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs the complete test suite for RapidTriage Mobile
 * Includes unit tests, integration tests, and end-to-end tests
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Console colors
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
  log('='.repeat(80), 'cyan');
  log(`  ${message}`, 'cyan');
  log('='.repeat(80), 'cyan');
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
 * Test configuration
 */
const TEST_CONFIG = {
  // Test types to run
  tests: {
    unit: true,
    integration: false, // Not implemented yet
    e2e: true,
    lint: true,
    typeCheck: true
  },
  
  // Test environment
  env: {
    NODE_ENV: 'test',
    TEST_MODE: 'true',
    MOCK_AUTH: 'true',
    MOCK_API: 'true',
    SKIP_ONBOARDING: 'true',
    AUTO_LOGIN: 'false'
  },
  
  // Timeouts
  timeouts: {
    serverStart: 120000, // 2 minutes
    testExecution: 600000 // 10 minutes
  },
  
  // Results
  results: {
    unit: null,
    integration: null,
    e2e: null,
    lint: null,
    typeCheck: null
  }
};

/**
 * Run a command and return a promise
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...TEST_CONFIG.env, ...options.env },
      cwd: process.cwd(),
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Check prerequisites
 */
async function checkPrerequisites() {
  logStep(1, 'Checking prerequisites...');
  
  // Check if we're in the right directory
  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    throw new Error('package.json not found. Please run from project root.');
  }
  
  // Check if node_modules exists
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    logError('node_modules not found. Installing dependencies...');
    await runCommand('npm', ['install']);
  }
  
  logSuccess('Prerequisites check passed');
}

/**
 * Run TypeScript type checking
 */
async function runTypeCheck() {
  if (!TEST_CONFIG.tests.typeCheck) return;
  
  logStep(2, 'Running TypeScript type check...');
  
  try {
    await runCommand('npm', ['run', 'type-check']);
    TEST_CONFIG.results.typeCheck = { success: true, message: 'Type check passed' };
    logSuccess('TypeScript type check passed');
  } catch (error) {
    TEST_CONFIG.results.typeCheck = { success: false, error: error.message };
    logError('TypeScript type check failed');
    throw error;
  }
}

/**
 * Run ESLint
 */
async function runLint() {
  if (!TEST_CONFIG.tests.lint) return;
  
  logStep(3, 'Running ESLint...');
  
  try {
    await runCommand('npm', ['run', 'lint']);
    TEST_CONFIG.results.lint = { success: true, message: 'Lint check passed' };
    logSuccess('ESLint check passed');
  } catch (error) {
    TEST_CONFIG.results.lint = { success: false, error: error.message };
    logError('ESLint check failed');
    // Don't throw - continue with other tests
  }
}

/**
 * Run unit tests
 */
async function runUnitTests() {
  if (!TEST_CONFIG.tests.unit) return;
  
  logStep(4, 'Running unit tests...');
  
  try {
    await runCommand('npm', ['test', '--', '--passWithNoTests', '--watchAll=false']);
    TEST_CONFIG.results.unit = { success: true, message: 'Unit tests passed' };
    logSuccess('Unit tests passed');
  } catch (error) {
    TEST_CONFIG.results.unit = { success: false, error: error.message };
    logError('Unit tests failed');
    // Don't throw - continue with other tests
  }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
  if (!TEST_CONFIG.tests.integration) return;
  
  logStep(5, 'Running integration tests...');
  
  // Integration tests not implemented yet
  logInfo('Integration tests not implemented yet');
  TEST_CONFIG.results.integration = { success: true, message: 'No integration tests to run' };
}

/**
 * Run end-to-end tests
 */
async function runE2ETests() {
  if (!TEST_CONFIG.tests.e2e) return;
  
  logStep(6, 'Running end-to-end tests...');
  
  try {
    // Install Playwright browsers if needed
    logInfo('Installing Playwright browsers (if needed)...');
    await runCommand('npx', ['playwright', 'install'], { stdio: 'pipe' });
    
    // Run Playwright tests
    await runCommand('npm', ['run', 'test:e2e']);
    TEST_CONFIG.results.e2e = { success: true, message: 'E2E tests passed' };
    logSuccess('End-to-end tests passed');
  } catch (error) {
    TEST_CONFIG.results.e2e = { success: false, error: error.message };
    logError('End-to-end tests failed');
    // Don't throw - we want to see the final report
  }
}

/**
 * Generate test report
 */
function generateReport() {
  logHeader('🧪 Test Suite Report');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  Object.entries(TEST_CONFIG.results).forEach(([testType, result]) => {
    if (result === null) return; // Test was skipped
    
    totalTests++;
    
    if (result.success) {
      passedTests++;
      log(`✅ ${testType.toUpperCase()}: ${result.message}`, 'green');
    } else {
      failedTests++;
      log(`❌ ${testType.toUpperCase()}: ${result.error}`, 'red');
    }
  });
  
  console.log('');
  log(`📊 Test Summary:`, 'cyan');
  log(`   Total Tests: ${totalTests}`, 'white');
  log(`   Passed: ${passedTests}`, 'green');
  log(`   Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'white');
  log(`   Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`, 
      failedTests === 0 ? 'green' : 'yellow');
  
  console.log('');
  
  if (failedTests === 0) {
    logSuccess('All tests passed! 🎉');
    return true;
  } else {
    logError(`${failedTests} test(s) failed`);
    return false;
  }
}

/**
 * Clean up test artifacts
 */
function cleanup() {
  logInfo('Cleaning up test artifacts...');
  
  // Clean up generated files
  const filesToClean = [
    'src/test-config.generated.ts',
    'test-results',
    'playwright-report'
  ];
  
  filesToClean.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      if (fs.lstatSync(filePath).isDirectory()) {
        // Remove directory recursively (simplified)
        try {
          fs.rmSync(filePath, { recursive: true, force: true });
        } catch (error) {
          // Ignore cleanup errors
        }
      } else {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  });
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();
  
  try {
    logHeader('🧪 RapidTriage Mobile - Full Test Suite');
    
    logInfo('Test Configuration:');
    console.log('  📋 Unit Tests:', TEST_CONFIG.tests.unit ? 'Enabled' : 'Disabled');
    console.log('  🔗 Integration Tests:', TEST_CONFIG.tests.integration ? 'Enabled' : 'Disabled');
    console.log('  🌐 E2E Tests:', TEST_CONFIG.tests.e2e ? 'Enabled' : 'Disabled');
    console.log('  🧹 Lint Check:', TEST_CONFIG.tests.lint ? 'Enabled' : 'Disabled');
    console.log('  🔍 Type Check:', TEST_CONFIG.tests.typeCheck ? 'Enabled' : 'Disabled');
    console.log('');
    
    // Run all test phases
    await checkPrerequisites();
    await runTypeCheck();
    await runLint();
    await runUnitTests();
    await runIntegrationTests();
    await runE2ETests();
    
    // Generate final report
    const success = generateReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    logInfo(`Total execution time: ${duration} seconds`);
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    logError('Test suite failed:');
    console.error(error);
    process.exit(1);
  } finally {
    cleanup();
  }
}

// Handle interruption
process.on('SIGINT', () => {
  log('\\nTest suite interrupted by user', 'yellow');
  cleanup();
  process.exit(1);
});

// Run the test suite
main();