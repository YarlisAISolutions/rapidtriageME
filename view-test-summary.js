#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the latest test report
const reportsDir = path.join(__dirname, 'reports');
const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.json') && f.startsWith('test-report-'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.log('No test reports found');
  process.exit(1);
}

const latestReport = path.join(reportsDir, files[0]);
const report = JSON.parse(fs.readFileSync(latestReport, 'utf8'));

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

console.log(`
${colors.blue}╔════════════════════════════════════════════════════════════════════════════╗${colors.reset}
${colors.blue}║              📊 RAPIDTRIAGEME TEST REPORT - COMPLETE SUMMARY              ║${colors.reset}
${colors.blue}╚════════════════════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bright}📅 Test Execution Details:${colors.reset}
   Started:     ${new Date(report.metadata.startTime).toLocaleString()}
   Completed:   ${new Date(report.metadata.endTime).toLocaleString()}
   Duration:    ${(report.metadata.duration / 1000).toFixed(2)} seconds
   Environment: ${report.metadata.environment}
   Test ID:     ${report.metadata.executionId}

${colors.bright}📊 Overall Statistics:${colors.reset}
   ${colors.green}✅ Passed:${colors.reset}     ${report.statistics.passed}/${report.statistics.totalTests}
   ${colors.red}❌ Failed:${colors.reset}     ${report.statistics.failed}/${report.statistics.totalTests}
   ${colors.yellow}⏭️ Skipped:${colors.reset}    ${report.statistics.skipped}/${report.statistics.totalTests}
   ${colors.cyan}📈 Success Rate: ${report.statistics.successRate.toFixed(1)}%${colors.reset}

${colors.bright}📋 Test Categories Breakdown:${colors.reset}`);

// Display category statistics
Object.entries(report.categories).forEach(([category, data]) => {
  const passRate = data.total > 0 ? (data.passed / data.total * 100).toFixed(0) : 0;
  const statusColor = data.failed > 0 ? colors.red : colors.green;
  
  console.log(`
   ${colors.cyan}${category.toUpperCase()}${colors.reset}
   ├─ Total: ${data.total} tests
   ├─ Passed: ${colors.green}${data.passed}${colors.reset}
   ├─ Failed: ${colors.red}${data.failed}${colors.reset}
   └─ Success Rate: ${statusColor}${passRate}%${colors.reset}`);
});

console.log(`
${colors.bright}📝 Detailed Test Results:${colors.reset}
${'─'.repeat(80)}`);

// Display individual test results
report.testCases.forEach((test, index) => {
  const statusIcon = test.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  const statusText = test.passed ? `${colors.green}PASSED${colors.reset}` : `${colors.red}FAILED${colors.reset}`;
  
  console.log(`
${colors.bright}Test #${test.testNumber}:${colors.reset} ${test.name}
   Status:     ${statusIcon} ${statusText}
   Category:   ${test.category}
   Endpoint:   ${test.request.method} ${test.request.endpoint}
   Duration:   ${test.duration}ms
   Response:   ${test.response?.status || 'N/A'} ${test.response?.statusText || ''}`);
  
  if (test.expectedResult) {
    console.log(`   Expected:   Status ${Array.isArray(test.expectedResult.statusCode) ? 
      test.expectedResult.statusCode.join(' or ') : 
      test.expectedResult.statusCode} - ${test.expectedResult.description}`);
  }
  
  if (test.actualResult) {
    console.log(`   Actual:     Status ${test.actualResult.statusCode} - ${test.actualResult.description || test.actualResult.matches}`);
  }
  
  if (!test.passed && test.error) {
    console.log(`   ${colors.red}Error:${colors.reset}     ${test.error}`);
  }
});

console.log(`
${colors.bright}🔒 Test Credentials (Masked):${colors.reset}
   Email:      ${report.credentials.email}
   User ID:    ${report.credentials.userId}
   API Keys:   ${report.credentials.apiKeys.map(k => `${k.name} (${k.key})`).join(', ')}

${colors.bright}📁 Report Files:${colors.reset}
   JSON:       ${files[0]}
   HTML:       ${files[0].replace('.json', '.html')}

${colors.bright}✨ Summary:${colors.reset}
   ${report.statistics.failed === 0 ? 
     `${colors.green}🎉 All tests passed successfully!${colors.reset}` : 
     `${colors.red}⚠️ ${report.statistics.failed} test(s) failed and need attention.${colors.reset}`}
   
   Total execution time: ${(report.metadata.duration / 1000).toFixed(2)} seconds
   Average test duration: ${(report.testCases.reduce((sum, t) => sum + t.duration, 0) / report.testCases.length).toFixed(2)}ms

${colors.blue}${'═'.repeat(80)}${colors.reset}
`);

// Show API coverage
const endpoints = [...new Set(report.testCases.map(t => `${t.request.method} ${t.request.endpoint}`))];
console.log(`${colors.bright}🌐 API Endpoints Tested (${endpoints.length} unique):${colors.reset}`);
endpoints.forEach(endpoint => {
  console.log(`   • ${endpoint}`);
});

console.log(`
${colors.bright}📸 Screenshot Information:${colors.reset}`);
const screenshotTests = report.testCases.filter(t => t.screenshot);
if (screenshotTests.length > 0) {
  console.log(`   Screenshots captured: ${screenshotTests.length}`);
  screenshotTests.forEach(t => {
    console.log(`   • Test #${t.testNumber}: ${t.screenshot.filename} (${(t.screenshot.size / 1024).toFixed(1)}KB)`);
  });
} else {
  console.log(`   No screenshots captured (all tests passed)`);
}

console.log(`
${colors.green}✅ Test Suite Execution Complete!${colors.reset}
${colors.cyan}View the HTML report for interactive results with screenshots and detailed analysis.${colors.reset}
`);