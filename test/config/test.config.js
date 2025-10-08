/**
 * RapidTriageME Test Configuration
 * Central configuration for all test suites
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const config = {
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://rapidtriage.me',
    localUrl: 'http://localhost:3025',
    // Use the production token format for tests
    token: process.env.RAPIDTRIAGE_API_TOKEN || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8',
    timeout: 30000
  },

  // Browser Configuration
  browser: {
    headless: process.env.TEST_HEADLESS !== 'false',
    viewport: {
      width: 1280,
      height: 720
    },
    userAgent: 'RapidTriageME-Test/1.0'
  },

  // Extension Configuration
  extension: {
    path: './rapidtriage-extension',
    manifestVersion: 3,
    testUrls: [
      'https://www.google.com',
      'https://example.com',
      'https://rapidtriage.me'
    ]
  },

  // Test Data
  testData: {
    urls: {
      google: 'https://www.google.com',
      example: 'https://example.com',
      rapidtriage: 'https://rapidtriage.me'
    },
    screenshots: {
      testImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  },

  // Timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    api: 15000
  },

  // Reporting
  reporting: {
    outputDir: './test/reports',
    format: 'json',
    verbose: process.env.TEST_VERBOSE === 'true'
  },

  // Environment Detection
  environment: process.env.ENVIRONMENT || 'test',
  isCI: process.env.CI === 'true',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

// Helper functions
config.getApiUrl = function(endpoint) {
  // For tests, always use production unless explicitly running local
  const baseUrl = this.environment === 'development' && process.env.USE_LOCAL === 'true' 
    ? this.api.localUrl 
    : this.api.baseUrl;
  return `${baseUrl}${endpoint}`;
};

config.getHeaders = function(additionalHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.api.token}`,
    'X-Test-Suite': 'RapidTriageME',
    ...additionalHeaders
  };
};

module.exports = config;