#!/usr/bin/env node

/**
 * RapidTriageME Playwright Test Runner
 * Executes all test suites with proper environment setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.RAPIDTRIAGE_URL || 'https://rapidtriage.me',
  keycloakURL: process.env.KEYCLOAK_URL || 'https://auth.yarlis.ai',
  apiToken: process.env.RAPIDTRIAGE_API_TOKEN || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8',
  headless: process.env.HEADLESS !== 'false',
  slowMo: parseInt(process.env.SLOW_MO || '0'),
  timeout: parseInt(process.env.TIMEOUT || '30000')
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Authentication',
    file: 'tests/authentication.spec.ts',
    description: 'Login, SSO, 2FA, and session management'
  },
  {
    name: 'Subscription Tiers',
    file: 'tests/subscription-tiers.spec.ts',
    description: 'Free, Starter, Pro, and Enterprise tier permissions'
  },
  {
    name: 'Organization Roles',
    file: 'tests/organization-roles.spec.ts',
    description: 'Owner, Admin, Developer, Analyst, Viewer, and Billing roles'
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log();
  log('═'.repeat(60), colors.cyan);
  log(`  ${title}`, colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  console.log();
}

function checkDependencies() {
  logSection('Checking Dependencies');

  try {
    // Check if Playwright is installed
    require.resolve('@playwright/test');
    log('✓ Playwright is installed', colors.green);
  } catch {
    log('✗ Playwright not found. Installing...', colors.yellow);
    execSync('npm install -D @playwright/test', { stdio: 'inherit' });
    log('✓ Playwright installed successfully', colors.green);
  }

  // Check if browsers are installed
  try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    log('✓ Browsers are installed', colors.green);
  } catch {
    log('⚠ Installing browsers...', colors.yellow);
    execSync('npx playwright install', { stdio: 'inherit' });
    log('✓ Browsers installed successfully', colors.green);
  }
}

function createEnvFile() {
  const envPath = path.join(__dirname, '.env.test');
  const envContent = `
# RapidTriageME Test Environment
RAPIDTRIAGE_URL=${TEST_CONFIG.baseURL}
KEYCLOAK_URL=${TEST_CONFIG.keycloakURL}
RAPIDTRIAGE_API_TOKEN=${TEST_CONFIG.apiToken}
HEADLESS=${TEST_CONFIG.headless}
SLOW_MO=${TEST_CONFIG.slowMo}
TIMEOUT=${TEST_CONFIG.timeout}
`.trim();

  fs.writeFileSync(envPath, envContent);
  log(`✓ Created test environment file: ${envPath}`, colors.green);
}

function runTests() {
  logSection('Running Test Suites');

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const suite of TEST_SUITES) {
    log(`Running: ${suite.name}`, colors.blue);
    log(`  ${suite.description}`, colors.cyan);

    try {
      const command = `npx playwright test ${suite.file} --config=playwright.config.ts`;
      const output = execSync(command, {
        cwd: __dirname,
        env: { ...process.env, ...TEST_CONFIG },
        encoding: 'utf8'
      });

      // Parse test results from output
      const passMatch = output.match(/(\d+) passed/);
      const failMatch = output.match(/(\d+) failed/);
      const skipMatch = output.match(/(\d+) skipped/);

      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;
      const skipped = skipMatch ? parseInt(skipMatch[1]) : 0;

      totalPassed += passed;
      totalFailed += failed;
      totalSkipped += skipped;

      results.push({
        suite: suite.name,
        passed,
        failed,
        skipped,
        status: failed === 0 ? 'PASSED' : 'FAILED'
      });

      if (failed === 0) {
        log(`  ✓ ${suite.name} passed (${passed} tests)`, colors.green);
      } else {
        log(`  ✗ ${suite.name} failed (${failed} failures)`, colors.red);
      }
    } catch (error) {
      log(`  ✗ ${suite.name} failed with error`, colors.red);
      results.push({
        suite: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        status: 'ERROR',
        error: error.message
      });
      totalFailed += 1;
    }
  }

  return { results, totalPassed, totalFailed, totalSkipped };
}

function generateReport(results) {
  logSection('Test Report');

  const { totalPassed, totalFailed, totalSkipped } = results;

  // Summary table
  console.log('Test Suite Summary:');
  console.log('─'.repeat(60));
  console.log('Suite Name              | Status  | Passed | Failed | Skipped');
  console.log('─'.repeat(60));

  for (const result of results.results) {
    const status = result.status === 'PASSED'
      ? `${colors.green}PASSED${colors.reset}`
      : result.status === 'FAILED'
      ? `${colors.red}FAILED${colors.reset}`
      : `${colors.yellow}ERROR${colors.reset}`;

    console.log(
      `${result.suite.padEnd(23)} | ${status.padEnd(17)} | ${
        String(result.passed).padEnd(6)
      } | ${
        String(result.failed).padEnd(6)
      } | ${result.skipped}`
    );
  }

  console.log('─'.repeat(60));
  console.log(
    `${'TOTAL'.padEnd(23)} | ${
      totalFailed === 0
        ? `${colors.green}PASSED${colors.reset}`.padEnd(17)
        : `${colors.red}FAILED${colors.reset}`.padEnd(17)
    } | ${
      String(totalPassed).padEnd(6)
    } | ${
      String(totalFailed).padEnd(6)
    } | ${totalSkipped}`
  );
  console.log('─'.repeat(60));

  // Overall result
  console.log();
  if (totalFailed === 0) {
    log(`✓ All tests passed! (${totalPassed} tests)`, colors.green + colors.bright);
  } else {
    log(`✗ ${totalFailed} tests failed out of ${totalPassed + totalFailed}`, colors.red + colors.bright);
  }

  // HTML report location
  console.log();
  log('📊 HTML Report: test-results/index.html', colors.blue);
  log('📁 Screenshots: test-results/screenshots/', colors.blue);
  log('📝 Trace files: test-results/traces/', colors.blue);
}

async function main() {
  console.clear();
  log('🚀 RapidTriageME Playwright Test Runner', colors.bright + colors.blue);
  log('Testing against: ' + TEST_CONFIG.baseURL, colors.cyan);

  try {
    // Step 1: Check dependencies
    checkDependencies();

    // Step 2: Create environment file
    createEnvFile();

    // Step 3: Run tests
    const results = runTests();

    // Step 4: Generate report
    generateReport(results);

    // Exit with appropriate code
    process.exit(results.totalFailed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n✗ Test runner failed: ${error.message}`, colors.red + colors.bright);
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TEST_CONFIG, TEST_SUITES };