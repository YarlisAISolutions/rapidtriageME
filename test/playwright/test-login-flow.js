#!/usr/bin/env node

/**
 * Test actual login flow with test credentials
 */

const { chromium } = require('@playwright/test');

async function testLoginFlow() {
  console.log('🔐 Testing login flow with test credentials...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 500, // Slow down for visibility
    timeout: 30000
  });

  const testUsers = [
    {
      role: 'Free User',
      email: 'free@rapidtriage.me',
      password: 'FreeUser123!',
      expectedDashboard: true
    },
    {
      role: 'Pro User',
      email: 'pro@rapidtriage.me',
      password: 'ProUser123!',
      expectedDashboard: true
    },
    {
      role: 'Enterprise User',
      email: 'enterprise@rapidtriage.me',
      password: 'EnterpriseUser123!',
      expectedDashboard: true
    }
  ];

  try {
    for (const user of testUsers) {
      console.log(`Testing ${user.role}...`);
      console.log('─'.repeat(40));

      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // Navigate to login page
        console.log('  1. Navigating to login page...');
        await page.goto('https://rapidtriage.me/login', {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        // Fill login form
        console.log(`  2. Filling credentials for ${user.email}...`);
        await page.fill('input[name="email"], input[type="email"], #email', user.email);
        await page.fill('input[name="password"], input[type="password"], #password', user.password);

        // Submit form
        console.log('  3. Submitting login form...');
        await Promise.race([
          page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")'),
          page.waitForNavigation({ timeout: 10000 }).catch(() => {})
        ]);

        // Wait a bit for any redirects
        await page.waitForTimeout(2000);

        // Check where we ended up
        const currentURL = page.url();
        console.log(`  4. Current URL: ${currentURL}`);

        if (currentURL.includes('/dashboard') || currentURL.includes('/profile')) {
          console.log(`  ✅ ${user.role} logged in successfully!\n`);
        } else if (currentURL.includes('/login')) {
          // Check for error messages
          const errorMessage = await page.locator('.error, .alert, [role="alert"]').textContent().catch(() => null);
          if (errorMessage) {
            console.log(`  ⚠️ Login failed with error: ${errorMessage}\n`);
          } else {
            console.log(`  ⚠️ Still on login page - credentials may be invalid\n`);
          }
        } else {
          console.log(`  ℹ️ Redirected to: ${currentURL}\n`);
        }

        // Try to access profile page
        console.log('  5. Testing profile page access...');
        await page.goto('https://rapidtriage.me/profile', {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        const profileURL = page.url();
        if (profileURL.includes('/profile')) {
          // Check if profile data loaded
          const hasLoadingSpinner = await page.locator('.spinner, .loading').isVisible().catch(() => false);
          const hasProfileData = await page.locator('[data-section="personal"], .profile-section').isVisible().catch(() => false);

          if (hasLoadingSpinner) {
            console.log('  ⏳ Profile page showing loading spinner');
          }
          if (hasProfileData) {
            console.log('  ✅ Profile data visible');
          }

          // Take a screenshot for debugging
          await page.screenshot({
            path: `test-results/${user.role.replace(' ', '-').toLowerCase()}-profile.png`,
            fullPage: true
          });
          console.log(`  📸 Screenshot saved\n`);
        } else {
          console.log(`  ⚠️ Could not access profile page\n`);
        }

      } catch (error) {
        console.log(`  ❌ Error testing ${user.role}: ${error.message}\n`);
      } finally {
        await context.close();
      }
    }

    console.log('═'.repeat(50));
    console.log('Test Summary:');
    console.log('═'.repeat(50));
    console.log('✓ Tested login flow for multiple user roles');
    console.log('✓ Screenshots saved to test-results/');
    console.log('\nNote: If login fails, the test credentials may need to be');
    console.log('created in the system first, or the authentication');
    console.log('system may need additional configuration.');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Create test-results directory if it doesn't exist
const fs = require('fs');
const path = require('path');
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Run the test
testLoginFlow()
  .then(() => {
    console.log('\n🎉 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });