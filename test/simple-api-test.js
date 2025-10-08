#!/usr/bin/env node

const config = require('./config/test.config');
const fetch = require('./utils/fetch');

async function testEndpoint(name, endpoint, method = 'POST', body = null) {
  console.log(`\nTesting: ${name}`);
  console.log(`  URL: ${config.getApiUrl(endpoint)}`);
  console.log(`  Method: ${method}`);
  
  try {
    const options = {
      method: method,
      headers: config.getHeaders()
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(config.getApiUrl(endpoint), options);
    
    console.log(`  Status: ${response.status} ${response.ok ? '✓' : '✗'}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  Response:`, JSON.stringify(data).substring(0, 100) + '...');
    } else {
      const text = await response.text();
      console.log(`  Error:`, text.substring(0, 100));
    }
    
    return response.ok;
  } catch (error) {
    console.log(`  Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('RapidTriageME API Simple Test');
  console.log('==============================');
  console.log('Token:', config.api.token.substring(0, 20) + '...');
  
  const tests = [
    ['Health Check', '/health', 'GET'],
    ['Console Logs', '/api/console-logs', 'POST', { url: 'https://google.com' }],
    ['Console Errors', '/api/console-errors', 'POST', { url: 'https://google.com' }],
    ['Network Logs', '/api/network-logs', 'POST', { url: 'https://google.com' }],
    ['Network Errors', '/api/network-errors', 'POST', { url: 'https://google.com' }],
    ['Screenshot', '/api/screenshot', 'POST', { 
      data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      url: 'https://example.com',
      title: 'Test'
    }]
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const [name, endpoint, method, body] of tests) {
    const result = await testEndpoint(name, endpoint, method, body);
    if (result) passed++;
    else failed++;
  }
  
  console.log('\n==============================');
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
}

runTests();