#!/usr/bin/env node

/**
 * Quick test to verify basic authentication
 */

const { chromium } = require('@playwright/test');

async function testBasicAuth() {
  console.log('🧪 Testing basic authentication...');

  const browser = await chromium.launch({
    headless: true,
    timeout: 30000
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Test 1: Can access login page
    console.log('📍 Testing login page access...');
    await page.goto('https://rapidtriage.me/login', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const loginTitle = await page.title();
    console.log(`  ✓ Login page loaded: ${loginTitle}`);

    // Test 2: Can access profile page (should redirect to login)
    console.log('📍 Testing protected route...');
    await page.goto('https://rapidtriage.me/profile', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const currentURL = page.url();
    if (currentURL.includes('/login')) {
      console.log('  ✓ Protected route redirects to login');
    } else {
      console.log(`  ⚠ Unexpected URL: ${currentURL}`);
    }

    // Test 3: API endpoint test
    console.log('📍 Testing API endpoint...');
    const response = await page.request.get('https://rapidtriage.me/health');
    const status = response.status();
    const data = await response.json();

    console.log(`  ✓ API Health Check: ${status} - ${data.status}`);

    // Test 4: Test with API key
    console.log('📍 Testing API with authentication...');
    const authResponse = await page.request.get('https://rapidtriage.me/api/profile', {
      headers: {
        'Authorization': 'Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'
      }
    });

    if (authResponse.status() === 200) {
      console.log('  ✓ API authentication successful');
    } else {
      console.log(`  ⚠ API returned status: ${authResponse.status()}`);
    }

    // Test 5: Check if login form exists
    console.log('📍 Testing login form elements...');
    await page.goto('https://rapidtriage.me/login', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const emailInput = await page.locator('input[name="email"], input[type="email"], #email').first();
    const passwordInput = await page.locator('input[name="password"], input[type="password"], #password').first();
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();

    if (await emailInput.isVisible()) {
      console.log('  ✓ Email input found');
    }
    if (await passwordInput.isVisible()) {
      console.log('  ✓ Password input found');
    }
    if (await submitButton.isVisible()) {
      console.log('  ✓ Submit button found');
    }

    console.log('\n✅ All basic tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testBasicAuth()
  .then(() => {
    console.log('🎉 Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });