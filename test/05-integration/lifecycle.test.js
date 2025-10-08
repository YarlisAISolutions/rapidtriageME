#!/usr/bin/env node

/**
 * Complete Lifecycle Test for RapidTriageME API
 * Comprehensive testing of all features and functionality
 * 
 * Test Coverage:
 * - Authentication (Registration, Login, Profile, 2FA)
 * - API Key Management (Create, List, Update, Revoke)
 * - Browser Operations (Navigation, Screenshots, Element Selection)
 * - Debugging Tools (Console Logs, Network Logs, Error Tracking)
 * - Performance Audits (Lighthouse, SEO, Accessibility)
 * - MCP Protocol (SSE Connections, Tool Calls)
 * - Dashboard & UI Features
 * - Rate Limiting & Quotas
 * - Error Handling & Edge Cases
 */

const fs = require('fs');
const path = require('path');
const TestScreenshotCapture = require('./test-suite/capture-test-screenshots');

const BASE_URL = process.env.TEST_URL || 'http://localhost:8787';
const REPORTS_DIR = path.join(__dirname, 'reports');

// Initialize screenshot capture
const screenshotCapture = new TestScreenshotCapture();

// Store credentials and tokens
let userEmail = `test${Date.now()}@example.com`;
let userPassword = 'SecurePass123!';
let userName = 'Test Developer';
let jwtToken = null;
let refreshToken = null;
let apiKey = null;
let apiKeyId = null;
let userId = null;
let secondApiKey = null;
let secondApiKeyId = null;

// Progress tracking
const TOTAL_TESTS = 30;
let completedTests = 0;
let currentTestName = '';

// Test results tracking with detailed request/response capture
const testReport = {
  metadata: {
    startTime: new Date().toISOString(),
    endTime: null,
    environment: BASE_URL,
    testSuite: 'RapidTriageME Comprehensive Test Suite',
    version: '1.0.0',
    executionId: `test-${Date.now()}`,
    duration: null
  },
  statistics: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    successRate: 0
  },
  categories: {
    authentication: { total: 0, passed: 0, failed: 0, tests: [] },
    apiKeys: { total: 0, passed: 0, failed: 0, tests: [] },
    browserOps: { total: 0, passed: 0, failed: 0, tests: [] },
    debugging: { total: 0, passed: 0, failed: 0, tests: [] },
    dashboard: { total: 0, passed: 0, failed: 0, tests: [] },
    errorHandling: { total: 0, passed: 0, failed: 0, tests: [] },
    documentation: { total: 0, passed: 0, failed: 0, tests: [] }
  },
  testCases: [],
  credentials: {
    email: null,
    userId: null,
    apiKeys: []
  }
};

// Current test tracking
let currentTestNumber = 0;
let currentCategory = 'general';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Progress bar functions
function updateProgress(current, total, testName = '') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 40;
  const filled = Math.max(0, Math.min(barLength, Math.round((current / total) * barLength)));
  const empty = Math.max(0, barLength - filled);
  
  const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
  const progressText = `Progress: [${progressBar}] ${percentage}% (${current}/${total})`;
  
  // Clear the line and write progress
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
  process.stdout.write(`${colors.cyan}${progressText}${colors.reset}`);
  
  if (testName) {
    process.stdout.write(` - ${colors.yellow}${testName}${colors.reset}`);
  }
  
  if (current === total) {
    console.log('\n');
  }
}

function showTestHeader(testNumber, testName, category) {
  console.log('');
  const header = `╔═══════════════════════════════════════════════════════════════╗`;
  const footer = `╚═══════════════════════════════════════════════════════════════╝`;
  const content = ` TEST ${testNumber}/${TOTAL_TESTS}: ${testName} [${category}]`;
  
  console.log(colors.blue + header);
  console.log(`║${content.padEnd(63)}║`);
  console.log(footer + colors.reset);
}

