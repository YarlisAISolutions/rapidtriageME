/**
 * Playwright Configuration for RapidTriageME E2E Tests
 *
 * Tests automation capabilities against public scraper-friendly URLs
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: '../reports/playwright-report' }],
    ['json', { outputFile: '../reports/playwright-results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
    headless: true, // Run headless for CI/stability
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: '../reports/test-results',

  // Global timeout
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
