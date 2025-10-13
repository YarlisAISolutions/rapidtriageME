import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global Setup for Chrome MVP Testing
 * Handles authentication, extension loading, and test environment preparation
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Chrome MVP Test Setup...');

  // Create necessary directories
  const reportsDir = path.join(__dirname, '../reports');
  const screenshotsDir = path.join(reportsDir, 'screenshots');
  const videosDir = path.join(reportsDir, 'videos');

  [reportsDir, screenshotsDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Launch Chrome for authentication setup
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Setup authentication state
  try {
    console.log('🔐 Setting up authentication...');

    const baseURL = process.env.TEST_BASE_URL || 'https://rapidtriage.me';
    await page.goto(baseURL);

    // Add authentication cookies/tokens
    const authToken = process.env.TEST_AUTH_TOKEN || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';
    await context.addCookies([{
      name: 'auth_token',
      value: authToken,
      domain: new URL(baseURL).hostname,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    }]);

    // Save authentication state
    await context.storageState({
      path: path.join(__dirname, 'auth-state.json')
    });

    console.log('✅ Authentication state saved');

    // Pre-warm critical endpoints
    console.log('🌡️  Pre-warming API endpoints...');
    const endpoints = ['/health', '/pricing', '/billing'];

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(`${baseURL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log(`✅ ${endpoint}: ${response.status()}`);
      } catch (error: any) {
        console.log(`⚠️  ${endpoint}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('🎉 Chrome MVP Test Setup Complete!');
}

export default globalSetup;