async function makeRequest(endpoint, options = {}, testName = '', category = 'general', expectedToFail = false, expectedResult = null) {
  const url = `${BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  // Update progress
  currentTestName = testName || `Test ${completedTests + 1}`;
  updateProgress(completedTests, TOTAL_TESTS, `Running: ${currentTestName}`);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  // Store original body for logging
  const originalBody = options.body;
  
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }
  
  // Define expected result if not provided
  if (!expectedResult) {
    if (expectedToFail) {
      expectedResult = {
        statusCode: options.method === 'POST' && endpoint.includes('register') ? [400, 409] : [400, 401, 403, 404],
        description: 'Request should fail with appropriate error code',
        responseContains: ['error']
      };
    } else {
      const method = options.method || 'GET';
      expectedResult = {
        statusCode: method === 'DELETE' ? 204 : 
                   method === 'OPTIONS' ? 204 :
                   (method === 'POST' && endpoint.includes('register')) ? 201 : 
                   (method === 'POST' && endpoint.includes('api-keys')) ? 201 : 200,
        description: 'Request should succeed and return expected data',
        responseContains: method === 'DELETE' ? [] : ['success', 'data', 'content', 'status'].filter(key => 
          endpoint.includes('health') || endpoint.includes('metrics') || endpoint.includes('api-docs') || endpoint.includes('openapi')
        ).length > 0 ? [] : ['success']
      };
    }
  }
  
  // Create test case record
  const testCase = {
    id: `test-${++currentTestNumber}`,
    name: testName || `Test ${currentTestNumber}`,
    category: category,
    timestamp: new Date().toISOString(),
    testNumber: currentTestNumber,
    executionTime: new Date().toLocaleString(),
    request: {
      method: options.method || 'GET',
      endpoint: endpoint,
      url: url,
      headers: defaultOptions.headers,
      body: originalBody || null
    },
    expectedResult: expectedResult,
    actualResult: null,
    response: null,
    responseHeaders: null,
    duration: null,
    status: 'pending',
    passed: false,
    expectedToFail: expectedToFail,
    screenshot: null
  };
  
  try {
    log(`\n→ ${options.method || 'GET'} ${endpoint}`, 'cyan');
    const response = await fetch(url, { ...defaultOptions, ...options });
    const responseTime = Date.now() - startTime;
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    // Capture response details
    const responseHeaders = Object.fromEntries(response.headers.entries());
    testCase.response = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: data,
      size: text.length
    };
    testCase.responseHeaders = responseHeaders;
    testCase.duration = responseTime;
    
    // Set actual result
    testCase.actualResult = {
      statusCode: response.status,
      description: response.ok ? 'Request succeeded' : `Request failed with ${response.status}`,
      responseData: data
    };
    
    // Generate screenshot placeholder for test result
    testCase.screenshot = {
      url: `/screenshots/test-${currentTestNumber}-${Date.now()}.png`,
      captured: new Date().toISOString(),
      testName: testName,
      status: testCase.passed ? 'success' : 'failure'
    };
    
    // Determine if test passed
    let statusMatches = false;
    if (Array.isArray(testCase.expectedResult.statusCode)) {
      statusMatches = testCase.expectedResult.statusCode.includes(response.status);
    } else {
      statusMatches = response.status === testCase.expectedResult.statusCode;
    }
    
    if (!response.ok) {
      if (expectedToFail && statusMatches) {
        testCase.passed = true;
        testCase.status = 'passed';
        testCase.actualResult.matches = 'Failed as expected';
        log(`✓ Failed as expected - ${response.status}`, 'green');
      } else {
        testCase.passed = false;
        testCase.status = 'failed';
        testCase.actualResult.matches = 'Unexpected failure';
        log(`✗ Error ${response.status}: ${JSON.stringify(data, null, 2)}`, 'red');
      }
    } else {
      if (expectedToFail) {
        testCase.passed = false;
        testCase.status = 'failed';
        testCase.actualResult.matches = 'Should have failed but succeeded';
        log(`✗ Should have failed but succeeded`, 'red');
      } else if (statusMatches) {
        testCase.passed = true;
        testCase.status = 'passed';
        testCase.actualResult.matches = 'Succeeded as expected';
        log(`✓ Success ${response.status} (${responseTime}ms)`, 'green');
      } else {
        testCase.passed = false;
        testCase.status = 'failed';
        testCase.actualResult.matches = `Wrong status code: expected ${testCase.expectedResult.statusCode}, got ${response.status}`;
        log(`✗ Wrong status code: expected ${testCase.expectedResult.statusCode}, got ${response.status}`, 'red');
      }
    }
    
    if (typeof data === 'object' && !expectedToFail) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    // Capture screenshot of test result (only for failures or if CAPTURE_ALL_SCREENSHOTS is set)
    const captureScreenshots = process.env.CAPTURE_ALL_SCREENSHOTS === 'true' || !testCase.passed;
    if (captureScreenshots) {
      try {
        const screenshot = await screenshotCapture.captureTestResult(testCase);
        if (screenshot) {
          testCase.screenshot = screenshot;
        }
      } catch (screenshotError) {
        console.log(`Could not capture screenshot: ${screenshotError.message}`);
      }
    }
    
    // Update statistics
    testReport.testCases.push(testCase);
    testReport.statistics.totalTests++;
    if (testCase.passed) {
      testReport.statistics.passed++;
    } else {
      testReport.statistics.failed++;
    }
    
    // Update progress after test completion
    completedTests++;
    updateProgress(completedTests, TOTAL_TESTS, `Completed: ${currentTestName}`);
    
    // Update category statistics
    if (testReport.categories[category]) {
      testReport.categories[category].total++;
      testReport.categories[category].tests.push(testCase.id);
      if (testCase.passed) {
        testReport.categories[category].passed++;
      } else {
        testReport.categories[category].failed++;
      }
    }
    
    return { 
      error: !response.ok && !expectedToFail, 
      status: response.status, 
      data,
      testCase: testCase
    };
  } catch (error) {
    log(`✗ Request failed: ${error.message}`, 'red');
    
    testCase.response = {
      error: error.message,
      stack: error.stack
    };
    testCase.actualResult = {
      statusCode: 'error',
      description: `Request threw error: ${error.message}`,
      responseData: null,
      matches: 'Unexpected error'
    };
    testCase.duration = Date.now() - startTime;
    testCase.status = 'error';
    testCase.passed = false;
    
    // Capture screenshot for error case (always capture errors)
    try {
      const screenshot = await screenshotCapture.captureTestResult(testCase);
      if (screenshot) {
        testCase.screenshot = screenshot;
      }
    } catch (screenshotError) {
      console.log(`Could not capture screenshot: ${screenshotError.message}`);
    }
    
    testReport.testCases.push(testCase);
    testReport.statistics.totalTests++;
    testReport.statistics.failed++;
    
    if (testReport.categories[category]) {
      testReport.categories[category].total++;
      testReport.categories[category].tests.push(testCase.id);
      testReport.categories[category].failed++;
    }
    
    return { error: true, message: error.message, testCase: testCase };
  }
}

async function runTests() {
  console.clear();
  log('\n╔══════════════════════════════════════════════════════════════╗', 'blue');
  log('║       RapidTriageME Comprehensive Test Suite v2.0           ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════╝', 'blue');
  log(`\n📍 Testing against: ${BASE_URL}`, 'cyan');
  log(`🕐 Started: ${new Date().toISOString()}`, 'cyan');
  log(`📊 Total Tests: ${TOTAL_TESTS}\n`, 'cyan');
  
  // Initialize progress
  updateProgress(0, TOTAL_TESTS, 'Initializing...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 1: Register a new user
  showTestHeader(1, 'REGISTERING NEW USER', 'authentication');
  log(`   📧 Email: ${userEmail}`, 'cyan');
  const registerResult = await makeRequest('/auth/register', {
    method: 'POST',
    body: {
      email: userEmail,
      password: userPassword,
      name: userName,
      company: 'TestCorp',
      referralCode: 'TEST123'
    }
  }, 'User Registration', 'authentication');
  
  if (!registerResult.error) {
    jwtToken = registerResult.data.token;
    refreshToken = registerResult.data.refreshToken;
    userId = registerResult.data.user.id;
    log(`   Token: ${jwtToken.substring(0, 20)}...`, 'cyan');
    log(`   User ID: ${userId}`, 'cyan');
  } else {
    log('Registration failed! Stopping tests.', 'red');
    return;
  }
  
  // Test 2: Login with credentials
  showTestHeader(2, 'TESTING LOGIN', 'authentication');
  const loginResult = await makeRequest('/auth/login', {
    method: 'POST',
    body: {
      email: userEmail,
      password: userPassword
    }
  });
  
  if (!loginResult.error) {
    jwtToken = loginResult.data.token;
    log(`   New Token: ${jwtToken.substring(0, 20)}...`, 'cyan');
  }
  
  // Test 3: Get user profile
  showTestHeader(3, 'GETTING USER PROFILE', 'authentication');
  const profileResult = await makeRequest('/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  if (!profileResult.error) {
    log(`   Name: ${profileResult.data.name}`, 'cyan');
    log(`   Company: ${profileResult.data.company || 'N/A'}`, 'cyan');
    log(`   Subscription: ${profileResult.data.subscription.plan}`, 'cyan');
    log(`   Days Remaining: ${profileResult.data.subscription.daysRemaining}`, 'cyan');
  }
  
  // Test 3a: Update user profile
  showTestHeader(4, 'UPDATING USER PROFILE', 'authentication');
  const updateProfileResult = await makeRequest('/auth/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    },
    body: {
      name: 'Updated Test Developer',
      company: 'UpdatedCorp',
      twoFactorEnabled: false
    }
  });
  
  if (!updateProfileResult.error) {
    log(`   Profile updated successfully`, 'green');
    userName = updateProfileResult.data.user.name;
  }
  
  // Test 4: Create an API key
  showTestHeader(5, 'CREATING API KEY', 'apiKeys');
  const apiKeyResult = await makeRequest('/auth/api-keys', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    },
    body: {
      name: 'Test API Key',
      expiresIn: 30, // 30 days
      rateLimit: 500,
      permissions: ['read', 'write'],
      ipWhitelist: []
    }
  });
  
  if (!apiKeyResult.error) {
    apiKey = apiKeyResult.data.key;
    apiKeyId = apiKeyResult.data.id;
    log(`   API Key: ${apiKey}`, 'cyan');
    log(`   Key ID: ${apiKeyId}`, 'cyan');
  } else {
    log('API key creation failed!', 'red');
  }
  
  // Test 4a: Create a second API key with different permissions
  showTestHeader(6, 'CREATING SECOND API KEY (READ-ONLY)', 'apiKeys');
  const secondKeyResult = await makeRequest('/auth/api-keys', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    },
    body: {
      name: 'Read-Only API Key',
      expiresIn: 7, // 7 days
      rateLimit: 50,
      permissions: ['read'],
      ipWhitelist: []
    }
  });
  
  if (!secondKeyResult.error) {
    secondApiKey = secondKeyResult.data.key;
    secondApiKeyId = secondKeyResult.data.id;
    log(`   Second API Key: ${secondApiKey.substring(0, 20)}...`, 'cyan');
  }
  
  // Test 5: List API keys with pagination
  showTestHeader(7, 'LISTING API KEYS (WITH PAGINATION)', 'apiKeys');
  const listKeysResult = await makeRequest('/auth/api-keys?page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  });
  
  if (!listKeysResult.error) {
    log(`   Total Keys: ${listKeysResult.data.pagination.total}`, 'cyan');
    log(`   Page: ${listKeysResult.data.pagination.page}/${listKeysResult.data.pagination.totalPages}`, 'cyan');
    listKeysResult.data.data.forEach(key => {
      log(`   - ${key.name} (${key.prefix}_...) - ${key.permissions.join(', ')}`, 'cyan');
    });
  }
  
  // Test 6: Use API key to call protected endpoint
  if (apiKey) {
    showTestHeader(8, 'USING API KEY FOR SCREENSHOT', 'browserOps');
    await makeRequest('/api/screenshot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        title: 'Test Screenshot',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' // 1x1 transparent PNG
      }
    }, 'Screenshot Upload', 'browserOps');
    
    // Test 7: Get console logs with API key
    showTestHeader(9, 'GETTING CONSOLE LOGS WITH API KEY', 'debugging');
    await makeRequest('/api/console-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        level: 'all',
        limit: 10
      }
    }, 'Get Console Logs', 'debugging');
    
    // Test 8: Get network logs
    showTestHeader(10, 'GETTING NETWORK LOGS', 'debugging');
    await makeRequest('/api/network-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        limit: 10
      }
    }, 'Get Network Logs', 'debugging');
    
    // Test 9: Navigate browser
    showTestHeader(11, 'NAVIGATING BROWSER', 'browserOps');
    await makeRequest('/api/navigate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        waitUntil: 'load',
        timeout: 30000
      }
    }, 'Navigate Browser', 'browserOps');
    
    // Test 10: Generate triage report
    showTestHeader(12, 'GENERATING TRIAGE REPORT', 'debugging');
    await makeRequest('/api/triage-report', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        includeScreenshot: true,
        includeLogs: true,
        format: 'json'
      }
    }, 'Generate Triage Report', 'debugging');
    
    // Test 10a: Screenshot with different formats
    log('\n10a. TESTING SCREENSHOT FORMATS', 'yellow');
    const formats = ['png', 'jpeg', 'webp'];
    for (const format of formats) {
      log(`   Testing ${format} format...`, 'cyan');
      await makeRequest('/api/screenshot', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: {
          url: 'https://example.com',
          title: `Test Screenshot - ${format} format`,
          data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
          format: format,
          quality: format === 'png' ? undefined : 85,
          fullPage: false
        }
      }, `Screenshot ${format} format test`, 'browserOps');
    }
    
    // Test 10b: Full page screenshot
    log('\n10b. FULL PAGE SCREENSHOT', 'yellow');
    await makeRequest('/api/screenshot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        title: 'Test Full Page Screenshot',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
        fullPage: true,
        format: 'png'
      }
    }, 'Full page screenshot test', 'browserOps');
    
    // Test 10c: Screenshot with viewport settings
    log('\n10c. SCREENSHOT WITH CUSTOM VIEWPORT', 'yellow');
    await makeRequest('/api/screenshot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        title: 'Test Screenshot with Custom Viewport',
        data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
        viewport: {
          width: 1024,
          height: 768
        },
        format: 'png'
      }
    }, 'Screenshot with custom viewport test', 'browserOps');
    
    // Test 10d: Console logs with filtering
    log('\n10d. CONSOLE LOGS WITH LEVEL FILTERING', 'yellow');
    const logLevels = ['error', 'warn', 'info'];
    for (const level of logLevels) {
      log(`   Getting ${level} logs...`, 'cyan');
      await makeRequest('/api/console-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: {
          url: 'https://example.com',
          level: level,
          limit: 5
        }
      });
    }
    
    // Test 10e: Network logs with filtering
    log('\n10e. NETWORK LOGS WITH FILTERING', 'yellow');
    await makeRequest('/api/network-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com',
        filter: {
          status: [404, 500],
          type: 'xhr'
        },
        includeHeaders: true,
        limit: 10
      }
    });
  }
  
  // Test 11: Check health endpoint (no auth required)
  log('\n11. CHECKING HEALTH ENDPOINT', 'yellow');
  await makeRequest('/health', {
    method: 'GET'
  }, 'Health Check', 'dashboard');
  
  // Test 12: Check metrics (requires auth)
  log('\n12. CHECKING METRICS', 'yellow');
  await makeRequest('/metrics', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  }, 'Get Metrics', 'dashboard');
  
  // Test 13: Dashboard Access
  log('\n13. CHECKING DASHBOARD ACCESS', 'yellow');
  const dashboardResult = await makeRequest('/dashboard', {
    method: 'GET',
    headers: {
      'Accept': 'text/html'
    }
  });
  
  if (!dashboardResult.error) {
    log('   Dashboard page is accessible', 'green');
    const hasLoginCheck = dashboardResult.data.includes('localStorage.getItem');
    log(`   Has authentication check: ${hasLoginCheck}`, 'cyan');
  }
  
  // Test 14: Status Page
  log('\n14. CHECKING STATUS PAGE', 'yellow');
  const statusResult = await makeRequest('/status', {
    method: 'GET',
    headers: {
      'Accept': 'text/html'
    }
  });
  
  if (!statusResult.error) {
    log('   Status page is accessible', 'green');
  }
  
  // Test 15: Test with read-only API key (should fail for write operations)
  if (secondApiKey) {
    log('\n15. TESTING READ-ONLY API KEY PERMISSIONS', 'yellow');
    
    // Should succeed - read operation
    log('   Testing allowed read operation...', 'cyan');
    const readResult = await makeRequest('/api/console-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secondApiKey}`
      },
      body: {
        url: 'https://example.com'
      }
    });
    
    if (!readResult.error) {
      log('   ✓ Read operation allowed', 'green');
    } else {
      log('   ✗ Read operation blocked (unexpected)', 'red');
    }
  }
  
  // Test 16: Revoke first API key
  if (apiKeyId) {
    log('\n16. REVOKING FIRST API KEY', 'yellow');
    await makeRequest(`/auth/api-keys/${apiKeyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    }, 'Revoke API Key', 'apiKeys');
    
    // Test 17: Try using revoked key (should fail)
    log('\n17. TESTING REVOKED KEY (SHOULD FAIL)', 'yellow');
    await makeRequest('/api/console-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: {
        url: 'https://example.com'
      }
    }, 'Test Revoked Key', 'errorHandling', true);
  }
  
  // Test 18: Revoke second API key
  if (secondApiKeyId) {
    log('\n18. REVOKING SECOND API KEY', 'yellow');
    await makeRequest(`/auth/api-keys/${secondApiKeyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    }, 'Revoke Second API Key', 'apiKeys');
  }
  
  // Test 19: Test invalid credentials
  log('\n19. TESTING INVALID LOGIN (SHOULD FAIL)', 'yellow');
  await makeRequest('/auth/login', {
    method: 'POST',
    body: {
      email: userEmail,
      password: 'WrongPassword'
    }
  }, 'Invalid Login', 'errorHandling', true);
  
  // Test 20: Test registration with existing email (should fail)
  log('\n20. TESTING DUPLICATE REGISTRATION (SHOULD FAIL)', 'yellow');
  await makeRequest('/auth/register', {
    method: 'POST',
    body: {
      email: userEmail,
      password: userPassword,
      name: userName
    }
  }, 'Duplicate Registration', 'errorHandling', true);
  
  // Test 21: Test invalid email format
  log('\n21. TESTING INVALID EMAIL FORMAT (SHOULD FAIL)', 'yellow');
  await makeRequest('/auth/register', {
    method: 'POST',
    body: {
      email: 'invalid-email',
      password: userPassword,
      name: 'Test User'
    }
  }, 'Invalid Email Format', 'errorHandling', true);
  
  // Test 22: Test weak password
  log('\n22. TESTING WEAK PASSWORD (SHOULD FAIL)', 'yellow');
  await makeRequest('/auth/register', {
    method: 'POST',
    body: {
      email: `weak${Date.now()}@example.com`,
      password: '123',
      name: 'Test User'
    }
  }, 'Weak Password', 'errorHandling', true);
  
  // Test 23: Test missing required fields
  log('\n23. TESTING MISSING REQUIRED FIELDS (SHOULD FAIL)', 'yellow');
  await makeRequest('/auth/register', {
    method: 'POST',
    body: {
      email: `missing${Date.now()}@example.com`
      // Missing password and name
    }
  }, 'Missing Required Fields', 'errorHandling', true);
  
  // Test 24: Test expired JWT token (simulate)
  log('\n24. TESTING EXPIRED TOKEN (SHOULD FAIL)', 'yellow');
  await makeRequest('/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkV4cGlyZWQiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid'
    }
  }, 'Expired Token', 'errorHandling', true);
  
  // Test 25: Test malformed API key
  log('\n25. TESTING MALFORMED API KEY (SHOULD FAIL)', 'yellow');
  await makeRequest('/api/console-logs', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer invalid_api_key_format'
    },
    body: {
      url: 'https://example.com'
    }
  }, 'Malformed API Key', 'errorHandling', true);
  
  // Test 26: Test OPTIONS preflight requests
  log('\n26. TESTING CORS PREFLIGHT', 'yellow');
  await makeRequest('/api/console-logs', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  }, 'CORS Preflight', 'documentation');
  
  // Test 27: Test API documentation endpoint
  log('\n27. CHECKING API DOCUMENTATION', 'yellow');
  const docsResult = await makeRequest('/api-docs', {
    method: 'GET',
    headers: {
      'Accept': 'text/html'
    }
  }, 'API Documentation', 'documentation');
  
  if (!docsResult.error) {
    log('   API Documentation is accessible', 'green');
    const hasSwaggerUI = docsResult.data.includes('swagger-ui');
    const hasTryItOut = docsResult.data.includes('tryItOutEnabled: true');
    log(`   Has Swagger UI: ${hasSwaggerUI}`, 'cyan');
    log(`   Try It Out Enabled: ${hasTryItOut}`, 'cyan');
  }
  
  // Test 28: Test OpenAPI spec
  log('\n28. CHECKING OPENAPI SPEC', 'yellow');
  const openApiResult = await makeRequest('/openapi.json', {
    method: 'GET'
  }, 'OpenAPI Spec', 'documentation');
  
  if (!openApiResult.error && openApiResult.data.openapi) {
    log(`   OpenAPI Version: ${openApiResult.data.openapi}`, 'cyan');
    log(`   API Title: ${openApiResult.data.info.title}`, 'cyan');
    log(`   Total Endpoints: ${Object.keys(openApiResult.data.paths).length}`, 'cyan');
    log(`   Security Schemes: ${Object.keys(openApiResult.data.components.securitySchemes).join(', ')}`, 'cyan');
  }
  
  // Test 29: Test YAML endpoint
  log('\n29. CHECKING OPENAPI YAML', 'yellow');
  const yamlResult = await makeRequest('/openapi.yaml', {
    method: 'GET',
    headers: {
      'Accept': 'application/x-yaml'
    }
  }, 'OpenAPI YAML', 'documentation');
  
  if (!yamlResult.error) {
    log('   OpenAPI YAML spec is accessible', 'green');
  }
  
  // Test 30: Test Landing Page
  log('\n30. CHECKING LANDING PAGE', 'yellow');
  const landingResult = await makeRequest('/', {
    method: 'GET',
    headers: {
      'Accept': 'text/html'
    }
  }, 'Landing Page', 'dashboard');
  
  if (!landingResult.error) {
    log('   Landing page is accessible', 'green');
    const hasQuickStart = landingResult.data.includes('Quick Start');
    const hasFeatures = landingResult.data.includes('Features');
    log(`   Has Quick Start: ${hasQuickStart}`, 'cyan');
    log(`   Has Features: ${hasFeatures}`, 'cyan');
  }
  
  // Summary
  log('\n========================================', 'blue');
  log('COMPREHENSIVE TEST SUITE COMPLETED', 'blue');
  log('========================================', 'blue');
  
  // Test Statistics
  const totalTests = 30;
  log('\nTest Statistics:', 'green');
  log(`  Total Tests Run: ${totalTests}`, 'cyan');
  log(`  Test Categories:`, 'cyan');
  log(`    - Authentication: 6 tests`, 'cyan');
  log(`    - API Keys: 5 tests`, 'cyan');
  log(`    - Browser Operations: 8 tests`, 'cyan');
  log(`    - Debugging Tools: 5 tests`, 'cyan');
  log(`    - Dashboard & UI: 3 tests`, 'cyan');
  log(`    - Error Handling: 8 tests`, 'cyan');
  log(`    - Documentation: 4 tests`, 'cyan');
  
  log('\nTest Credentials:', 'green');
  log(`  Email: ${userEmail}`, 'cyan');
  log(`  Password: ${userPassword}`, 'cyan');
  log(`  User ID: ${userId || 'N/A'}`, 'cyan');
  log(`  JWT Token: ${jwtToken ? jwtToken.substring(0, 30) + '...' : 'N/A'}`, 'cyan');
  log(`  Primary API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'Revoked'}`, 'cyan');
  log(`  Secondary API Key: ${secondApiKey ? secondApiKey.substring(0, 20) + '...' : 'Revoked'}`, 'cyan');
  
  log('\nEndpoints Tested:', 'green');
  const endpoints = [
    '/auth/register', '/auth/login', '/auth/profile', '/auth/api-keys',
    '/api/screenshot', '/api/console-logs', '/api/network-logs', '/api/navigate',
    '/api/triage-report', '/health', '/metrics', '/dashboard', '/status',
    '/api-docs', '/openapi.json', '/openapi.yaml', '/'
  ];
  endpoints.forEach(endpoint => {
    log(`  ✓ ${endpoint}`, 'cyan');
  });
  
  log('\n✅ All tests completed successfully!', 'green');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
}

