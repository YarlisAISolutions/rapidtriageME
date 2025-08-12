#!/usr/bin/env node

/**
 * Screenshot Capture Module for Test Results
 * Captures visual representations of test execution results
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

class TestScreenshotCapture {
  constructor(outputDir = './reports/screenshots') {
    this.outputDir = outputDir;
    this.browser = null;
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Capture a screenshot of test results
   * @param {Object} testCase - The test case object
   * @returns {Object} Screenshot metadata
   */
  async captureTestResult(testCase) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-${testCase.testNumber}-${testCase.status}-${timestamp}.png`;
    const filepath = path.join(this.outputDir, filename);
    
    // Create HTML representation of test result
    const html = this.generateTestResultHTML(testCase);
    const tempHtmlFile = path.join(this.outputDir, `temp-${timestamp}.html`);
    
    try {
      // Write temporary HTML file
      fs.writeFileSync(tempHtmlFile, html);
      
      // Use puppeteer or playwright if available, otherwise create placeholder
      const screenshotData = await this.captureHTMLScreenshot(tempHtmlFile, filepath);
      
      // Clean up temp file
      if (fs.existsSync(tempHtmlFile)) {
        fs.unlinkSync(tempHtmlFile);
      }
      
      return {
        path: filepath,
        filename: filename,
        url: `/screenshots/${filename}`,
        captured: new Date().toISOString(),
        testId: testCase.id,
        testName: testCase.name,
        status: testCase.status,
        size: screenshotData.size || 0
      };
    } catch (error) {
      console.error(`Failed to capture screenshot for test ${testCase.id}:`, error);
      return null;
    }
  }

  /**
   * Generate HTML representation of test result
   */
  generateTestResultHTML(testCase) {
    const statusColor = testCase.passed ? '#28a745' : '#dc3545';
    const statusText = testCase.passed ? 'PASSED' : 'FAILED';
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #e9ecef;
      margin-bottom: 20px;
    }
    .test-number {
      font-size: 24px;
      font-weight: bold;
      color: #6c757d;
    }
    .test-name {
      font-size: 20px;
      color: #2d3748;
      margin: 10px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: bold;
      color: white;
      background: ${statusColor};
      font-size: 14px;
    }
    .section {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .section-title {
      font-weight: 600;
      color: #495057;
      margin-bottom: 10px;
      font-size: 14px;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    .box {
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }
    .expected {
      border-left: 4px solid #17a2b8;
    }
    .actual {
      border-left: 4px solid ${statusColor};
    }
    .field {
      margin: 10px 0;
    }
    .label {
      font-weight: 600;
      color: #6c757d;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .value {
      color: #2d3748;
      font-size: 14px;
      padding: 6px 10px;
      background: #f8f9fa;
      border-radius: 4px;
      font-family: monospace;
    }
    .timestamp {
      color: #6c757d;
      font-size: 12px;
      text-align: right;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="test-number">Test #${testCase.testNumber}</div>
        <div class="test-name">${testCase.name}</div>
      </div>
      <div class="status-badge">${statusText}</div>
    </div>
    
    <div class="grid">
      <div class="box expected">
        <div class="section-title">🎯 Expected Result</div>
        <div class="field">
          <div class="label">Status Code</div>
          <div class="value">${testCase.expectedResult?.statusCode || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="label">Description</div>
          <div class="value">${testCase.expectedResult?.description || 'N/A'}</div>
        </div>
      </div>
      
      <div class="box actual">
        <div class="section-title">✅ Actual Result</div>
        <div class="field">
          <div class="label">Status Code</div>
          <div class="value">${testCase.actualResult?.statusCode || 'N/A'}</div>
        </div>
        <div class="field">
          <div class="label">Response Time</div>
          <div class="value">${testCase.duration}ms</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">📋 Test Details</div>
      <div class="field">
        <div class="label">Endpoint</div>
        <div class="value">${testCase.request?.method} ${testCase.request?.endpoint}</div>
      </div>
      <div class="field">
        <div class="label">Category</div>
        <div class="value">${testCase.category}</div>
      </div>
      <div class="field">
        <div class="label">Execution Time</div>
        <div class="value">${testCase.executionTime}</div>
      </div>
    </div>
    
    <div class="timestamp">
      Generated: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Initialize Puppeteer browser
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Close Puppeteer browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Capture screenshot of HTML file using Puppeteer
   */
  async captureHTMLScreenshot(htmlFile, outputPath) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set viewport for consistent screenshots
      await page.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 2
      });
      
      // Load the HTML file
      const fileUrl = `file://${path.resolve(htmlFile)}`;
      await page.goto(fileUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Take screenshot
      await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: 'png'
      });
      
      // Get screenshot info
      const stats = fs.statSync(outputPath);
      
      await page.close();
      
      return {
        size: stats.size,
        width: 1280,
        height: 800
      };
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      
      // Fallback to placeholder if Puppeteer fails
      const placeholderImage = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      fs.writeFileSync(outputPath, placeholderImage);
      
      return {
        size: placeholderImage.length,
        width: 1,
        height: 1
      };
    }
  }

  /**
   * Generate a summary screenshot of all test results
   */
  async generateSummaryScreenshot(testReport) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `summary-${timestamp}.png`;
    const filepath = path.join(this.outputDir, filename);
    
    const html = this.generateSummaryHTML(testReport);
    const tempHtmlFile = path.join(this.outputDir, `temp-summary-${timestamp}.html`);
    
    try {
      fs.writeFileSync(tempHtmlFile, html);
      await this.captureHTMLScreenshot(tempHtmlFile, filepath);
      
      if (fs.existsSync(tempHtmlFile)) {
        fs.unlinkSync(tempHtmlFile);
      }
      
      return {
        path: filepath,
        filename: filename,
        url: `/screenshots/${filename}`,
        captured: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to generate summary screenshot:', error);
      return null;
    }
  }

  generateSummaryHTML(testReport) {
    const successRate = ((testReport.statistics.passed / testReport.statistics.totalTests) * 100).toFixed(1);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #2d3748;
      margin-bottom: 30px;
      font-size: 28px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #6c757d;
      font-size: 14px;
    }
    .success { color: #28a745; }
    .danger { color: #dc3545; }
    .info { color: #17a2b8; }
    .warning { color: #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 RapidTriageME Test Results Summary</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value info">${testReport.statistics.totalTests}</div>
        <div class="stat-label">Total Tests</div>
      </div>
      <div class="stat-card">
        <div class="stat-value success">${testReport.statistics.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value danger">${testReport.statistics.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value warning">${successRate}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
    </div>
    
    <div style="text-align: center; color: #6c757d; margin-top: 30px;">
      Generated: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
  }
}

module.exports = TestScreenshotCapture;

// If run directly, demonstrate usage
if (require.main === module) {
  const capture = new TestScreenshotCapture();
  
  // Example test case
  const exampleTest = {
    id: 'test-1',
    testNumber: 1,
    name: 'User Registration',
    category: 'authentication',
    status: 'passed',
    passed: true,
    duration: 45,
    executionTime: new Date().toLocaleString(),
    request: {
      method: 'POST',
      endpoint: '/auth/register'
    },
    expectedResult: {
      statusCode: 201,
      description: 'User created successfully'
    },
    actualResult: {
      statusCode: 201,
      description: 'Request succeeded'
    }
  };
  
  capture.captureTestResult(exampleTest).then(async (result) => {
    if (result) {
      console.log('Screenshot captured:', result);
    }
    await capture.closeBrowser();
    process.exit(0);
  }).catch(async (error) => {
    console.error('Error:', error);
    await capture.closeBrowser();
    process.exit(1);
  });
}