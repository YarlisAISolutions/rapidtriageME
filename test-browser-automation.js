#!/usr/bin/env node

/**
 * Optimized Browser Automation Test Suite for RapidTriageME
 * Tests browser automation with resource optimization
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://rapidtriage.me';
const AUTH_TOKEN = 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';
const LOCAL_BROWSER = 'http://localhost:3025';

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

class BrowserAutomationTester {
  constructor() {
    this.results = [];
    this.sessionId = null;
  }

  async makeRequest(url, options = {}) {
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
                return null;
              }
            }
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async testLocalBrowserConnection() {
    console.log(`\n${colors.bold}Testing Local Browser Connector:${colors.reset}`);
    
    try {
      const response = await this.makeRequest(`${LOCAL_BROWSER}/.identity`);
      if (response.status === 200) {
        const data = response.json();
        console.log(`${colors.green}✓ Browser connector online${colors.reset}`);
        console.log(`  Port: ${data.port}`);
        console.log(`  Version: ${data.version}`);
        return true;
      }
    } catch (error) {
      console.log(`${colors.red}✗ Browser connector offline${colors.reset}`);
      console.log(`  Please start: cd rapidtriage-server && node dist/browser-connector.js`);
      return false;
    }
    return false;
  }

  async callMCPMethod(method, params = {}) {
    const requestId = Math.floor(Math.random() * 10000);
    const response = await this.makeRequest(`${BASE_URL}/sse`, {
      method: 'POST',
      auth: AUTH_TOKEN,
      body: {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: requestId
      }
    });
    
    return response.json();
  }

  async testResourceOptimization() {
    console.log(`\n${colors.bold}${colors.magenta}Resource Optimization Tests:${colors.reset}`);
    
    const tests = [
      {
        name: 'Memory-Efficient Screenshot',
        method: 'tools/call',
        params: {
          name: 'remote_capture_screenshot',
          arguments: {
            fullPage: false,  // Viewport only to save memory
            quality: 70,      // Lower quality for smaller size
            format: 'jpeg'    // JPEG is more efficient than PNG
          }
        }
      },
      {
        name: 'Limited Console Logs',
        method: 'tools/call',
        params: {
          name: 'remote_get_console_logs',
          arguments: {
            level: 'error',   // Only errors to reduce data
            limit: 10         // Limit number of logs
          }
        }
      },
      {
        name: 'Filtered Network Logs',
        method: 'tools/call',
        params: {
          name: 'remote_get_network_logs',
          arguments: {
            filter: {
              status: [400, 401, 403, 404, 500, 502, 503],  // Only errors
              resourceType: 'xhr'  // Only AJAX requests
            },
            limit: 20
          }
        }
      }
    ];

    for (const test of tests) {
      process.stdout.write(`  ${colors.cyan}${test.name}...${colors.reset} `);
      
      try {
        const startTime = Date.now();
        const result = await this.callMCPMethod(test.method, test.params);
        const duration = Date.now() - startTime;
        
        if (result.error) {
          console.log(`${colors.yellow}⚠ ${result.error.message} (${duration}ms)${colors.reset}`);
        } else {
          console.log(`${colors.green}✓ Success (${duration}ms)${colors.reset}`);
          
          // Log resource usage if available
          if (result.result?.resourceUsage) {
            console.log(`    Memory: ${result.result.resourceUsage.memory || 'N/A'}`);
            console.log(`    CPU: ${result.result.resourceUsage.cpu || 'N/A'}`);
          }
        }
        
        this.results.push({
          test: test.name,
          success: !result.error,
          duration: duration
        });
      } catch (error) {
        console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
        this.results.push({
          test: test.name,
          success: false,
          error: error.message
        });
      }
    }
  }

  async testBatchOperations() {
    console.log(`\n${colors.bold}${colors.blue}Batch Operation Tests:${colors.reset}`);
    
    // Test batch processing to reduce overhead
    const batchTest = {
      name: 'Batch Triage Report',
      method: 'tools/call',
      params: {
        name: 'remote_generate_triage_report',
        arguments: {
          includeScreenshot: false,  // Disable heavy operations
          includeLogs: true,
          includeNetworkAnalysis: true,
          includePerformanceAudit: false  // Skip Lighthouse for speed
        }
      }
    };

    process.stdout.write(`  ${colors.cyan}${batchTest.name}...${colors.reset} `);
    
    try {
      const startTime = Date.now();
      const result = await this.callMCPMethod(batchTest.method, batchTest.params);
      const duration = Date.now() - startTime;
      
      if (result.error) {
        console.log(`${colors.yellow}⚠ ${result.error.message} (${duration}ms)${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Generated in ${duration}ms${colors.reset}`);
        
        if (result.result?.report) {
          const report = result.result.report;
          console.log(`    Sections: ${Object.keys(report).length}`);
          console.log(`    Size: ${JSON.stringify(report).length} bytes`);
        }
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }

  async testConcurrentRequests() {
    console.log(`\n${colors.bold}${colors.yellow}Concurrent Request Tests:${colors.reset}`);
    
    const concurrentTests = [
      this.callMCPMethod('tools/list'),
      this.callMCPMethod('resources/list'),
      this.callMCPMethod('prompts/list')
    ];

    process.stdout.write(`  ${colors.cyan}Testing 3 concurrent requests...${colors.reset} `);
    
    try {
      const startTime = Date.now();
      const results = await Promise.all(concurrentTests);
      const duration = Date.now() - startTime;
      
      const allSuccess = results.every(r => !r.error);
      
      if (allSuccess) {
        console.log(`${colors.green}✓ All completed in ${duration}ms${colors.reset}`);
        console.log(`    Average: ${Math.round(duration / 3)}ms per request`);
      } else {
        const failed = results.filter(r => r.error).length;
        console.log(`${colors.yellow}⚠ ${failed}/3 failed (${duration}ms)${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }

  async testRateLimiting() {
    console.log(`\n${colors.bold}${colors.cyan}Rate Limiting Tests:${colors.reset}`);
    
    const requests = [];
    const numRequests = 5;
    
    process.stdout.write(`  ${colors.cyan}Sending ${numRequests} rapid requests...${colors.reset} `);
    
    for (let i = 0; i < numRequests; i++) {
      requests.push(
        this.makeRequest(`${BASE_URL}/health`, {
          auth: AUTH_TOKEN
        })
      );
    }
    
    try {
      const results = await Promise.all(requests);
      const rateLimited = results.filter(r => r.status === 429).length;
      const successful = results.filter(r => r.status === 200).length;
      
      if (rateLimited > 0) {
        console.log(`${colors.yellow}⚠ ${rateLimited}/${numRequests} rate limited${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ All ${successful} requests succeeded${colors.reset}`);
      }
      
      // Check if retry-after header is present
      const limitedResponse = results.find(r => r.status === 429);
      if (limitedResponse && limitedResponse.headers['retry-after']) {
        console.log(`    Retry-After: ${limitedResponse.headers['retry-after']}s`);
      }
    } catch (error) {
      console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    }
  }

  async generateReport() {
    console.log(`\n${colors.bold}${colors.blue}=== Test Summary ===${colors.reset}`);
    
    const totalTests = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const avgDuration = this.results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / totalTests || 0;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
    console.log(`${colors.red}Failed: ${totalTests - successful}${colors.reset}`);
    console.log(`Average Duration: ${Math.round(avgDuration)}ms`);
    console.log(`Success Rate: ${((successful / totalTests) * 100).toFixed(1)}%`);
    
    // Resource optimization recommendations
    console.log(`\n${colors.bold}Optimization Recommendations:${colors.reset}`);
    console.log(`1. Use viewport-only screenshots when full page isn't needed`);
    console.log(`2. Filter console logs by error level to reduce data transfer`);
    console.log(`3. Limit network log retrieval to failed requests only`);
    console.log(`4. Batch multiple operations into single triage reports`);
    console.log(`5. Implement client-side caching for repeated requests`);
    
    // Save report to file
    const reportPath = path.join(__dirname, 'browser-automation-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      statistics: {
        total: totalTests,
        successful: successful,
        failed: totalTests - successful,
        avgDuration: Math.round(avgDuration),
        successRate: ((successful / totalTests) * 100).toFixed(1) + '%'
      }
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n${colors.green}Report saved to: ${reportPath}${colors.reset}`);
  }

  async run() {
    console.log(`${colors.bold}${colors.blue}=== RapidTriageME Browser Automation Test ===${colors.reset}`);
    console.log(`Testing with resource optimization enabled\n`);
    
    // Check local browser connector
    const browserReady = await this.testLocalBrowserConnection();
    
    if (!browserReady) {
      console.log(`\n${colors.yellow}⚠ Some tests will fail without browser connector${colors.reset}`);
    }
    
    // Run test suites
    await this.testResourceOptimization();
    await this.testBatchOperations();
    await this.testConcurrentRequests();
    await this.testRateLimiting();
    
    // Generate report
    await this.generateReport();
  }
}

// Run the test suite
const tester = new BrowserAutomationTester();
tester.run().catch(console.error);