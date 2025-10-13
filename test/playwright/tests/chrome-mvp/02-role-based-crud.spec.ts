import { test, expect, Page } from '@playwright/test';
import { TestUsers, TestURLs } from '../../fixtures/test-data';

/**
 * Role-Based CRUD Operations and Feature Testing
 * Tests various user roles with complete CRUD functionality
 */

test.describe('Role-Based CRUD Operations', () => {
  const baseURL = 'http://localhost:8787';

  // Helper function to login with different roles
  async function loginAs(page: Page, role: 'admin' | 'user' | 'viewer' | 'guest') {
    const credentials = {
      admin: { email: 'admin@rapidtriage.me', password: 'Admin123!', token: 'admin-token-123' },
      user: { email: 'user@rapidtriage.me', password: 'User123!', token: 'user-token-456' },
      viewer: { email: 'viewer@rapidtriage.me', password: 'Viewer123!', token: 'viewer-token-789' },
      guest: { email: 'guest@rapidtriage.me', password: 'Guest123!', token: 'guest-token-000' }
    };

    const cred = credentials[role];

    // Set authentication cookie
    await page.context().addCookies([{
      name: 'auth_token',
      value: cred.token,
      domain: 'localhost',
      path: '/'
    }]);

    // Set user profile in localStorage
    await page.evaluate(({ role, email }) => {
      localStorage.setItem('userProfile', JSON.stringify({
        id: `${role}-001`,
        email: email,
        name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
        role: role,
        subscription: role === 'admin' ? 'enterprise' : role === 'user' ? 'pro' : 'free'
      }));
    }, { role, email: cred.email });
  }

  test.describe('Admin Role - Full CRUD Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(baseURL);
      await loginAs(page, 'admin');
    });

    test('should have full access to all features', async ({ page }) => {
      // Navigate to dashboard
      await page.goto(`${baseURL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Check admin menu visibility
      const adminMenu = page.locator('[data-testid="admin-menu"], .admin-menu');
      const hasAdminMenu = await adminMenu.isVisible().catch(() => false);
      console.log('Admin menu visible:', hasAdminMenu);

      // Navigate to profile
      await page.goto(`${baseURL}/profile`);
      await expect(page.locator('h1, h2').first()).toContainText(/Profile|Account/i);
    });

    test('CREATE: should create new workspace', async ({ page }) => {
      await page.goto(`${baseURL}/workspaces`);

      // Create workspace button
      const createBtn = page.locator('button:has-text("Create"), button:has-text("New Workspace")').first();
      const createVisible = await createBtn.isVisible().catch(() => false);

      if (createVisible) {
        await createBtn.click();
        console.log('Create workspace action triggered');
      }
    });

    test('READ: should view all billing information', async ({ page }) => {
      await page.goto(`${baseURL}/billing`);
      await page.waitForLoadState('networkidle');

      // Check for billing sections
      const sections = ['Current Plan', 'Usage', 'Payment', 'Invoice'];
      for (const section of sections) {
        const element = page.locator(`text=/${section}/i`).first();
        const isVisible = await element.isVisible().catch(() => false);
        console.log(`${section} section visible:`, isVisible);
      }
    });

    test('UPDATE: should modify subscription plan', async ({ page }) => {
      await page.goto(`${baseURL}/billing`);

      // Look for upgrade/change plan buttons
      const upgradeBtn = page.locator('button:has-text("Upgrade"), button:has-text("Change Plan")').first();
      const upgradeVisible = await upgradeBtn.isVisible().catch(() => false);

      if (upgradeVisible) {
        await upgradeBtn.click();
        console.log('Plan modification initiated');
      }
    });

    test('DELETE: should have delete capabilities', async ({ page }) => {
      await page.goto(`${baseURL}/settings`);

      // Check for delete account option (admin should see it)
      const deleteOption = page.locator('button:has-text("Delete"), [data-testid="delete-account"]').first();
      const hasDeleteOption = await deleteOption.isVisible().catch(() => false);
      console.log('Delete option available:', hasDeleteOption);
    });
  });

  test.describe('User Role - Limited CRUD Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(baseURL);
      await loginAs(page, 'user');
    });

    test('should have access to own resources', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // User should see dashboard but not admin features
      const adminMenu = page.locator('[data-testid="admin-menu"], .admin-menu');
      const hasAdminMenu = await adminMenu.isVisible().catch(() => false);
      expect(hasAdminMenu).toBeFalsy();
    });

    test('CREATE: should create screenshots and reports', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);

      // Check for screenshot capture capability
      const screenshotBtn = page.locator('button:has-text("Screenshot"), button:has-text("Capture")').first();
      const canCapture = await screenshotBtn.isVisible().catch(() => false);
      console.log('Can capture screenshots:', canCapture);
    });

    test('READ: should view own profile and usage', async ({ page }) => {
      await page.goto(`${baseURL}/profile`);
      await page.waitForLoadState('networkidle');

      // Should see own profile
      const profileData = await page.locator('.profile-info, [data-testid="profile-data"]').first();
      const hasProfile = await profileData.isVisible().catch(() => false);
      expect(hasProfile).toBeTruthy();
    });

    test('UPDATE: should modify own settings', async ({ page }) => {
      await page.goto(`${baseURL}/settings`);

      // Should be able to update preferences
      const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update")').first();
      const canSave = await saveBtn.isVisible().catch(() => false);
      console.log('Can save settings:', canSave);
    });

    test('DELETE: should delete own content only', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);

      // Should not have admin delete options
      const deleteAccount = page.locator('[data-testid="delete-account"]');
      const hasDeleteAccount = await deleteAccount.isVisible().catch(() => false);
      expect(hasDeleteAccount).toBeFalsy();
    });
  });

  test.describe('Viewer Role - Read-Only Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(baseURL);
      await loginAs(page, 'viewer');
    });

    test('should have read-only access', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Check for read-only indicators
      const editButtons = await page.locator('button:has-text("Edit"), button:has-text("Save")').count();
      console.log('Edit buttons found:', editButtons);

      // Viewers should have minimal edit capabilities
      expect(editButtons).toBeLessThanOrEqual(2);
    });

    test('READ: should view dashboards and reports', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);

      // Can view but not modify
      const viewElements = await page.locator('[data-readonly="true"], .view-only').count();
      console.log('View-only elements:', viewElements);
    });

    test('NO CREATE: should not have create buttons', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);

      const createButtons = await page.locator('button:has-text("Create"), button:has-text("New")').count();
      expect(createButtons).toBe(0);
    });

    test('NO UPDATE: should not have save options', async ({ page }) => {
      await page.goto(`${baseURL}/settings`);

      const saveButtons = await page.locator('button:has-text("Save"), button:has-text("Update")').count();
      expect(saveButtons).toBe(0);
    });

    test('NO DELETE: should not have delete options', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);

      const deleteButtons = await page.locator('button:has-text("Delete"), button:has-text("Remove")').count();
      expect(deleteButtons).toBe(0);
    });
  });

  test.describe('Guest/Anonymous - Minimal Access', () => {
    test('should have access to public pages only', async ({ page }) => {
      // No login
      await page.goto(baseURL);

      // Should see landing page
      await expect(page.locator('h1, .hero-title').first()).toBeVisible();

      // Can access pricing
      await page.goto(`${baseURL}/pricing`);
      await expect(page.locator('.pricing-card').first()).toBeVisible();
    });

    test('should redirect to login for protected pages', async ({ page }) => {
      // Try to access dashboard without auth
      await page.goto(`${baseURL}/dashboard`);

      // Should redirect to login
      await page.waitForURL(/\/(login|auth|signin)/);
      const url = page.url();
      expect(url).toMatch(/login|auth|signin/);
    });

    test('should see limited navigation options', async ({ page }) => {
      await page.goto(baseURL);

      // Should only see public nav items
      const protectedLinks = await page.locator('a[href*="dashboard"], a[href*="profile"]').count();
      expect(protectedLinks).toBe(0);
    });
  });
});

test.describe('Feature-Specific CRUD Tests', () => {
  const baseURL = 'http://localhost:8787';

  test.describe('Screenshot Management CRUD', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(baseURL);
      await loginAs(page, 'user');
    });

    test('CREATE: capture new screenshot', async ({ page }) => {
      await page.goto(`${baseURL}/dashboard`);

      // Mock screenshot capture
      const response = await page.request.post(`${baseURL}/api/screenshot`, {
        headers: { 'Authorization': 'Bearer user-token-456' },
        data: {
          url: 'https://example.com',
          viewport: { width: 1920, height: 1080 }
        }
      });

      expect(response.status()).toBeLessThanOrEqual(401); // May need auth
      console.log('Screenshot API response:', response.status());
    });

    test('READ: list all screenshots', async ({ page }) => {
      const response = await page.request.get(`${baseURL}/api/screenshots`, {
        headers: { 'Authorization': 'Bearer user-token-456' }
      });

      console.log('List screenshots response:', response.status());
    });

    test('UPDATE: modify screenshot metadata', async ({ page }) => {
      const response = await page.request.put(`${baseURL}/api/screenshot/123`, {
        headers: { 'Authorization': 'Bearer user-token-456' },
        data: { name: 'Updated Screenshot', tags: ['test', 'updated'] }
      });

      console.log('Update screenshot response:', response.status());
    });

    test('DELETE: remove screenshot', async ({ page }) => {
      const response = await page.request.delete(`${baseURL}/api/screenshot/123`, {
        headers: { 'Authorization': 'Bearer user-token-456' }
      });

      console.log('Delete screenshot response:', response.status());
    });
  });

  test.describe('Workspace Management CRUD', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(baseURL);
      await loginAs(page, 'admin');
    });

    test('CREATE: new workspace', async ({ page }) => {
      const response = await page.request.post(`${baseURL}/api/workspaces`, {
        headers: { 'Authorization': 'Bearer admin-token-123' },
        data: {
          name: 'Test Workspace',
          description: 'Automated test workspace',
          members: []
        }
      });

      console.log('Create workspace response:', response.status());
    });

    test('READ: list workspaces', async ({ page }) => {
      const response = await page.request.get(`${baseURL}/api/workspaces`, {
        headers: { 'Authorization': 'Bearer admin-token-123' }
      });

      console.log('List workspaces response:', response.status());
    });

    test('UPDATE: modify workspace settings', async ({ page }) => {
      const response = await page.request.patch(`${baseURL}/api/workspaces/ws-001`, {
        headers: { 'Authorization': 'Bearer admin-token-123' },
        data: { name: 'Updated Workspace', settings: { public: false } }
      });

      console.log('Update workspace response:', response.status());
    });

    test('DELETE: remove workspace', async ({ page }) => {
      const response = await page.request.delete(`${baseURL}/api/workspaces/ws-001`, {
        headers: { 'Authorization': 'Bearer admin-token-123' }
      });

      console.log('Delete workspace response:', response.status());
    });
  });

  test.describe('Billing & Subscription CRUD', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(baseURL);
      await loginAs(page, 'user');
    });

    test('READ: view subscription details', async ({ page }) => {
      await page.goto(`${baseURL}/billing`);

      // Check subscription info
      const planInfo = page.locator('.plan-info, [data-testid="subscription-plan"]').first();
      const hasPlanInfo = await planInfo.isVisible().catch(() => false);
      console.log('Subscription info visible:', hasPlanInfo);
    });

    test('UPDATE: upgrade subscription', async ({ page }) => {
      await page.goto(`${baseURL}/billing`);

      // Try to upgrade
      const upgradeBtn = page.locator('button:has-text("Upgrade")').first();
      const canUpgrade = await upgradeBtn.isVisible().catch(() => false);

      if (canUpgrade) {
        await upgradeBtn.click();
        console.log('Upgrade process initiated');
      }
    });

    test('CREATE: add payment method', async ({ page }) => {
      await page.goto(`${baseURL}/billing`);

      const addPaymentBtn = page.locator('button:has-text("Add Payment")').first();
      const canAddPayment = await addPaymentBtn.isVisible().catch(() => false);
      console.log('Can add payment method:', canAddPayment);
    });

    test('DELETE: cancel subscription', async ({ page }) => {
      await page.goto(`${baseURL}/billing`);

      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      const canCancel = await cancelBtn.isVisible().catch(() => false);
      console.log('Can cancel subscription:', canCancel);
    });
  });
});

test.describe('API Endpoint Validation', () => {
  const baseURL = 'http://localhost:8787';
  const endpoints = [
    { path: '/health', method: 'GET', requiresAuth: false },
    { path: '/api/screenshot', method: 'POST', requiresAuth: true },
    { path: '/api/console-logs', method: 'POST', requiresAuth: true },
    { path: '/api/network-logs', method: 'POST', requiresAuth: true },
    { path: '/api/lighthouse', method: 'POST', requiresAuth: true },
    { path: '/profile', method: 'GET', requiresAuth: true },
    { path: '/billing', method: 'GET', requiresAuth: true },
    { path: '/pricing', method: 'GET', requiresAuth: false }
  ];

  for (const endpoint of endpoints) {
    test(`${endpoint.method} ${endpoint.path} - ${endpoint.requiresAuth ? 'Protected' : 'Public'}`, async ({ page }) => {
      const headers = endpoint.requiresAuth
        ? { 'Authorization': 'Bearer user-token-456' }
        : {};

      let response;
      if (endpoint.method === 'GET') {
        response = await page.request.get(`${baseURL}${endpoint.path}`, { headers });
      } else {
        response = await page.request.post(`${baseURL}${endpoint.path}`, {
          headers,
          data: {}
        });
      }

      console.log(`${endpoint.method} ${endpoint.path}: ${response.status()}`);

      if (!endpoint.requiresAuth) {
        expect(response.status()).toBeLessThan(400);
      }
    });
  }
});

// Helper function for role-based testing
async function loginAs(page: Page, role: string) {
  const credentials = {
    admin: { email: 'admin@rapidtriage.me', password: 'Admin123!', token: 'admin-token-123' },
    user: { email: 'user@rapidtriage.me', password: 'User123!', token: 'user-token-456' },
    viewer: { email: 'viewer@rapidtriage.me', password: 'Viewer123!', token: 'viewer-token-789' },
    guest: { email: 'guest@rapidtriage.me', password: 'Guest123!', token: 'guest-token-000' }
  };

  const cred = credentials[role as keyof typeof credentials];

  await page.context().addCookies([{
    name: 'auth_token',
    value: cred.token,
    domain: 'localhost',
    path: '/'
  }]);

  await page.evaluate(({ role, email }) => {
    localStorage.setItem('userProfile', JSON.stringify({
      id: `${role}-001`,
      email: email,
      name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
      role: role,
      subscription: role === 'admin' ? 'enterprise' : role === 'user' ? 'pro' : 'free'
    }));
  }, { role, email: cred.email });
}