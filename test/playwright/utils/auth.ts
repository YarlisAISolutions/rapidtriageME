import { Page, BrowserContext, expect } from '@playwright/test';
import users from '../fixtures/users.json';

export type UserRole = keyof typeof users.users;

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with username and password
   */
  async loginWithCredentials(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');

    // Wait for redirect after login
    await this.page.waitForURL(/\/(dashboard|profile)/, { timeout: 10000 });
  }

  /**
   * Login with a specific user role
   */
  async loginAs(role: UserRole) {
    const user = users.users[role];
    if (!user) {
      throw new Error(`User role ${role} not found`);
    }

    // Check if it's an API service account
    if (user.apiKey) {
      return this.authenticateWithApiKey(user.apiKey);
    }

    await this.loginWithCredentials(user.email, user.password);

    // Verify login was successful
    await expect(this.page).toHaveURL(/\/(dashboard|profile)/);

    // Store auth token
    const authToken = await this.page.evaluate(() => {
      return localStorage.getItem('rapidtriage_auth_token') ||
             sessionStorage.getItem('rapidtriage_auth_token');
    });

    return authToken;
  }

  /**
   * Authenticate with API key for service accounts
   */
  async authenticateWithApiKey(apiKey: string) {
    await this.page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${apiKey}`
    });
    return apiKey;
  }

  /**
   * Simulate Keycloak SSO login
   */
  async loginWithSSO(role: UserRole) {
    const user = users.users[role];
    if (!user) {
      throw new Error(`User role ${role} not found`);
    }

    // Navigate to SSO login
    await this.page.goto('/login');
    await this.page.click('button:has-text("Login with SSO")');

    // Wait for Keycloak redirect
    await this.page.waitForURL(/auth\.yarlis\.ai/, { timeout: 10000 });

    // Fill Keycloak login form
    await this.page.fill('input[name="username"]', user.email);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.click('input[type="submit"]');

    // Wait for redirect back to app
    await this.page.waitForURL(/rapidtriage\.me/, { timeout: 10000 });
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.goto('/');

    // Clear session storage and local storage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to ensure logout
    await this.page.goto('/login');
    await expect(this.page).toHaveURL('/login');
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    return await this.page.evaluate(() => {
      const userStr = localStorage.getItem('rapidtriage_user');
      return userStr ? JSON.parse(userStr) : null;
    });
  }

  /**
   * Check if user has permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    if (!user) return false;

    const userRole = user.role || user.organizationRole;
    const userData = Object.values(users.users).find(u => u.role === userRole);

    if (!userData) return false;

    // Check for wildcard permission
    if (userData.permissions.includes('*')) return true;

    // Check for exact permission
    if (userData.permissions.includes(permission)) return true;

    // Check for wildcard in permission category
    const [category] = permission.split(':');
    if (userData.permissions.includes(`${category}:*`)) return true;

    return false;
  }

  /**
   * Impersonate another user (admin only)
   */
  async impersonateUser(targetEmail: string) {
    // Navigate to admin panel
    await this.page.goto('/admin/users');

    // Search for user
    await this.page.fill('input[name="search"]', targetEmail);
    await this.page.press('input[name="search"]', 'Enter');

    // Click impersonate button
    await this.page.click(`button[data-email="${targetEmail}"][data-action="impersonate"]`);

    // Confirm impersonation
    await this.page.click('button:has-text("Confirm Impersonation")');

    // Wait for redirect
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
  }

  /**
   * Setup 2FA for current user
   */
  async setup2FA() {
    await this.page.goto('/profile');
    await this.page.click('button[data-tab="security"]');
    await this.page.click('input[id="twoFactorToggle"]');

    // Get QR code or secret
    const secret = await this.page.textContent('.two-factor-secret');

    // In real tests, you would use an authenticator library
    // For now, we'll use a mock code
    await this.page.fill('input[name="verificationCode"]', '123456');
    await this.page.click('button:has-text("Verify and Enable")');

    return secret;
  }
}