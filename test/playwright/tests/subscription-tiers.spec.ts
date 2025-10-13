import { test, expect } from '@playwright/test';
import { AuthHelper, UserRole } from '../utils/auth';
import { PermissionTester } from '../utils/permissions';

/**
 * Test Suite: Subscription Tier Permissions
 * Tests access levels for Free, Starter, Pro, and Enterprise users
 */

test.describe('Subscription Tier Permissions', () => {
  let auth: AuthHelper;
  let permissions: PermissionTester;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    permissions = new PermissionTester(page);
  });

  test.afterEach(async () => {
    await auth.logout();
  });

  test.describe('Free Tier User', () => {
    test.beforeEach(async () => {
      await auth.loginAs('free_user');
    });

    test('should have limited project access', async ({ page }) => {
      await page.goto('/projects');

      // Can create only 1 project
      const projectCount = await page.locator('.project-card').count();
      if (projectCount === 0) {
        await expect(page.locator('button:has-text("New Project")')).toBeEnabled();
      } else {
        await expect(page.locator('button:has-text("New Project")')).toBeDisabled();
        await expect(page.locator('text=Project limit reached')).toBeVisible();
      }
    });

    test('should have limited API key access', async ({ page }) => {
      await page.goto('/settings/api-keys');

      // Can create max 3 API keys
      const keyCount = await page.locator('.api-key-row').count();
      if (keyCount >= 3) {
        await expect(page.locator('button:has-text("Generate API Key")')).toBeDisabled();
      }
    });

    test('should not access premium features', async () => {
      // No analytics access
      await permissions.canAccessPage('/analytics', 'denied');

      // No audit logs
      await permissions.canAccessPage('/audit', 'denied');

      // No workspace creation
      await permissions.canAccessPage('/workspaces/new', 'denied');

      // No team features
      await permissions.canAccessPage('/team', 'denied');
    });

    test('should see upgrade prompts', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page.locator('text=Upgrade to Pro')).toBeVisible();
      await expect(page.locator('.upgrade-banner')).toBeVisible();
    });
  });

  test.describe('Starter Tier User', () => {
    test.beforeEach(async () => {
      await auth.loginAs('starter_user');
    });

    test('should have 5 project limit', async ({ page }) => {
      await page.goto('/projects');
      await permissions.testSubscriptionLimits('starter');
    });

    test('should access workspace features', async ({ page }) => {
      await page.goto('/workspaces');
      await expect(page.locator('button:has-text("New Workspace")')).toBeEnabled();

      // Can create workspace
      await page.click('button:has-text("New Workspace")');
      await page.fill('input[name="workspaceName"]', 'Test Workspace');
      await page.click('button:has-text("Create")');
      await expect(page).toHaveURL(/\/workspace\//);
    });

    test('should not access advanced features', async () => {
      // No advanced analytics
      await permissions.canAccessPage('/analytics/advanced', 'denied');

      // No audit logs
      await permissions.canAccessPage('/audit', 'denied');

      // No SSO configuration
      await permissions.canAccessPage('/settings/sso', 'denied');
    });
  });

  test.describe('Pro Tier User', () => {
    test.beforeEach(async () => {
      await auth.loginAs('pro_user');
    });

    test('should have 25 project limit', async ({ page }) => {
      await page.goto('/projects');
      await permissions.testSubscriptionLimits('pro');
    });

    test('should access analytics', async ({ page }) => {
      await page.goto('/analytics');
      await expect(page).not.toHaveURL('/403');
      await expect(page.locator('h1:has-text("Analytics")')).toBeVisible();

      // Can view metrics
      await expect(page.locator('.metrics-chart')).toBeVisible();
      await expect(page.locator('.usage-stats')).toBeVisible();
    });

    test('should access audit logs', async ({ page }) => {
      await page.goto('/audit');
      await expect(page).not.toHaveURL('/403');
      await expect(page.locator('h1:has-text("Audit Logs")')).toBeVisible();

      // Can filter own audit logs
      await page.selectOption('select[name="filter"]', 'my-actions');
      await expect(page.locator('.audit-entry')).toBeVisible();
    });

    test('should manage team members in workspace', async ({ page }) => {
      await page.goto('/workspace/test-workspace/settings');

      // Can invite members
      await expect(page.locator('button:has-text("Invite Member")')).toBeEnabled();

      // Can change member roles
      await expect(page.locator('select[name="memberRole"]')).toBeEnabled();
    });

    test('should not access enterprise features', async () => {
      // No SSO configuration
      await permissions.canAccessPage('/settings/sso', 'denied');

      // No organization management
      await permissions.canAccessPage('/organization', 'denied');

      // No custom integrations
      await permissions.canAccessPage('/integrations/custom', 'denied');
    });
  });

  test.describe('Enterprise Tier User', () => {
    test.beforeEach(async () => {
      await auth.loginAs('enterprise_user');
    });

    test('should have unlimited resources', async ({ page }) => {
      await page.goto('/projects');

      // Always can create new projects
      await expect(page.locator('button:has-text("New Project")')).toBeEnabled();

      // No limit indicators
      await expect(page.locator('text=Unlimited')).toBeVisible();
    });

    test('should access SSO configuration', async ({ page }) => {
      await page.goto('/settings/sso');
      await expect(page).not.toHaveURL('/403');

      // Can configure SSO providers
      await expect(page.locator('button:has-text("Add SSO Provider")')).toBeEnabled();
      await expect(page.locator('input[name="samlEndpoint"]')).toBeVisible();
    });

    test('should manage organization', async ({ page }) => {
      await page.goto('/organization');
      await expect(page).not.toHaveURL('/403');

      // Can view organization dashboard
      await expect(page.locator('h1:has-text("Organization")')).toBeVisible();

      // Can manage teams
      await page.click('a:has-text("Teams")');
      await expect(page.locator('button:has-text("Create Team")')).toBeEnabled();
    });

    test('should access all analytics features', async ({ page }) => {
      await page.goto('/analytics/advanced');
      await expect(page).not.toHaveURL('/403');

      // Can create custom dashboards
      await expect(page.locator('button:has-text("Create Dashboard")')).toBeEnabled();

      // Can export data
      await expect(page.locator('button:has-text("Export Data")')).toBeEnabled();

      // Can schedule reports
      await expect(page.locator('button:has-text("Schedule Report")')).toBeEnabled();
    });

    test('should configure custom integrations', async ({ page }) => {
      await page.goto('/integrations');

      // Can add custom webhooks
      await expect(page.locator('button:has-text("Add Webhook")')).toBeEnabled();

      // Can configure API integrations
      await expect(page.locator('button:has-text("Configure API")')).toBeEnabled();
    });
  });

  test.describe('Subscription Upgrade Flow', () => {
    test('should upgrade from free to pro', async ({ page }) => {
      await auth.loginAs('free_user');

      // Navigate to billing
      await page.goto('/billing');

      // Click upgrade to pro
      await page.click('button:has-text("Upgrade to Pro")');

      // Fill payment details (mock)
      await page.fill('input[name="cardNumber"]', '4242424242424242');
      await page.fill('input[name="cardExpiry"]', '12/25');
      await page.fill('input[name="cardCVC"]', '123');

      // Confirm upgrade
      await page.click('button:has-text("Confirm Upgrade")');

      // Wait for success
      await expect(page.locator('text=Upgrade Successful')).toBeVisible();

      // Verify new permissions
      await page.goto('/analytics');
      await expect(page).not.toHaveURL('/403');
    });
  });
});