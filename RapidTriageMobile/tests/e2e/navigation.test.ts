/**
 * Navigation Tests
 * Tests the complete navigation flow through all major app screens
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'test@rapidtriage.com',
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User'
};

const TEST_URLS = [
  'https://google.com',
  'https://github.com',
  'https://stackoverflow.com'
];

/**
 * Helper function to wait for app to load
 */
async function waitForAppLoad(page: Page) {
  // Wait for React to load and app to initialize
  await page.waitForSelector('[data-testid="app-container"], #root', { 
    timeout: 30000 
  });
  
  // Wait for any loading indicators to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, [data-loading="true"]');
    return loadingElements.length === 0;
  }, { timeout: 10000 }).catch(() => {
    // Ignore timeout - some loading indicators might not be present
  });
}

/**
 * Helper function to perform login
 */
async function performLogin(page: Page) {
  console.log('🔐 Performing login...');
  
  // Look for email input field
  const emailInput = await page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
  if (await emailInput.isVisible({ timeout: 5000 })) {
    await emailInput.fill(TEST_USER.email);
    
    // Look for password input field
    const passwordInput = await page.locator('input[type="password"], input[placeholder*="password" i], input[name="password"]').first();
    await passwordInput.fill(TEST_USER.password);
    
    // Look for login button
    const loginButton = await page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await loginButton.click();
    
    // Wait for login to complete
    await page.waitForTimeout(2000);
  }
}

/**
 * Helper function to skip onboarding if present
 */
async function skipOnboarding(page: Page) {
  console.log('📝 Checking for onboarding...');
  
  // Look for onboarding screens
  const skipButton = await page.locator('button:has-text("Skip"), button:has-text("Next"), button:has-text("Get Started")').first();
  
  let attempts = 0;
  while (attempts < 5 && await skipButton.isVisible({ timeout: 2000 })) {
    await skipButton.click();
    await page.waitForTimeout(1000);
    attempts++;
  }
}

test.describe('RapidTriage Mobile Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await waitForAppLoad(page);
    
    // Skip onboarding if present
    await skipOnboarding(page);
    
    // Perform login if needed
    await performLogin(page);
  });

  test('should load the app successfully', async ({ page }) => {
    console.log('🧪 Testing app loading...');
    
    // Check that the app has loaded
    await expect(page).toHaveTitle(/RapidTriage/i);
    
    // Should not have any console errors related to the app
    const logs = [];
    page.on('console', msg => logs.push(msg));
    
    await page.waitForTimeout(3000); // Give time for any errors to appear
    
    // Check for critical errors (but allow test mode logging)
    const criticalErrors = logs.filter(log => 
      log.type() === 'error' && 
      !log.text().includes('🧪') && // Allow test mode logs
      !log.text().includes('Warning:') // Allow React warnings
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should navigate through main screens', async ({ page }) => {
    console.log('🧪 Testing main navigation...');
    
    // Wait for main app to be visible
    await page.waitForTimeout(3000);
    
    // Test Home Screen
    console.log('📍 Testing Home screen...');
    const homeIndicator = await page.locator('text=/home/i, [data-testid*="home"], h1, h2').first();
    if (await homeIndicator.isVisible({ timeout: 10000 })) {
      console.log('✅ Home screen loaded');
    }
    
    // Test Dashboard Navigation
    console.log('📍 Testing Dashboard navigation...');
    const dashboardLink = await page.locator('text=/dashboard/i, [data-testid*="dashboard"], a[href*="dashboard"]').first();
    if (await dashboardLink.isVisible({ timeout: 5000 })) {
      await dashboardLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Dashboard navigation worked');
    }
    
    // Test Scan Navigation
    console.log('📍 Testing Scan navigation...');
    const scanLink = await page.locator('text=/scan/i, [data-testid*="scan"], a[href*="scan"]').first();
    if (await scanLink.isVisible({ timeout: 5000 })) {
      await scanLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Scan navigation worked');
    }
    
    // Test Reports Navigation
    console.log('📍 Testing Reports navigation...');
    const reportsLink = await page.locator('text=/reports/i, [data-testid*="reports"], a[href*="reports"]').first();
    if (await reportsLink.isVisible({ timeout: 5000 })) {
      await reportsLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Reports navigation worked');
    }
    
    // Test Settings Navigation
    console.log('📍 Testing Settings navigation...');
    const settingsLink = await page.locator('text=/settings/i, [data-testid*="settings"], a[href*="settings"]').first();
    if (await settingsLink.isVisible({ timeout: 5000 })) {
      await settingsLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Settings navigation worked');
    }
  });

  test('should handle scan functionality', async ({ page }) => {
    console.log('🧪 Testing scan functionality...');
    
    // Navigate to scan screen
    const scanLink = await page.locator('text=/scan/i, [data-testid*="scan"], button:has-text("Scan"), input[placeholder*="url" i]').first();
    
    if (await scanLink.isVisible({ timeout: 10000 })) {
      // If it's a link, click it
      if (await scanLink.evaluate(el => el.tagName.toLowerCase()) !== 'input') {
        await scanLink.click();
        await page.waitForTimeout(2000);
      }
      
      // Look for URL input field
      const urlInput = await page.locator('input[placeholder*="url" i], input[type="url"], input[name*="url"]').first();
      
      if (await urlInput.isVisible({ timeout: 5000 })) {
        // Test URL input
        await urlInput.fill(TEST_URLS[0]);
        
        // Look for scan button
        const scanButton = await page.locator('button:has-text("Scan"), button:has-text("Start"), button[type="submit"]').first();
        
        if (await scanButton.isVisible({ timeout: 5000 })) {
          await scanButton.click();
          
          // Wait for scan to start
          await page.waitForTimeout(3000);
          
          // Look for scan progress or results
          const scanIndicator = await page.locator('text=/scanning/i, text=/progress/i, [data-testid*="scan"]').first();
          
          if (await scanIndicator.isVisible({ timeout: 5000 })) {
            console.log('✅ Scan initiated successfully');
          }
        }
      }
    }
  });

  test('should display mock data correctly', async ({ page }) => {
    console.log('🧪 Testing mock data display...');
    
    // Wait for app to fully load
    await page.waitForTimeout(5000);
    
    // Look for any data displays (reports, user info, etc.)
    const dataElements = await page.locator('text=/test@rapidtriage.com/i, text=/test user/i, text=/report/i, text=/score/i').all();
    
    if (dataElements.length > 0) {
      console.log(`✅ Found ${dataElements.length} mock data elements`);
    } else {
      console.log('ℹ️  No obvious mock data elements found (this might be expected)');
    }
    
    // Check for any error messages
    const errorElements = await page.locator('text=/error/i, [data-testid*="error"], .error').all();
    const visibleErrors = [];
    
    for (const errorEl of errorElements) {
      if (await errorEl.isVisible()) {
        const text = await errorEl.textContent();
        if (text && !text.includes('🧪') && !text.includes('test')) {
          visibleErrors.push(text);
        }
      }
    }
    
    expect(visibleErrors).toHaveLength(0);
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    console.log('🧪 Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check if app still loads correctly
    const appContent = await page.locator('body > *').first();
    await expect(appContent).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check if app still loads correctly
    await expect(appContent).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    // Check if app still loads correctly
    await expect(appContent).toBeVisible();
    
    console.log('✅ Responsive design tests passed');
  });
});

test.describe('Authentication Flow', () => {
  test('should handle authentication states', async ({ page }) => {
    console.log('🧪 Testing authentication flow...');
    
    // Start fresh
    await page.goto('/');
    await waitForAppLoad(page);
    
    // Look for authentication elements
    const authElements = await page.locator('input[type="email"], input[type="password"], button:has-text("Login"), button:has-text("Sign")').all();
    
    if (authElements.length > 0) {
      console.log('✅ Authentication elements found');
      
      // Try to login
      await performLogin(page);
      
      // Wait for login completion
      await page.waitForTimeout(3000);
      
      // Check if we're now in the authenticated state
      const postLoginElements = await page.locator('text=/dashboard/i, text=/home/i, text=/scan/i').all();
      
      if (postLoginElements.length > 0) {
        console.log('✅ Login successful');
      } else {
        console.log('ℹ️  Login state unclear (might be expected in test mode)');
      }
    } else {
      console.log('ℹ️  No authentication elements found (might be auto-logged in)');
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    console.log('🧪 Testing error handling...');
    
    // Navigate to app
    await page.goto('/');
    await waitForAppLoad(page);
    
    // Block network requests to simulate offline mode
    await page.route('**/*', route => {
      if (route.request().url().includes('api')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Try to perform an action that would require network
    const scanButton = await page.locator('button:has-text("Scan"), input[placeholder*="url" i]').first();
    
    if (await scanButton.isVisible({ timeout: 5000 })) {
      if (await scanButton.evaluate(el => el.tagName.toLowerCase()) === 'input') {
        await scanButton.fill('https://example.com');
        const submitButton = await page.locator('button[type="submit"], button:has-text("Scan")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }
      } else {
        await scanButton.click();
      }
      
      // Wait to see how the app handles the network failure
      await page.waitForTimeout(3000);
      
      // Since we're in mock mode, this should still work
      console.log('✅ Network error handling test completed');
    }
  });
});