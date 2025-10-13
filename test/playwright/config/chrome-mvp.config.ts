import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Chrome MVP Test Configuration
 * Optimized for monetization feature testing and MVP validation
 */
export default defineConfig({
  testDir: '../tests/chrome-mvp',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporting for MVP validation
  reporter: [
    ['html', {
      outputFolder: '../reports/chrome-mvp-html',
      open: 'never'
    }],
    ['json', {
      outputFile: '../reports/chrome-mvp-results.json'
    }],
    ['list']
  ],

  use: {
    // Chrome-specific configuration
    baseURL: process.env.TEST_BASE_URL || 'https://rapidtriage.me',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Enhanced for Chrome DevTools testing
    extraHTTPHeaders: {
      'User-Agent': 'RapidTriageME-TestBot/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    },

    // Viewport optimized for desktop Chrome testing
    viewport: { width: 1920, height: 1080 },

    // Timeouts for complex operations
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Chrome-focused project configuration
  projects: [
    {
      name: 'chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        // Chrome-specific launch options for extension testing
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-dev-shm-usage'
          ],
          slowMo: process.env.CI ? 0 : 100,
        }
      },
    },
    {
      name: 'chrome-mobile',
      use: {
        ...devices['Pixel 5'],
        channel: 'chrome',
      },
    }
  ],

  // Global setup and teardown
  globalSetup: '../fixtures/global-setup.ts',
  globalTeardown: '../fixtures/global-teardown.ts',

  // Test output configuration
  outputDir: '../reports/test-results',

  // Enhanced timeout for complex Chrome operations
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});