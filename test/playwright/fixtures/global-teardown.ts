import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global Teardown for Chrome MVP Testing
 * Cleanup and test result processing
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Chrome MVP Test Cleanup...');

  try {
    // Generate test summary
    const reportsDir = path.join(__dirname, '../reports');
    const resultsFile = path.join(reportsDir, 'chrome-mvp-results.json');

    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

      const summary = {
        timestamp: new Date().toISOString(),
        totalTests: results.stats?.total || 0,
        passed: results.stats?.expected || 0,
        failed: results.stats?.unexpected || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        browser: 'Chrome',
        environment: process.env.TEST_ENV || 'production'
      };

      // Write summary for CI/CD
      fs.writeFileSync(
        path.join(reportsDir, 'test-summary.json'),
        JSON.stringify(summary, null, 2)
      );

      console.log('📊 Test Summary Generated:');
      console.log(`   Total Tests: ${summary.totalTests}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    }

    // Cleanup temporary files
    const authStateFile = path.join(__dirname, 'auth-state.json');
    if (fs.existsSync(authStateFile)) {
      fs.unlinkSync(authStateFile);
      console.log('🗑️  Authentication state cleaned up');
    }

    // Archive screenshots if needed
    const screenshotsDir = path.join(reportsDir, 'screenshots');
    if (fs.existsSync(screenshotsDir)) {
      const screenshots = fs.readdirSync(screenshotsDir);
      console.log(`📸 ${screenshots.length} screenshots captured`);
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }

  console.log('✅ Chrome MVP Test Cleanup Complete!');
}

export default globalTeardown;