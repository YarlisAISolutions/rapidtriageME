/**
 * Playwright Configuration for RapidTriageME Extension Tests
 */

const { defineConfig } = require("@playwright/test");
const path = require("path");

module.exports = defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.js",

  // Timeout settings
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  // Run tests in parallel
  fullyParallel: false, // Chrome extensions need serial execution
  workers: 1,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Reporter configuration
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/html-report" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  // Shared settings
  use: {
    // Browser settings
    headless: false, // Extensions require headed mode

    // Screenshots and videos
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",

    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Viewport
    viewport: { width: 1400, height: 900 },
  },

  // Output folder for test artifacts
  outputDir: "test-results",

  // Projects for different test types
  projects: [
    {
      name: "extension-tests",
      testMatch: "extension-test.spec.js",
    },
  ],
});
