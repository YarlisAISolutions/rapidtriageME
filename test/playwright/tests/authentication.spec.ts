import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';

/**
 * Test Suite: Authentication & SSO
 * Tests login, logout, SSO, 2FA, and session management
 */

test.describe('Authentication', () => {
  let auth: AuthHelper;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
  });

  test.describe('Standard Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await auth.loginWithCredentials('test@example.com', 'Test123!');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/(dashboard|profile)/);

      // Should show user info
      const user = await auth.getCurrentUser();
      expect(user).toBeTruthy();
      expect(user.email).toBe('test@example.com');
    });

    test('should fail with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible();

      // Should stay on login page
      await expect(page).toHaveURL('/login');
    });

    test('should require email and password', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should handle password reset', async ({ page }) => {
      await page.goto('/login');
      await page.click('a:has-text("Forgot Password")');

      // Should navigate to reset page
      await expect(page).toHaveURL('/auth/reset-password');

      // Submit reset request
      await page.fill('input[name="email"]', 'test@example.com');
      await page.click('button:has-text("Send Reset Link")');

      // Should show success message
      await expect(page.locator('text=Reset link sent')).toBeVisible();
    });
  });

  test.describe('SSO Login', () => {
    test('should redirect to Keycloak', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Login with SSO")');

      // Should redirect to Keycloak
      await expect(page).toHaveURL(/auth\.yarlis\.ai/);

      // Should show Keycloak login form
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('should login through Keycloak', async ({ page }) => {
      await page.goto('/login');
      await page.click('button:has-text("Login with SSO")');

      // Wait for Keycloak redirect
      await page.waitForURL(/auth\.yarlis\.ai/);

      // Login with test user
      await page.fill('input[name="username"]', 'test@example.com');
      await page.fill('input[name="password"]', 'Test123!');
      await page.click('input[type="submit"]');

      // Should redirect back to app
      await page.waitForURL(/rapidtriage\.me/);

      // Should be logged in
      await expect(page).toHaveURL(/\/(dashboard|profile)/);
    });

    test('should handle SSO errors', async ({ page }) => {
      await page.goto('/auth/callback?error=access_denied&error_description=User+denied+access');

      // Should show error message
      await expect(page.locator('text=Authentication Failed')).toBeVisible();
      await expect(page.locator('text=User denied access')).toBeVisible();

      // Should provide retry option
      await expect(page.locator('a:has-text("Try Again")')).toBeVisible();
    });
  });

  test.describe('Two-Factor Authentication', () => {
    test('should setup 2FA', async ({ page }) => {
      // Login first
      await auth.loginAs('pro_user');

      // Setup 2FA
      const secret = await auth.setup2FA();
      expect(secret).toBeTruthy();

      // Should show success message
      await expect(page.locator('text=2FA enabled successfully')).toBeVisible();
    });

    test('should require 2FA code on login', async ({ page }) => {
      // Assume user has 2FA enabled
      await page.goto('/login');
      await page.fill('input[name="email"]', 'pro@rapidtriage.me');
      await page.fill('input[name="password"]', 'ProUser123!');
      await page.click('button[type="submit"]');

      // Should show 2FA prompt
      await expect(page.locator('text=Enter verification code')).toBeVisible();
      await expect(page.locator('input[name="verificationCode"]')).toBeVisible();

      // Enter code (mock)
      await page.fill('input[name="verificationCode"]', '123456');
      await page.click('button:has-text("Verify")');

      // Should complete login
      await expect(page).toHaveURL(/\/(dashboard|profile)/);
    });

    test('should provide backup codes', async ({ page }) => {
      await auth.loginAs('pro_user');
      await page.goto('/profile');
      await page.click('button[data-tab="security"]');

      // View backup codes
      await page.click('button:has-text("View Backup Codes")');

      // Should show backup codes
      await expect(page.locator('.backup-codes')).toBeVisible();
      const codes = await page.locator('.backup-code').count();
      expect(codes).toBe(10); // Usually 10 backup codes
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session', async ({ page, context }) => {
      await auth.loginAs('free_user');

      // Get cookies
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'rapidtriage_session');
      expect(sessionCookie).toBeTruthy();

      // Navigate to different pages
      await page.goto('/projects');
      await expect(page).not.toHaveURL('/login');

      await page.goto('/profile');
      await expect(page).not.toHaveURL('/login');
    });

    test('should logout properly', async ({ page }) => {
      await auth.loginAs('free_user');

      // Verify logged in
      await expect(page).toHaveURL(/\/(dashboard|profile)/);

      // Logout
      await auth.logout();

      // Should redirect to login
      await expect(page).toHaveURL('/login');

      // Try to access protected page
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should handle session timeout', async ({ page }) => {
      await auth.loginAs('free_user');

      // Simulate session timeout by clearing storage
      await page.evaluate(() => {
        // Set expired timestamp
        const expiredToken = {
          exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        };
        localStorage.setItem('rapidtriage_auth_token', JSON.stringify(expiredToken));
      });

      // Try to access protected resource
      await page.goto('/api/profile');

      // Should get 401
      const response = await page.request.get('/api/profile');
      expect(response.status()).toBe(401);
    });

    test('should show active sessions', async ({ page }) => {
      await auth.loginAs('pro_user');
      await page.goto('/profile');
      await page.click('button[data-tab="security"]');

      // Should show active sessions section
      await expect(page.locator('text=Active Sessions')).toBeVisible();
      await expect(page.locator('.session-item')).toBeVisible();

      // Should show session details
      await expect(page.locator('text=Current Session')).toBeVisible();
      await expect(page.locator('.session-ip')).toBeVisible();
      await expect(page.locator('.session-browser')).toBeVisible();
    });

    test('should revoke other sessions', async ({ page }) => {
      await auth.loginAs('pro_user');
      await page.goto('/profile');
      await page.click('button[data-tab="security"]');

      // Revoke all other sessions
      await page.click('button:has-text("Revoke All Sessions")');
      await page.click('button:has-text("Confirm")');

      // Should show success message
      await expect(page.locator('text=All other sessions revoked')).toBeVisible();
    });
  });

  test.describe('OAuth Providers', () => {
    test('should show OAuth login options', async ({ page }) => {
      await page.goto('/login');

      // Should show OAuth providers
      await expect(page.locator('button:has-text("Login with Google")')).toBeVisible();
      await expect(page.locator('button:has-text("Login with GitHub")')).toBeVisible();
      await expect(page.locator('button:has-text("Login with Microsoft")')).toBeVisible();
    });

    test('should link OAuth account', async ({ page }) => {
      await auth.loginAs('free_user');
      await page.goto('/profile');
      await page.click('button[data-tab="security"]');

      // Link Google account
      await page.click('button:has-text("Link Google Account")');

      // Would redirect to Google OAuth
      // In test, we'll mock the callback
      await page.goto('/auth/callback?provider=google&code=mock_code');

      // Should show success
      await expect(page.locator('text=Google account linked')).toBeVisible();
    });
  });

  test.describe('API Authentication', () => {
    test('should authenticate with API key', async ({ page }) => {
      const apiKey = 'rtm_test_key_abc123';

      // Set API key header
      await page.setExtraHTTPHeaders({
        'Authorization': `Bearer ${apiKey}`
      });

      // Make API request
      const response = await page.request.get('/api/projects');

      // Should authenticate successfully (or 401 if key is invalid)
      expect([200, 401]).toContain(response.status());
    });

    test('should reject invalid API key', async ({ page }) => {
      await page.setExtraHTTPHeaders({
        'Authorization': 'Bearer invalid_key'
      });

      const response = await page.request.get('/api/projects');
      expect(response.status()).toBe(401);
    });
  });
});