#!/usr/bin/env node

const https = require('https');
const config = require('../config/test.config');

const BASE_URL = config.api.baseUrl;
const AUTH_TOKEN = config.api.token;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + options.path);
    const reqOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (data) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = https.request(reqOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(name, options, data = null, validateResponse = null) {
  process.stdout.write(`${colors.cyan}Testing ${name}...${colors.reset} `);
  
  try {
    const response = await makeRequest(options, data);
    
    if (response.status >= 200 && response.status < 300) {
      let parsedData = null;
      try {
        parsedData = JSON.parse(response.data);
      } catch (e) {
        parsedData = response.data;
      }
      
      if (validateResponse && !validateResponse(parsedData)) {
        console.log(`${colors.yellow}⚠ Response validation failed${colors.reset}`);
        return false;
      }
      
      console.log(`${colors.green}✓ Success (${response.status})${colors.reset}`);
      
      // Log key details
      if (typeof parsedData === 'object' && parsedData !== null) {
        if (parsedData.status) console.log(`  Status: ${parsedData.status}`);
        if (parsedData.environment) console.log(`  Environment: ${parsedData.environment}`);
        if (parsedData.version) console.log(`  Version: ${parsedData.version}`);
        if (parsedData.result?.tools) console.log(`  Tools: ${parsedData.result.tools.length} available`);
        if (parsedData.result?.resources) console.log(`  Resources: ${parsedData.result.resources.length} available`);
        if (parsedData.result?.prompts) console.log(`  Prompts: ${parsedData.result.prompts.length} available`);
      }
      
      return true;
    } else {
      console.log(`${colors.red}✗ Failed (${response.status})${colors.reset}`);
      if (response.data) {
        console.log(`  Error: ${response.data.substring(0, 100)}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.blue}=== RapidTriageME API Test Suite ===${colors.reset}\n`);
  console.log(`Testing against: ${BASE_URL}\n`);
  
  let passed = 0;
  let total = 0;
  
  // Test basic endpoints
  console.log(`${colors.bold}Basic Endpoints:${colors.reset}`);
  
  total++;
  if (await testEndpoint('Health Check', { path: '/health' })) passed++;
  
  total++;
  if (await testEndpoint('Metrics', { path: '/metrics' })) passed++;
  
  total++;
  if (await testEndpoint('Landing Page', { path: '/', headers: { 'Accept': 'text/html' } })) passed++;
  
  // Test MCP Protocol endpoints
  console.log(`\n${colors.bold}MCP Protocol Endpoints:${colors.reset}`);
  
  total++;
  if (await testEndpoint('MCP tools/list', 
    { path: '/sse', method: 'POST' },
    { jsonrpc: '2.0', method: 'tools/list', params: {}, id: 1 },
    (data) => data.result && data.result.tools
  )) passed++;
  
  total++;
  if (await testEndpoint('MCP resources/list',
    { path: '/sse', method: 'POST' },
    { jsonrpc: '2.0', method: 'resources/list', params: {}, id: 2 },
    (data) => data.result && data.result.resources
  )) passed++;
  
  total++;
  if (await testEndpoint('MCP prompts/list',
    { path: '/sse', method: 'POST' },
    { jsonrpc: '2.0', method: 'prompts/list', params: {}, id: 3 },
    (data) => data.result && data.result.prompts
  )) passed++;
  
  // Test Browser Tools (these will fail without actual browser connection)
  console.log(`\n${colors.bold}Browser Tools (Expected to fail without browser):${colors.reset}`);
  
  total++;
  if (await testEndpoint('Navigate Browser',
    { path: '/sse', method: 'POST' },
    { 
      jsonrpc: '2.0', 
      method: 'tools/call',
      params: {
        name: 'remote_browser_navigate',
        arguments: { url: 'https://example.com' }
      },
      id: 4
    }
  )) passed++;
  
  total++;
  if (await testEndpoint('Get Console Logs',
    { path: '/sse', method: 'POST' },
    { 
      jsonrpc: '2.0', 
      method: 'tools/call',
      params: {
        name: 'remote_get_console_logs',
        arguments: { level: 'all' }
      },
      id: 5
    }
  )) passed++;
  
  // Test SSE connection
  console.log(`\n${colors.bold}SSE Connection Test:${colors.reset}`);
  process.stdout.write(`${colors.cyan}Testing SSE stream connection...${colors.reset} `);
  
  const sseTest = await new Promise((resolve) => {
    const url = new URL(BASE_URL + '/sse');
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Accept': 'text/event-stream'
      }
    }, (res) => {
      if (res.statusCode === 200 && res.headers['content-type']?.includes('text/event-stream')) {
        console.log(`${colors.green}✓ Connected${colors.reset}`);
        resolve(true);
      } else {
        console.log(`${colors.red}✗ Failed (${res.statusCode})${colors.reset}`);
        resolve(false);
      }
      req.abort();
    });
    
    req.on('error', () => {
      console.log(`${colors.red}✗ Connection error${colors.reset}`);
      resolve(false);
    });
    
    req.end();
    
    setTimeout(() => {
      req.abort();
      resolve(true);
    }, 2000);
  });
  
  total++;
  if (sseTest) passed++;
  
  // Summary
  console.log(`\n${colors.bold}${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`Total: ${total} tests`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${total - passed}${colors.reset}`);
  console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%\n`);
  
  if (passed === total) {
    console.log(`${colors.green}${colors.bold}All tests passed! 🎉${colors.reset}`);
  } else if (passed >= total * 0.7) {
    console.log(`${colors.yellow}${colors.bold}Most tests passed, some issues detected.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}Multiple test failures detected.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(console.error);