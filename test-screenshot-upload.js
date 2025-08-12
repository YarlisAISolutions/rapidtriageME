#!/usr/bin/env node

/**
 * Screenshot Upload Test for RapidTriageME
 * Tests the screenshot upload functionality to R2 storage
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://rapidtriage.me';
const AUTH_TOKEN = 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const http = isHttps ? require('https') : require('http');
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.auth) {
      reqOptions.headers['Authorization'] = `Bearer ${options.auth}`;
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          json: () => {
            try {
              return JSON.parse(data);
            } catch {
              return data;
            }
          }
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      const bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
      req.write(bodyData);
    }
    
    req.end();
  });
}

async function testScreenshotUpload() {
  console.log(`${colors.bold}${colors.blue}=== RapidTriageME Screenshot Upload Test ===${colors.reset}\n`);
  console.log(`Testing against: ${BASE_URL}/api/screenshot\n`);

  // Create a sample base64 image (1x1 pixel transparent PNG)
  const sampleImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const testCases = [
    {
      name: 'Valid Screenshot Upload',
      data: {
        data: sampleImageBase64,
        url: 'https://example.com/test-page',
        title: 'Test Page Screenshot',
        timestamp: new Date().toISOString(),
        tenant: {
          type: 'test',
          identifier: 'test-suite'
        },
        project: 'rapidtriage-test'
      },
      expectedStatus: 200
    },
    {
      name: 'Screenshot with Minimal Data',
      data: {
        data: sampleImageBase64,
        url: 'https://example.com',
        title: 'Minimal Test'
      },
      expectedStatus: 200
    },
    {
      name: 'Missing Required Fields',
      data: {
        url: 'https://example.com'
      },
      expectedStatus: 400
    },
    {
      name: 'OPTIONS Preflight Request',
      method: 'OPTIONS',
      data: null,
      expectedStatus: 204
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    process.stdout.write(`${colors.cyan}Testing: ${testCase.name}...${colors.reset} `);
    
    try {
      const response = await makeRequest(`${BASE_URL}/api/screenshot`, {
        method: testCase.method || 'POST',
        auth: AUTH_TOKEN,
        headers: {
          'X-Extension-Id': 'test-suite',
          'X-Tenant-Type': 'test',
          'X-Tenant-Id': 'test-runner',
          'X-Project': 'rapidtriage-test'
        },
        body: testCase.data
      });

      const responseData = response.json();
      
      if (response.status === testCase.expectedStatus) {
        console.log(`${colors.green}✓ Success (${response.status})${colors.reset}`);
        
        // Log additional details for successful uploads
        if (response.status === 200 && responseData) {
          if (responseData.key) console.log(`  Storage Key: ${responseData.key}`);
          if (responseData.size) console.log(`  Size: ${responseData.size} bytes`);
          if (responseData.url) console.log(`  URL: ${responseData.url}`);
        }
        
        passed++;
      } else {
        console.log(`${colors.red}✗ Unexpected status: ${response.status} (expected ${testCase.expectedStatus})${colors.reset}`);
        if (responseData && responseData.error) {
          console.log(`  Error: ${responseData.error}`);
          if (responseData.details) {
            console.log(`  Details:`, responseData.details);
          }
        }
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗ Request failed: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  // Test with actual screenshot file if available
  const screenshotPath = path.join(__dirname, 'screenshots', 'screenshot-2025-08-09T22-40-41-800Z.png');
  if (fs.existsSync(screenshotPath)) {
    process.stdout.write(`${colors.cyan}Testing: Upload Real Screenshot File...${colors.reset} `);
    
    try {
      const imageBuffer = fs.readFileSync(screenshotPath);
      const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
      
      const response = await makeRequest(`${BASE_URL}/api/screenshot`, {
        method: 'POST',
        auth: AUTH_TOKEN,
        body: {
          data: base64Image,
          url: 'https://rapidtriage.me/test',
          title: 'Real Screenshot Test',
          timestamp: new Date().toISOString()
        }
      });

      const responseData = response.json();
      
      if (response.status === 200) {
        console.log(`${colors.green}✓ Real file uploaded successfully${colors.reset}`);
        if (responseData.size) console.log(`  File size: ${(responseData.size / 1024).toFixed(2)} KB`);
        passed++;
      } else {
        console.log(`${colors.red}✗ Failed (${response.status})${colors.reset}`);
        if (responseData && responseData.error) {
          console.log(`  Error: ${responseData.error}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  // Test List Screenshots endpoint
  console.log(`\n${colors.bold}Testing Screenshot List Endpoint:${colors.reset}`);
  process.stdout.write(`${colors.cyan}Fetching screenshot list...${colors.reset} `);
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/screenshots/list`, {
      method: 'GET',
      auth: AUTH_TOKEN,
      headers: {
        'X-Tenant-Type': 'test',
        'X-Tenant-Id': 'test-suite'
      }
    });

    const responseData = response.json();
    
    if (response.status === 200) {
      console.log(`${colors.green}✓ Success${colors.reset}`);
      if (responseData && responseData.screenshots) {
        console.log(`  Found ${responseData.screenshots.length} screenshot(s)`);
      }
      passed++;
    } else {
      console.log(`${colors.yellow}⚠ Status ${response.status}${colors.reset}`);
      if (responseData && responseData.error) {
        console.log(`  Note: ${responseData.error}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    failed++;
  }

  // Summary
  console.log(`\n${colors.bold}${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

  if (failed === 0) {
    console.log(`${colors.green}${colors.bold}All tests passed! Screenshot upload is working correctly. 🎉${colors.reset}`);
  } else if (passed > 0) {
    console.log(`${colors.yellow}${colors.bold}Some tests passed. Check the failures above.${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bold}All tests failed. Screenshot upload needs attention.${colors.reset}`);
  }

  // Check for R2 configuration
  if (failed > 0) {
    console.log(`\n${colors.yellow}Troubleshooting Tips:${colors.reset}`);
    console.log(`1. Ensure R2 bucket 'rapidtriage-screenshots' exists in Cloudflare`);
    console.log(`2. Verify API token has R2:Edit permissions`);
    console.log(`3. Check worker logs: npx wrangler tail --env production`);
    console.log(`4. Confirm deployment includes R2 binding in wrangler.toml`);
  }
}

// Run the test
testScreenshotUpload().catch(console.error);