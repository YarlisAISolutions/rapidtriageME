#!/usr/bin/env node

/**
 * RapidTriageME Master Test Runner
 * Runs all test suites and generates comprehensive report
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');

// Test suites to run
const testSuites = [
  {
    name: 'API Tests',
    path: './test/02-api/api-test-suite.js',
    required: true
  },
  {
    name: 'Extension Tests',
    path: './test/04-extension/extension-test-suite.js',
    required: false, // Requires browser
    skipInCI: true
  },
  {
    name: 'Integration Tests',
    path: './test/05-integration/integration-test-suite.js',
    required: false
  }
];

// Results tracking
const results = {
  timestamp: new Date().toISOString(),
  environment: process.env.ENVIRONMENT || 'test',
  suites: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

// Helper to run a test suite
function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(colors.cyan(`\n▶️  Running ${suite.name}...`));
    console.log(colors.gray('─'.repeat(40)));
    
    // Check if should skip in CI
    if (suite.skipInCI && process.env.CI === 'true') {
      console.log(colors.yellow(`⏭️  Skipping ${suite.name} in CI environment`));
      results.suites.push({
        name: suite.name,
        status: 'skipped',
        reason: 'CI environment'
      });
      results.summary.skipped++;
      resolve('skipped');
      return;
    }
    
    // Check if file exists
    if (!fs.existsSync(suite.path)) {
      console.log(colors.yellow(`⚠️  ${suite.name} not found at ${suite.path}`));
      if (suite.required) {
        results.suites.push({
          name: suite.name,
          status: 'failed',
          error: 'Test file not found'
        });
        results.summary.failed++;
        resolve('failed');
      } else {
        results.suites.push({
          name: suite.name,
          status: 'skipped',
          reason: 'File not found'
        });
        results.summary.skipped++;
        resolve('skipped');
      }
      return;
    }
    
    // Run the test
    const testProcess = spawn('node', [suite.path], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(colors.green(`✅ ${suite.name} passed`));
        results.suites.push({
          name: suite.name,
          status: 'passed'
        });
        results.summary.passed++;
        resolve('passed');
      } else {
        console.log(colors.red(`❌ ${suite.name} failed with code ${code}`));
        results.suites.push({
          name: suite.name,
          status: 'failed',
          exitCode: code
        });
        results.summary.failed++;
        resolve('failed');
      }
    });
    
    testProcess.on('error', (error) => {
      console.error(colors.red(`❌ Error running ${suite.name}:`), error);
      results.suites.push({
        name: suite.name,
        status: 'failed',
        error: error.message
      });
      results.summary.failed++;
      resolve('failed');
    });
  });
}

// Main test runner
async function runAllTests() {
  console.log(colors.cyan.bold('\n🚀 RapidTriageME Complete Test Suite\n'));
  console.log(colors.gray('═'.repeat(50)));
  console.log(colors.gray(`Environment: ${process.env.ENVIRONMENT || 'test'}`));
  console.log(colors.gray(`CI Mode: ${process.env.CI === 'true' ? 'Yes' : 'No'}`));
  console.log(colors.gray(`Timestamp: ${new Date().toISOString()}`));
  console.log(colors.gray('═'.repeat(50)));
  
  // Check prerequisites
  console.log(colors.cyan('\n🔍 Checking prerequisites...'));
  
  // Check for .env.local
  if (!fs.existsSync('.env.local')) {
    console.log(colors.yellow('⚠️  .env.local not found, using defaults'));
  } else {
    console.log(colors.green('✓ .env.local found'));
  }
  
  // Check for node_modules
  if (!fs.existsSync('node_modules')) {
    console.error(colors.red('❌ node_modules not found. Run: npm install'));
    process.exit(1);
  } else {
    console.log(colors.green('✓ Dependencies installed'));
  }
  
  // Create reports directory
  fs.mkdirSync('./test/reports', { recursive: true });
  console.log(colors.green('✓ Reports directory ready'));
  
  // Run all test suites
  results.summary.total = testSuites.length;
  
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }
  
  // Generate final report
  console.log(colors.cyan('\n' + '═'.repeat(50)));
  console.log(colors.cyan.bold('\n📊 FINAL TEST REPORT\n'));
  
  console.log('Test Suites:');
  results.suites.forEach(suite => {
    const icon = suite.status === 'passed' ? '✅' : 
                 suite.status === 'failed' ? '❌' : '⏭️';
    const color = suite.status === 'passed' ? colors.green :
                  suite.status === 'failed' ? colors.red : colors.yellow;
    console.log(color(`  ${icon} ${suite.name}: ${suite.status.toUpperCase()}`));
  });
  
  console.log('\nSummary:');
  console.log(`  Total Suites: ${results.summary.total}`);
  console.log(colors.green(`  ✅ Passed: ${results.summary.passed}`));
  if (results.summary.failed > 0) {
    console.log(colors.red(`  ❌ Failed: ${results.summary.failed}`));
  }
  if (results.summary.skipped > 0) {
    console.log(colors.yellow(`  ⏭️  Skipped: ${results.summary.skipped}`));
  }
  
  const successRate = results.summary.total > 0 
    ? ((results.summary.passed / (results.summary.total - results.summary.skipped)) * 100).toFixed(1)
    : 0;
  console.log(`  Success Rate: ${successRate}%`);
  
  // Save comprehensive report
  const reportPath = './test/reports/complete-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(colors.gray(`\n📄 Complete report saved to: ${reportPath}`));
  
  // Generate HTML report
  generateHTMLReport(results);
  
  // Exit with appropriate code
  const exitCode = results.summary.failed > 0 ? 1 : 0;
  console.log(colors.cyan('\n' + '═'.repeat(50)));
  if (exitCode === 0) {
    console.log(colors.green.bold('\n✨ All tests completed successfully!\n'));
  } else {
    console.log(colors.red.bold('\n⚠️  Some tests failed. Please review the reports.\n'));
  }
  
  process.exit(exitCode);
}

// Generate HTML report
function generateHTMLReport(results) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>RapidTriageME Test Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
    .stat.passed { background: #d4edda; color: #155724; }
    .stat.failed { background: #f8d7da; color: #721c24; }
    .stat.skipped { background: #fff3cd; color: #856404; }
    .suite { margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #dee2e6; }
    .suite.passed { border-left-color: #28a745; }
    .suite.failed { border-left-color: #dc3545; }
    .suite.skipped { border-left-color: #ffc107; }
    .timestamp { color: #6c757d; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge.passed { background: #28a745; color: white; }
    .badge.failed { background: #dc3545; color: white; }
    .badge.skipped { background: #ffc107; color: #212529; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 RapidTriageME Test Report</h1>
    <p class="timestamp">Generated: ${results.timestamp}</p>
    <p>Environment: <strong>${results.environment}</strong></p>
    
    <div class="summary">
      <div class="stat">
        <h3>${results.summary.total}</h3>
        <p>Total Suites</p>
      </div>
      <div class="stat passed">
        <h3>${results.summary.passed}</h3>
        <p>Passed</p>
      </div>
      <div class="stat failed">
        <h3>${results.summary.failed}</h3>
        <p>Failed</p>
      </div>
      <div class="stat skipped">
        <h3>${results.summary.skipped}</h3>
        <p>Skipped</p>
      </div>
    </div>
    
    <h2>Test Suites</h2>
    ${results.suites.map(suite => `
      <div class="suite ${suite.status}">
        <h3>${suite.name} <span class="badge ${suite.status}">${suite.status.toUpperCase()}</span></h3>
        ${suite.error ? `<p>Error: ${suite.error}</p>` : ''}
        ${suite.reason ? `<p>Reason: ${suite.reason}</p>` : ''}
      </div>
    `).join('')}
    
    <p style="margin-top: 40px; color: #6c757d; text-align: center;">
      Success Rate: <strong>${((results.summary.passed / (results.summary.total - results.summary.skipped)) * 100).toFixed(1)}%</strong>
    </p>
  </div>
</body>
</html>
  `;
  
  const htmlPath = './test/reports/test-report.html';
  fs.writeFileSync(htmlPath, html);
  console.log(colors.gray(`📊 HTML report saved to: ${htmlPath}`));
}

// Run the tests
runAllTests().catch(error => {
  console.error(colors.red('\n❌ Test runner failed:'), error);
  process.exit(1);
});