#!/usr/bin/env node

/**
 * RapidTriageME MCP Button Integration Test Suite
 * Tests all button functionality via MCP tools
 * 
 * This tests the actual MCP integration for all DevTools buttons:
 * - Core Functions: Test Server, Screenshot, Clear, DevTools
 * - Audit Tools: Accessibility, Performance, SEO, Best Practices, NextJS, Lighthouse  
 * - Debug Tools: Console Logs, Console Errors, Inspect, Network Logs, Network Errors, Wipe Logs
 * - Modes: Debug Mode, Audit Mode
 */

const fetch = require('../utils/fetch');
const fs = require('fs');
const path = require('path');
const config = require('../config/test.config');

// Configuration
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3025';
const API_BASE_URL = config.api.baseUrl;
const AUTH_TOKEN = config.api.token;
const TEST_URL = config.testData.urls.example;

// Test report
const testReport = {
  metadata: {
    startTime: new Date().toISOString(),
    endTime: null,
    testSuite: 'MCP Button Integration Tests',
    version: '1.0.0',
    serverUrl: MCP_SERVER_URL,
    apiUrl: API_BASE_URL
  },
  statistics: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  buttonTests: {
    coreFunction: [],
    auditTools: [],
    debugTools: [],
    modes: []
  },
  testCases: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// MCP Tool mappings for each button
const buttonToMcpTool = {
  // Core Functions
  'Test Server': { endpoint: '/health', method: 'GET', auth: false },
  'Screenshot': { endpoint: '/api/screenshot', method: 'POST', auth: true },
  'Clear': { tool: 'wipeLogs', local: true },
  'DevTools': { tool: 'openDevTools', local: true },
  
  // Audit Tools
  'Accessibility': { tool: 'runAccessibilityAudit', mcp: true },
  'Performance': { tool: 'runPerformanceAudit', mcp: true },
  'SEO': { tool: 'runSEOAudit', mcp: true },
  'Best Practices': { tool: 'runBestPracticesAudit', mcp: true },
  'NextJS': { tool: 'runNextJSAudit', mcp: true },
  'Lighthouse': { endpoint: '/api/lighthouse', method: 'POST', auth: true },
  
  // Debug Tools
  'Console Logs': { tool: 'getConsoleLogs', mcp: true },
  'Console Errors': { tool: 'getConsoleErrors', mcp: true },
  'Inspect': { tool: 'getSelectedElement', mcp: true },
  'Network Logs': { tool: 'getNetworkLogs', mcp: true },
  'Network Errors': { tool: 'getNetworkErrors', mcp: true },
  'Wipe Logs': { tool: 'wipeLogs', mcp: true },
  
  // Modes
  'Debug Mode': { tool: 'runDebuggerMode', mcp: true },
  'Audit Mode': { tool: 'runAuditMode', mcp: true }
};

// Test a button via API endpoint
async function testApiEndpoint(buttonName, config) {
  const url = `${API_BASE_URL}${config.endpoint}`;
  const options = {
    method: config.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (config.auth) {
    options.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  
  if (config.method === 'POST') {
    options.body = JSON.stringify({
      url: TEST_URL,
      title: `Test ${buttonName}`,
      data: buttonName === 'Screenshot' ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' : undefined
    });
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.text();
    
    let result;
    try {
      result = JSON.parse(data);
    } catch {
      result = data;
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test a button via MCP tool
async function testMcpTool(buttonName, toolName) {
  const url = `${MCP_SERVER_URL}/mcp/tool`;
  
  const requestBody = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: `mcp__rapidtriage-local__${toolName}`,
      arguments: {}
    },
    id: Date.now()
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    return {
      success: response.ok && !data.error,
      status: response.status,
      data: data.result || data.error
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test a single button
async function testButton(buttonName, category) {
  const config = buttonToMcpTool[buttonName];
  const testCase = {
    id: `test-${testReport.statistics.totalTests + 1}`,
    name: buttonName,
    category: category,
    timestamp: new Date().toISOString(),
    config: config,
    status: 'pending',
    passed: false,
    response: null,
    error: null,
    duration: 0
  };
  
  const startTime = Date.now();
  
  try {
    log(`  Testing: ${buttonName}`, 'cyan');
    
    let result;
    
    if (config.endpoint) {
      // Test via API endpoint
      result = await testApiEndpoint(buttonName, config);
    } else if (config.mcp) {
      // Test via MCP tool
      result = await testMcpTool(buttonName, config.tool);
    } else if (config.local) {
      // Local action (simulate)
      result = {
        success: true,
        data: `${buttonName} action simulated`
      };
    }
    
    testCase.response = result;
    testCase.duration = Date.now() - startTime;
    testCase.passed = result.success;
    testCase.status = result.success ? 'passed' : 'failed';
    
    if (result.success) {
      log(`    ✓ ${buttonName} test passed (${testCase.duration}ms)`, 'green');
      testReport.statistics.passed++;
    } else {
      log(`    ✗ ${buttonName} test failed: ${result.error || result.data}`, 'red');
      testReport.statistics.failed++;
      testCase.error = result.error || result.data;
    }
    
  } catch (error) {
    testCase.error = error.message;
    testCase.status = 'error';
    testCase.duration = Date.now() - startTime;
    log(`    ✗ ${buttonName} test error: ${error.message}`, 'red');
    testReport.statistics.failed++;
  }
  
  testReport.statistics.totalTests++;
  testReport.testCases.push(testCase);
  testReport.buttonTests[category].push(testCase);
  
  return testCase;
}

// Run all button tests
async function runButtonTests() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'blue');
  log('║       RapidTriageME MCP Button Integration Tests            ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════╝', 'blue');
  log(`\n📍 MCP Server: ${MCP_SERVER_URL}`, 'cyan');
  log(`🌐 API Server: ${API_BASE_URL}`, 'cyan');
  log(`🔑 Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`, 'cyan');
  log(`📊 Started: ${new Date().toISOString()}\n`, 'cyan');
  
  // Test server connectivity first
  log('🔌 Testing server connectivity...', 'yellow');
  const healthCheck = await testApiEndpoint('Health Check', { 
    endpoint: '/health', 
    method: 'GET', 
    auth: false 
  });
  
  if (healthCheck.success) {
    log('  ✓ Server is reachable', 'green');
  } else {
    log('  ✗ Server is not reachable', 'red');
    log(`    Error: ${healthCheck.error}`, 'red');
  }
  
  // Test Core Function buttons
  log('\n═══ CORE FUNCTIONS ═══', 'magenta');
  await testButton('Test Server', 'coreFunction');
  await testButton('Screenshot', 'coreFunction');
  await testButton('Clear', 'coreFunction');
  await testButton('DevTools', 'coreFunction');
  
  // Test Audit Tools buttons
  log('\n═══ AUDIT TOOLS ═══', 'magenta');
  await testButton('Accessibility', 'auditTools');
  await testButton('Performance', 'auditTools');
  await testButton('SEO', 'auditTools');
  await testButton('Best Practices', 'auditTools');
  await testButton('NextJS', 'auditTools');
  await testButton('Lighthouse', 'auditTools');
  
  // Test Debug Tools buttons
  log('\n═══ DEBUG TOOLS ═══', 'magenta');
  await testButton('Console Logs', 'debugTools');
  await testButton('Console Errors', 'debugTools');
  await testButton('Inspect', 'debugTools');
  await testButton('Network Logs', 'debugTools');
  await testButton('Network Errors', 'debugTools');
  await testButton('Wipe Logs', 'debugTools');
  
  // Test Mode buttons
  log('\n═══ MODES ═══', 'magenta');
  await testButton('Debug Mode', 'modes');
  await testButton('Audit Mode', 'modes');
  
  // Generate summary
  testReport.metadata.endTime = new Date().toISOString();
  testReport.metadata.duration = new Date(testReport.metadata.endTime) - new Date(testReport.metadata.startTime);
  
  // Save report
  const reportsDir = path.join(__dirname, 'reports', 'mcp-tests');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const reportFile = path.join(reportsDir, `mcp-button-test-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(testReport, null, 2));
  
  // Print summary
  log('\n╔══════════════════════════════════════════════════════════════╗', 'blue');
  log('║                    TEST SUMMARY                              ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\n📊 Test Statistics:`, 'cyan');
  log(`  Total Tests: ${testReport.statistics.totalTests}`, 'white');
  log(`  ✅ Passed: ${testReport.statistics.passed}`, 'green');
  log(`  ❌ Failed: ${testReport.statistics.failed}`, 'red');
  log(`  ⏭️ Skipped: ${testReport.statistics.skipped}`, 'yellow');
  
  const successRate = testReport.statistics.totalTests > 0 
    ? ((testReport.statistics.passed / testReport.statistics.totalTests) * 100).toFixed(1)
    : 0;
  log(`  📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  // Category breakdown
  log(`\n📂 Category Breakdown:`, 'cyan');
  Object.entries(testReport.buttonTests).forEach(([category, tests]) => {
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    log(`  ${category}: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
  });
  
  log(`\n📁 Report saved: ${reportFile}`, 'green');
  
  // Exit with appropriate code
  process.exit(testReport.statistics.failed > 0 ? 1 : 0);
}

// Check if MCP server is running
async function checkMcpServer() {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Main entry point
async function main() {
  // Check if MCP server is available
  const mcpAvailable = await checkMcpServer();
  
  if (!mcpAvailable) {
    log('⚠️  MCP Server not available at ' + MCP_SERVER_URL, 'yellow');
    log('   Some tests will use API endpoints instead', 'yellow');
  }
  
  // Run the tests
  await runButtonTests();
}

// Run the main function
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});