#!/usr/bin/env node

/**
 * RapidTriageME API Test Suite
 * Comprehensive testing of all API endpoints
 */

const fetch = require('../utils/fetch');
const config = require('../config/test.config');
const colors = require('colors/safe');

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = config.getApiUrl(endpoint);
  const defaultOptions = {
    method: 'POST',
    headers: config.getHeaders(options.headers),
    body: options.body ? JSON.stringify(options.body) : undefined
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  if (options.method === 'GET') {
    delete finalOptions.body;
  }
  
  try {
    const response = await fetch(url, finalOptions);
    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    return { response, data };
  } catch (error) {
    return { error };
  }
}

// Test runner
async function runTest(name, testFn) {
  totalTests++;
  process.stdout.write(`Testing: ${name}... `);
  
  try {
    await testFn();
    passedTests++;
    console.log(colors.green('✓ PASSED'));
    testResults.push({ name, status: 'passed' });
  } catch (error) {
    failedTests++;
    console.log(colors.red('✗ FAILED'));
    console.error(colors.red(`  Error: ${error.message}`));
    testResults.push({ name, status: 'failed', error: error.message });
  }
}

// API Test Suite
async function runAPITests() {
  console.log(colors.cyan('\n🧪 RapidTriageME API Test Suite\n'));
  console.log(colors.gray('================================\n'));

  // 1. Health Check
  await runTest('Health Check', async () => {
    const { response, data, error } = await apiRequest('/health', { method: 'GET' });
    if (error) throw new Error(`Request failed: ${error.message}`);
    if (!response || response.status !== 200) {
      throw new Error(`Health check failed: ${response?.status}`);
    }
  });

  // 2. Screenshot Upload
  await runTest('Screenshot Upload', async () => {
    const { response, data, error } = await apiRequest('/api/screenshot', {
      body: {
        data: config.testData.screenshots.testImage,
        url: config.testData.urls.example,
        title: 'Test Screenshot'
      }
    });
    if (error) throw new Error(`Request failed: ${error.message}`);
    if (!response || response.status !== 200) {
      throw new Error(`Screenshot upload failed: ${response?.status}`);
    }
    if (!data.success && !data.id && !data.path) {
      throw new Error('Screenshot response missing success, id, or path');
    }
  });

  // 3. Console Logs
  await runTest('Console Logs Endpoint', async () => {
    const { response, data, error } = await apiRequest('/api/console-logs', {
      body: { url: config.testData.urls.google }
    });
    if (error) throw new Error(`Request failed: ${error.message}`);
    if (!response || response.status !== 200) {
      throw new Error(`Console logs failed: ${response?.status}`);
    }
    if (!data.content) {
      throw new Error('Console logs response missing content');
    }
  });

  // 4. Console Errors
  await runTest('Console Errors Endpoint', async () => {
    const { response, data, error } = await apiRequest('/api/console-errors', {
      body: { url: config.testData.urls.google }
    });
    if (error) throw new Error(`Request failed: ${error.message}`);
    if (!response || response.status !== 200) {
      throw new Error(`Console errors failed: ${response?.status}`);
    }
  });

  // 5. Network Logs
  await runTest('Network Logs Endpoint', async () => {
    const { response, data, error } = await apiRequest('/api/network-logs', {
      body: { url: config.testData.urls.google }
    });
    if (error) throw new Error(`Request failed: ${error.message}`);
    if (!response || response.status !== 200) {
      throw new Error(`Network logs failed: ${response?.status}`);
    }
  });

  // 6. Network Errors
  await runTest('Network Errors Endpoint', async () => {
    const { response, data, error } = await apiRequest('/api/network-errors', {
      body: { url: config.testData.urls.google }
    });
    if (error) throw new Error(`Request failed: ${error.message}`);
    if (!response || response.status !== 200) {
      throw new Error(`Network errors failed: ${response?.status}`);
    }
  });

  // 7. Lighthouse Audit
  await runTest('Lighthouse Audit', async () => {
    const { response, data, error } = await apiRequest('/api/lighthouse', {
      body: { 
        url: config.testData.urls.google,
        categories: ['performance', 'accessibility']
      }
    });
    if (error) throw new Error(`Request failed: ${error.message}`);
    if (!response || response.status !== 200) {
      throw new Error(`Lighthouse audit failed: ${response?.status}`);
    }
    if (!data.content) {
      throw new Error('Lighthouse response missing content');
    }
  });

  // 8. Individual Lighthouse Audits
  const auditTypes = ['accessibility', 'performance', 'seo', 'best-practices'];
  for (const auditType of auditTypes) {
    await runTest(`Lighthouse ${auditType} Audit`, async () => {
      const { response, data, error } = await apiRequest(`/api/lighthouse/${auditType}`, {
        body: { url: config.testData.urls.google }
      });
      if (error) throw new Error(`Request failed: ${error.message}`);
      if (!response || response.status !== 200) {
        throw new Error(`${auditType} audit failed: ${response?.status}`);
      }
    });
  }

  // 9. Authentication Test (with invalid token)
  await runTest('Authentication (Invalid Token)', async () => {
    const url = config.getApiUrl('/api/lighthouse');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_123'
      },
      body: JSON.stringify({ url: config.testData.urls.google })
    });
    
    // Should still work for extension endpoints
    if (response.status !== 200 && response.status !== 401) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });

  // 10. CORS Headers Test
  await runTest('CORS Headers', async () => {
    const { response, error } = await apiRequest('/api/lighthouse', {
      body: { url: config.testData.urls.google }
    });
    if (error) throw new Error(`Request failed: ${error.message}`);
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (!corsHeader) {
      throw new Error('CORS headers missing');
    }
  });

  // Print summary
  console.log(colors.gray('\n================================'));
  console.log(colors.cyan('\n📊 Test Summary:\n'));
  console.log(`  Total Tests: ${totalTests}`);
  console.log(colors.green(`  ✓ Passed: ${passedTests}`));
  if (failedTests > 0) {
    console.log(colors.red(`  ✗ Failed: ${failedTests}`));
  }
  console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Save results
  const fs = require('fs');
  const reportPath = './test/reports/api-test-results.json';
  fs.mkdirSync('./test/reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    environment: config.environment,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1)
    },
    results: testResults
  }, null, 2));
  
  console.log(colors.gray(`\n📄 Report saved to: ${reportPath}`));
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAPITests().catch(error => {
  console.error(colors.red('\n❌ Test suite failed:'), error);
  process.exit(1);
});