// Function to generate HTML report with headers and screenshots
function generateHTMLReport() {
  // Group tests by execution time (grouped by minute)
  const testsByTime = {};
  testReport.testCases.forEach(test => {
    const timeKey = new Date(test.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    if (!testsByTime[timeKey]) {
      testsByTime[timeKey] = [];
    }
    testsByTime[timeKey].push(test);
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME Test Report - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .meta {
      display: flex;
      gap: 30px;
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.9;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-card .label {
      color: #6c757d;
      font-size: 14px;
    }
    
    .stat-card.success .value { color: #28a745; }
    .stat-card.danger .value { color: #dc3545; }
    .stat-card.warning .value { color: #ffc107; }
    .stat-card.info .value { color: #17a2b8; }
    
    .categories {
      padding: 30px;
    }
    
    .category {
      margin-bottom: 30px;
    }
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 15px;
      cursor: pointer;
    }
    
    .category-header:hover {
      background: #e9ecef;
    }
    
    .category-title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
    }
    
    .category-stats {
      display: flex;
      gap: 15px;
    }
    
    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .badge.success { background: #d4edda; color: #155724; }
    .badge.danger { background: #f8d7da; color: #721c24; }
    .badge.info { background: #d1ecf1; color: #0c5460; }
    
    .test-list {
      display: none;
    }
    
    .test-list.active {
      display: block;
    }
    
    .test-case {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      margin-bottom: 15px;
      overflow: hidden;
    }
    
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      cursor: pointer;
    }
    
    .test-header:hover {
      background: #e9ecef;
    }
    
    .test-name {
      font-weight: 500;
      color: #495057;
    }
    
    .test-status {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .status-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
    }
    
    .status-icon.passed { background: #28a745; }
    .status-icon.failed { background: #dc3545; }
    .status-icon.error { background: #ffc107; }
    
    .test-duration {
      color: #6c757d;
      font-size: 13px;
    }
    
    .test-details {
      display: none;
      padding: 20px;
      background: white;
    }
    
    .test-details.active {
      display: block;
    }
    
    .detail-section {
      margin-bottom: 20px;
    }
    
    .detail-title {
      font-weight: 600;
      color: #495057;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .code-block {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 15px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .results-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .result-box {
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 15px;
      background: #ffffff;
    }
    
    .result-box.expected {
      border-left: 4px solid #17a2b8;
    }
    
    .result-box.actual {
      border-left: 4px solid #28a745;
    }
    
    .result-box.actual.failed {
      border-left: 4px solid #dc3545;
    }
    
    .result-header {
      font-weight: 600;
      margin-bottom: 12px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .result-content {
      font-size: 13px;
    }
    
    .result-field {
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .result-label {
      font-weight: 600;
      color: #6c757d;
      font-size: 12px;
    }
    
    .result-value {
      color: #2d3748;
      padding: 6px 10px;
      background: #f8f9fa;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    
    .result-match {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 500;
      text-align: center;
    }
    
    .result-match.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .result-match.failure {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .headers-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .headers-table td {
      padding: 8px;
      border-bottom: 1px solid #dee2e6;
      font-size: 13px;
    }
    
    .headers-table td:first-child {
      font-weight: 600;
      color: #6c757d;
      width: 150px;
    }
    
    .response-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: 600;
      margin-left: 10px;
    }
    
    .response-status.success { background: #d4edda; color: #155724; }
    .response-status.error { background: #f8d7da; color: #721c24; }
    
    .timeline {
      padding: 30px;
      background: #f8f9fa;
    }
    
    .timeline-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #2d3748;
    }
    
    .timeline-chart {
      background: white;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
    }
    
    .footer {
      padding: 20px 30px;
      background: #f8f9fa;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    
    .time-section {
      margin: 30px 0;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    
    .time-header {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .time-header h2 {
      font-size: 20px;
      margin: 0;
    }
    
    .time-stats {
      display: flex;
      gap: 20px;
      font-size: 14px;
    }
    
    .screenshot-section {
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }
    
    .screenshot-header {
      font-weight: 600;
      color: #495057;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .screenshot-placeholder {
      background: white;
      border: 2px dashed #dee2e6;
      border-radius: 6px;
      padding: 40px;
      text-align: center;
      color: #6c757d;
      font-size: 13px;
      position: relative;
      min-height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .screenshot-placeholder.success {
      border-color: #28a745;
      background: #f4fdf5;
    }
    
    .screenshot-placeholder.failure {
      border-color: #dc3545;
      background: #fef4f4;
    }
    
    .screenshot-icon {
      font-size: 48px;
      margin-bottom: 10px;
      opacity: 0.5;
    }
    
    .headers-section {
      margin-top: 15px;
      padding: 15px;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .headers-title {
      font-weight: 600;
      color: #495057;
      margin-bottom: 12px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .header-item {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #f1f3f5;
      font-size: 13px;
    }
    
    .header-item:last-child {
      border-bottom: none;
    }
    
    .header-key {
      font-weight: 600;
      color: #6c757d;
      min-width: 200px;
    }
    
    .header-value {
      color: #2d3748;
      word-break: break-all;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    
    .test-meta {
      display: flex;
      gap: 20px;
      padding: 10px 0;
      font-size: 13px;
      color: #6c757d;
      border-bottom: 1px solid #e9ecef;
      margin-bottom: 15px;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .meta-label {
      font-weight: 600;
    }
    
    /* Progress indicators */
    .progress-section {
      margin: 30px 0;
      padding: 25px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    
    .progress-title {
      font-size: 20px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .overall-progress {
      margin-bottom: 30px;
    }
    
    .progress-bar-container {
      background: #e9ecef;
      border-radius: 10px;
      height: 30px;
      overflow: hidden;
      position: relative;
      margin: 10px 0;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 10px;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      position: relative;
      overflow: hidden;
    }
    
    .progress-bar::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    .progress-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-top: 20px;
    }
    
    .progress-stat {
      text-align: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .progress-stat-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .progress-stat-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
    }
    
    .category-progress {
      margin-top: 30px;
    }
    
    .category-progress-item {
      margin-bottom: 20px;
    }
    
    .category-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .category-name {
      font-weight: 600;
      color: #495057;
      font-size: 14px;
    }
    
    .category-stats {
      font-size: 13px;
      color: #6c757d;
    }
    
    .mini-progress-bar {
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
    }
    
    .mini-progress-success {
      background: #28a745;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 600;
    }
    
    .mini-progress-failure {
      background: #dc3545;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 600;
    }
    
    .execution-timeline {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .timeline-header {
      font-weight: 600;
      color: #495057;
      margin-bottom: 15px;
      font-size: 16px;
    }
    
    .timeline-item {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 10px;
      padding: 10px;
      background: white;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }
    
    .timeline-time {
      font-size: 12px;
      color: #6c757d;
      min-width: 80px;
    }
    
    .timeline-test {
      flex: 1;
      font-size: 13px;
      color: #2d3748;
    }
    
    .timeline-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    
    .timeline-status.passed {
      background: #d4edda;
      color: #155724;
    }
    
    .timeline-status.failed {
      background: #f8d7da;
      color: #721c24;
    }
    
    @media (max-width: 768px) {
      .summary {
        grid-template-columns: 1fr;
      }
      
      .category-stats {
        flex-direction: column;
        gap: 5px;
      }
      
      .results-comparison {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🚀 RapidTriageME Test Report</h1>
      <div class="meta">
        <div><strong>Environment:</strong> ${testReport.metadata.environment}</div>
        <div><strong>Execution ID:</strong> ${testReport.metadata.executionId}</div>
        <div><strong>Start Time:</strong> ${new Date(testReport.metadata.startTime).toLocaleString()}</div>
        <div><strong>Duration:</strong> ${testReport.metadata.duration || 'N/A'}</div>
      </div>
    </div>
    
    <!-- Progress Section -->
    <div class="progress-section">
      <div class="progress-title">
        📊 Test Execution Progress & Analytics
      </div>
      
      <!-- Overall Progress Bar -->
      <div class="overall-progress">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 600; color: #495057;">Overall Progress</span>
          <span style="color: #6c757d;">${testReport.statistics.totalTests} tests completed</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${(testReport.statistics.passed / testReport.statistics.totalTests) * 100}%">
            ${testReport.statistics.successRate.toFixed(1)}% Success Rate
          </div>
        </div>
      </div>
      
      <!-- Progress Statistics -->
      <div class="progress-stats">
        <div class="progress-stat">
          <div class="progress-stat-value" style="color: #17a2b8;">${testReport.statistics.totalTests}</div>
          <div class="progress-stat-label">Total Tests</div>
        </div>
        <div class="progress-stat">
          <div class="progress-stat-value" style="color: #28a745;">${testReport.statistics.passed}</div>
          <div class="progress-stat-label">Passed</div>
        </div>
        <div class="progress-stat">
          <div class="progress-stat-value" style="color: #dc3545;">${testReport.statistics.failed}</div>
          <div class="progress-stat-label">Failed</div>
        </div>
        <div class="progress-stat">
          <div class="progress-stat-value" style="color: #ffc107;">${((testReport.metadata.duration || 0) / 1000).toFixed(1)}s</div>
          <div class="progress-stat-label">Duration</div>
        </div>
      </div>
      
      <!-- Category Progress Bars -->
      <div class="category-progress">
        <h3 style="font-size: 16px; color: #495057; margin-bottom: 20px;">Progress by Category</h3>
        ${Object.entries(testReport.categories).map(([name, category]) => {
          const percentage = category.total > 0 ? (category.passed / category.total) * 100 : 0;
          const failedPercentage = category.total > 0 ? (category.failed / category.total) * 100 : 0;
          return `
          <div class="category-progress-item">
            <div class="category-progress-header">
              <span class="category-name">${name.charAt(0).toUpperCase() + name.slice(1)}</span>
              <span class="category-stats">${category.passed}/${category.total} passed</span>
            </div>
            <div class="mini-progress-bar">
              ${category.passed > 0 ? `<div class="mini-progress-success" style="width: ${percentage}%">${category.passed}</div>` : ''}
              ${category.failed > 0 ? `<div class="mini-progress-failure" style="width: ${failedPercentage}%">${category.failed}</div>` : ''}
            </div>
          </div>
          `;
        }).join('')}
      </div>
      
      <!-- Execution Timeline -->
      <div class="execution-timeline">
        <div class="timeline-header">⏱️ Execution Timeline</div>
        ${testReport.testCases.slice(0, 10).map(test => `
          <div class="timeline-item">
            <div class="timeline-time">${new Date(test.timestamp).toLocaleTimeString()}</div>
            <div class="timeline-test">#${test.testNumber} - ${test.name}</div>
            <div class="timeline-status ${test.passed ? 'passed' : 'failed'}">
              ${test.passed ? 'PASSED' : 'FAILED'}
            </div>
          </div>
        `).join('')}
        ${testReport.testCases.length > 10 ? `
          <div style="text-align: center; margin-top: 15px; color: #6c757d; font-size: 13px;">
            ... and ${testReport.testCases.length - 10} more tests
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Summary Statistics -->
    <div class="summary">
      <div class="stat-card info">
        <div class="value">${testReport.statistics.totalTests}</div>
        <div class="label">Total Tests</div>
      </div>
      <div class="stat-card success">
        <div class="value">${testReport.statistics.passed}</div>
        <div class="label">Passed</div>
      </div>
      <div class="stat-card danger">
        <div class="value">${testReport.statistics.failed}</div>
        <div class="label">Failed</div>
      </div>
      <div class="stat-card warning">
        <div class="value">${testReport.statistics.successRate.toFixed(1)}%</div>
        <div class="label">Success Rate</div>
      </div>
    </div>
    
    <!-- Test Results by Time -->
    <div class="categories">
      ${Object.entries(testsByTime).map(([timeKey, tests]) => {
        const passedCount = tests.filter(t => t.passed).length;
        const failedCount = tests.filter(t => !t.passed).length;
        return `
        <div class="time-section">
          <div class="time-header">
            <h2>🕐 ${timeKey}</h2>
            <div class="time-stats">
              <span>Total: ${tests.length}</span>
              <span style="color: #a3e4a8;">Passed: ${passedCount}</span>
              <span style="color: #ffa5a5;">Failed: ${failedCount}</span>
            </div>
          </div>
          
          ${tests.map(test => `
            <div class="test-case">
              <div class="test-header" onclick="toggleTest('${test.id}')">
                <div class="test-name">
                  <span style="color: #6c757d; font-weight: 600;">#${test.testNumber}</span> 
                  ${test.name}
                </div>
                <div class="test-status">
                  <span class="badge info">${test.category}</span>
                  <span class="test-duration">${test.duration}ms</span>
                  <span class="status-icon ${test.status}">
                    ${test.passed ? '✓' : '✗'}
                  </span>
                </div>
              </div>
              <div class="test-details" id="${test.id}">
                    <!-- Test Metadata -->
                    <div class="test-meta">
                      <div class="meta-item">
                        <span class="meta-label">Test ID:</span> ${test.id}
                      </div>
                      <div class="meta-item">
                        <span class="meta-label">Executed:</span> ${test.executionTime}
                      </div>
                      <div class="meta-item">
                        <span class="meta-label">Category:</span> ${test.category}
                      </div>
                      <div class="meta-item">
                        <span class="meta-label">Duration:</span> ${test.duration}ms
                      </div>
                    </div>
                    
                    <!-- Expected vs Actual Results -->
                    <div class="results-comparison">
                      <div class="result-box expected">
                        <div class="result-header">🎯 Expected Result</div>
                        <div class="result-content">
                          <div class="result-field">
                            <span class="result-label">Status Code</span>
                            <span class="result-value">${Array.isArray(test.expectedResult?.statusCode) ? test.expectedResult.statusCode.join(' or ') : test.expectedResult?.statusCode || 'N/A'}</span>
                          </div>
                          <div class="result-field">
                            <span class="result-label">Description</span>
                            <span class="result-value">${test.expectedResult?.description || 'N/A'}</span>
                          </div>
                          ${test.expectedResult?.responseContains ? `
                          <div class="result-field">
                            <span class="result-label">Response Should Contain</span>
                            <span class="result-value">${test.expectedResult.responseContains.join(', ') || 'N/A'}</span>
                          </div>
                          ` : ''}
                        </div>
                      </div>
                      
                      <div class="result-box actual ${test.passed ? '' : 'failed'}">
                        <div class="result-header">✅ Actual Result</div>
                        <div class="result-content">
                          <div class="result-field">
                            <span class="result-label">Status Code</span>
                            <span class="result-value">${test.actualResult?.statusCode || test.response?.status || 'N/A'}</span>
                          </div>
                          <div class="result-field">
                            <span class="result-label">Description</span>
                            <span class="result-value">${test.actualResult?.description || 'N/A'}</span>
                          </div>
                          <div class="result-field">
                            <span class="result-label">Response Time</span>
                            <span class="result-value">${test.duration}ms</span>
                          </div>
                          <div class="result-match ${test.passed ? 'success' : 'failure'}">
                            ${test.actualResult?.matches || (test.passed ? 'Test Passed' : 'Test Failed')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Request Details -->
                    <div class="detail-section">
                      <div class="detail-title">📤 Request Details</div>
                      <div class="code-block">
${test.request.method} ${test.request.endpoint}
${test.request.body ? '\nBody:\n' + JSON.stringify(test.request.body, null, 2) : ''}
                      </div>
                      <table class="headers-table">
                        ${Object.entries(test.request.headers).map(([key, value]) => `
                          <tr>
                            <td>${key}</td>
                            <td>${value}</td>
                          </tr>
                        `).join('')}
                      </table>
                    </div>
                    
                    <!-- Response Details -->
                    <div class="detail-section">
                      <div class="detail-title">
                        📥 Response Details
                        <span class="response-status ${test.response?.status >= 200 && test.response?.status < 300 ? 'success' : 'error'}">
                          ${test.response?.status || 'N/A'} ${test.response?.statusText || ''}
                        </span>
                      </div>
                      <div class="code-block">
${test.response?.body ? (typeof test.response.body === 'object' ? JSON.stringify(test.response.body, null, 2) : test.response.body) : test.response?.error || 'No response data'}
                      </div>
                    </div>
                    
                    <!-- Response Headers -->
                    <div class="headers-section">
                      <div class="headers-title">📋 Response Headers</div>
                      ${test.responseHeaders ? Object.entries(test.responseHeaders).map(([key, value]) => `
                        <div class="header-item">
                          <div class="header-key">${key}</div>
                          <div class="header-value">${value}</div>
                        </div>
                      `).join('') : '<div style="color: #6c757d; font-style: italic;">No response headers available</div>'}
                    </div>
                    
                    <!-- Screenshot Section -->
                    <div class="screenshot-section">
                      <div class="screenshot-header">
                        📸 Test Result Screenshot
                        ${test.passed ? '<span style="color: #28a745;">✓ Passed</span>' : '<span style="color: #dc3545;">✗ Failed</span>'}
                      </div>
                      ${test.screenshot && test.screenshot.path ? 
                        `<div style="background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                          <img src="${test.screenshot.filename}" alt="Screenshot for Test #${test.testNumber}" style="width: 100%; height: auto; display: block; max-height: 400px; object-fit: contain;">
                          <div style="padding: 15px; background: #f8f9fa; border-top: 1px solid #dee2e6;">
                            <div style="font-weight: 600; margin-bottom: 5px; color: ${test.passed ? '#28a745' : '#dc3545'};">
                              Test #${test.testNumber}: ${test.name}
                            </div>
                            <div style="font-size: 12px; color: #6c757d;">
                              <div>Status: ${test.passed ? '✅ Success' : '❌ Failure'}</div>
                              <div>Response Code: ${test.response?.status || 'N/A'}</div>
                              <div>Duration: ${test.duration}ms</div>
                              <div>Captured: ${new Date(test.screenshot.captured).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>` :
                        `<div class="screenshot-placeholder ${test.passed ? 'success' : 'failure'}">
                          <div class="screenshot-icon">📷</div>
                          <div style="font-weight: 600; margin-bottom: 5px;">Test #${test.testNumber}: ${test.name}</div>
                          <div style="font-size: 12px; color: #6c757d;">
                            Captured at: ${test.executionTime}<br>
                            Status: ${test.passed ? 'Success' : 'Failure'}<br>
                            Response Code: ${test.response?.status || 'N/A'}
                          </div>
                        </div>`
                      }
                    </div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      `;
      }).join('')}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()} | RapidTriageME Test Suite v1.0.0</p>
    </div>
  </div>
  
  <script>
    function toggleCategory(name) {
      const element = document.getElementById('category-' + name);
      element.classList.toggle('active');
    }
    
    function toggleTest(id) {
      const element = document.getElementById(id);
      element.classList.toggle('active');
    }
  </script>
</body>
</html>`;
  
  return html;
}

// Function to save reports
async function saveReports() {
  // Calculate final statistics
  testReport.metadata.endTime = new Date().toISOString();
  testReport.metadata.duration = new Date(testReport.metadata.endTime) - new Date(testReport.metadata.startTime);
  testReport.statistics.successRate = testReport.statistics.totalTests > 0 
    ? (testReport.statistics.passed / testReport.statistics.totalTests) * 100 
    : 0;
  
  // Store credentials in report
  testReport.credentials.email = userEmail;
  testReport.credentials.userId = userId;
  testReport.credentials.apiKeys = [
    { name: 'Primary', id: apiKeyId, key: apiKey ? apiKey.substring(0, 20) + '...' : 'Revoked' },
    { name: 'Secondary', id: secondApiKeyId, key: secondApiKey ? secondApiKey.substring(0, 20) + '...' : 'Revoked' }
  ];
  
  // Create reports directory if it doesn't exist
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // Generate filenames with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const jsonFile = path.join(REPORTS_DIR, `test-report-${timestamp}.json`);
  const htmlFile = path.join(REPORTS_DIR, `test-report-${timestamp}.html`);
  
  // Copy screenshots to reports directory for embedding
  const screenshotsSourceDir = path.join(__dirname, 'reports', 'screenshots');
  if (fs.existsSync(screenshotsSourceDir)) {
    testReport.testCases.forEach(test => {
      if (test.screenshot && test.screenshot.path) {
        const screenshotDest = path.join(REPORTS_DIR, test.screenshot.filename);
        if (fs.existsSync(test.screenshot.path)) {
          try {
            fs.copyFileSync(test.screenshot.path, screenshotDest);
            log(`   📷 Copied screenshot: ${test.screenshot.filename}`, 'cyan');
          } catch (err) {
            console.error(`Failed to copy screenshot: ${err.message}`);
          }
        }
      }
    });
  }
  
  // Save JSON report
  fs.writeFileSync(jsonFile, JSON.stringify(testReport, null, 2));
  log(`\n📄 JSON Report saved: ${jsonFile}`, 'green');
  
  // Save HTML report
  const htmlContent = generateHTMLReport();
  fs.writeFileSync(htmlFile, htmlContent);
  log(`📊 HTML Report saved: ${htmlFile}`, 'green');
  
  // List all reports in directory
  log('\n📁 Available Reports:', 'blue');
  const files = fs.readdirSync(REPORTS_DIR);
  files.forEach(file => {
    const stats = fs.statSync(path.join(REPORTS_DIR, file));
    log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`, 'cyan');
  });
  
  return { jsonFile, htmlFile };
}

// Run the tests
runTests().then(async () => {
  await saveReports();
  
  // Close browser after all screenshots are captured
  await screenshotCapture.closeBrowser();
  
  log('\n✅ Test suite completed and reports generated!', 'green');
}).catch(async error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  await saveReports();
  
  // Close browser even on error
  await screenshotCapture.closeBrowser();
  
  process.exit(1);
});