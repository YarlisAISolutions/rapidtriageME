import { test, expect } from '@playwright/test';
import { AuthHelper } from '../utils/auth';
import { PermissionTester } from '../utils/permissions';

/**
 * Test Suite: Organization Role Permissions
 * Tests access levels for Owner, Admin, Developer, Analyst, Viewer, and Billing roles
 */

test.describe('Organization Role Permissions', () => {
  let auth: AuthHelper;
  let permissions: PermissionTester;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelper(page);
    permissions = new PermissionTester(page);
  });

  test.afterEach(async () => {
    await auth.logout();
  });

  test.describe('Organization Owner', () => {
    test.beforeEach(async () => {
      await auth.loginAs('organization_owner');
    });

    test('should have full organization access', async ({ page }) => {
      await permissions.testOrganizationRole('owner');

      // Can delete organization
      await page.goto('/organization/settings');
      await expect(page.locator('button:has-text("Delete Organization")')).toBeVisible();
    });

    test('should impersonate other users', async ({ page }) => {
      await page.goto('/organization/members');

      // Find a user to impersonate
      const memberRow = page.locator('.member-row').first();
      await memberRow.locator('button[data-action="impersonate"]').click();

      // Confirm impersonation
      await page.click('button:has-text("Confirm Impersonation")');

      // Should see impersonation banner
      await expect(page.locator('.impersonation-banner')).toBeVisible();
      await expect(page.locator('text=Impersonating')).toBeVisible();

      // Can end impersonation
      await page.click('button:has-text("End Impersonation")');
      await expect(page.locator('.impersonation-banner')).not.toBeVisible();
    });

    test('should manage billing', async ({ page }) => {
      await page.goto('/organization/billing');

      // Can change payment method
      await expect(page.locator('button:has-text("Change Payment Method")')).toBeEnabled();

      // Can change subscription
      await expect(page.locator('button:has-text("Change Plan")')).toBeEnabled();

      // Can view invoices
      await page.click('tab:has-text("Invoices")');
      await expect(page.locator('.invoice-row')).toBeVisible();

      // Can download invoices
      await expect(page.locator('button:has-text("Download")')).toBeEnabled();
    });

    test('should transfer ownership', async ({ page }) => {
      await page.goto('/organization/settings');

      // Can transfer ownership
      await page.click('button:has-text("Transfer Ownership")');

      // Select new owner
      await page.selectOption('select[name="newOwner"]', 'admin@rapidtriage.me');

      // Confirm transfer
      await page.fill('input[name="confirmText"]', 'TRANSFER');
      await page.click('button:has-text("Confirm Transfer")');

      // Should see confirmation
      await expect(page.locator('text=Ownership transfer initiated')).toBeVisible();
    });
  });

  test.describe('Organization Admin', () => {
    test.beforeEach(async () => {
      await auth.loginAs('organization_admin');
    });

    test('should manage teams and members', async ({ page }) => {
      await page.goto('/organization/teams');

      // Can create teams
      await page.click('button:has-text("Create Team")');
      await page.fill('input[name="teamName"]', 'Development Team');
      await page.click('button:has-text("Create")');
      await expect(page.locator('text=Team created')).toBeVisible();

      // Can add members to teams
      await page.click('.team-card:has-text("Development Team")');
      await page.click('button:has-text("Add Members")');
      await page.fill('input[name="memberEmail"]', 'developer@rapidtriage.me');
      await page.click('button:has-text("Add")');
    });

    test('should not access billing', async () => {
      await permissions.canAccessPage('/organization/billing', 'denied');
    });

    test('should not delete organization', async ({ page }) => {
      await page.goto('/organization/settings');
      await expect(page.locator('button:has-text("Delete Organization")')).not.toBeVisible();
    });

    test('should manage organization settings', async ({ page }) => {
      await page.goto('/organization/settings');

      // Can update organization details
      await page.fill('input[name="organizationName"]', 'Updated Org Name');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('text=Settings updated')).toBeVisible();

      // Can configure security settings
      await page.click('tab:has-text("Security")');
      await page.click('input[name="enforce2FA"]');
      await page.click('button:has-text("Save Security Settings")');
    });
  });

  test.describe('Organization Developer', () => {
    test.beforeEach(async () => {
      await auth.loginAs('organization_developer');
    });

    test('should manage projects', async ({ page }) => {
      await permissions.testCRUDPermissions('projects', {
        create: true,
        read: true,
        update: true,
        delete: true
      });
    });

    test('should access debug tools', async ({ page }) => {
      await page.goto('/debug');

      // Can use all debug features
      await expect(page.locator('button:has-text("Console Logs")')).toBeEnabled();
      await expect(page.locator('button:has-text("Network Logs")')).toBeEnabled();
      await expect(page.locator('button:has-text("Take Screenshot")')).toBeEnabled();
      await expect(page.locator('button:has-text("Execute JS")')).toBeEnabled();
    });

    test('should not manage teams', async () => {
      await permissions.canAccessPage('/organization/teams', 'denied');
    });

    test('should manage API keys', async ({ page }) => {
      await page.goto('/settings/api-keys');

      // Can create API keys
      await page.click('button:has-text("Generate API Key")');
      await page.fill('input[name="keyName"]', 'Dev API Key');
      await page.selectOption('select[name="keyPermissions"]', 'full');
      await page.click('button:has-text("Generate")');

      // Should see the generated key
      await expect(page.locator('.api-key-value')).toBeVisible();

      // Can revoke keys
      await page.click('button:has-text("Revoke")');
      await page.click('button:has-text("Confirm Revoke")');
      await expect(page.locator('text=Key revoked')).toBeVisible();
    });
  });

  test.describe('Organization Analyst', () => {
    test.beforeEach(async () => {
      await auth.loginAs('organization_analyst');
    });

    test('should access all analytics', async ({ page }) => {
      await page.goto('/analytics');

      // Can view all analytics
      await expect(page.locator('.analytics-dashboard')).toBeVisible();

      // Can create reports
      await page.click('button:has-text("Create Report")');
      await page.fill('input[name="reportName"]', 'Monthly Analysis');
      await page.click('button:has-text("Generate")');

      // Can export data
      await page.click('button:has-text("Export")');
      await page.selectOption('select[name="exportFormat"]', 'csv');
      await page.click('button:has-text("Download")');
    });

    test('should manage dashboards', async ({ page }) => {
      await page.goto('/dashboards');

      // Can create custom dashboards
      await page.click('button:has-text("New Dashboard")');
      await page.fill('input[name="dashboardName"]', 'Performance Dashboard');

      // Add widgets
      await page.click('button:has-text("Add Widget")');
      await page.selectOption('select[name="widgetType"]', 'chart');
      await page.click('button:has-text("Add")');

      // Save dashboard
      await page.click('button:has-text("Save Dashboard")');
      await expect(page.locator('text=Dashboard saved')).toBeVisible();
    });

    test('should not modify projects', async () => {
      await permissions.testCRUDPermissions('projects', {
        create: false,
        read: true,
        update: false,
        delete: false
      });
    });

    test('should schedule reports', async ({ page }) => {
      await page.goto('/reports');

      // Can schedule reports
      await page.click('button:has-text("Schedule Report")');
      await page.selectOption('select[name="frequency"]', 'weekly');
      await page.fill('input[name="recipients"]', 'team@rapidtriage.me');
      await page.click('button:has-text("Schedule")');
      await expect(page.locator('text=Report scheduled')).toBeVisible();
    });
  });

  test.describe('Organization Viewer', () => {
    test.beforeEach(async () => {
      await auth.loginAs('organization_viewer');
    });

    test('should have read-only access', async ({ page }) => {
      // Can view projects
      await page.goto('/projects');
      await expect(page.locator('.project-card')).toBeVisible();
      await expect(page.locator('button:has-text("New Project")')).not.toBeVisible();

      // Can view analytics
      await page.goto('/analytics');
      await expect(page.locator('.analytics-dashboard')).toBeVisible();
      await expect(page.locator('button:has-text("Export")')).not.toBeVisible();

      // Can view reports
      await page.goto('/reports');
      await expect(page.locator('.report-list')).toBeVisible();
      await expect(page.locator('button:has-text("Create Report")')).not.toBeVisible();
    });

    test('should not modify anything', async () => {
      await permissions.testCRUDPermissions('projects', {
        create: false,
        read: true,
        update: false,
        delete: false
      });

      await permissions.testCRUDPermissions('workspaces', {
        create: false,
        read: true,
        update: false,
        delete: false
      });
    });
  });

  test.describe('Organization Billing', () => {
    test.beforeEach(async () => {
      await auth.loginAs('organization_billing');
    });

    test('should manage all billing', async ({ page }) => {
      await page.goto('/organization/billing');

      // Can view and manage subscriptions
      await expect(page.locator('.subscription-details')).toBeVisible();
      await expect(page.locator('button:has-text("Change Plan")')).toBeEnabled();

      // Can manage payment methods
      await page.click('tab:has-text("Payment Methods")');
      await expect(page.locator('button:has-text("Add Payment Method")')).toBeEnabled();

      // Can view and download invoices
      await page.click('tab:has-text("Invoices")');
      await expect(page.locator('.invoice-row')).toBeVisible();
      await expect(page.locator('button:has-text("Download")')).toBeEnabled();

      // Can manage billing contacts
      await page.click('tab:has-text("Billing Contacts")');
      await page.click('button:has-text("Add Contact")');
      await page.fill('input[name="contactEmail"]', 'finance@company.com');
      await page.click('button:has-text("Add")');
    });

    test('should not access other features', async () => {
      // No project management
      await permissions.canAccessPage('/projects/new', 'denied');

      // No team management
      await permissions.canAccessPage('/organization/teams', 'denied');

      // No settings access
      await permissions.canAccessPage('/organization/settings', 'denied');
    });

    test('should export financial reports', async ({ page }) => {
      await page.goto('/organization/billing/reports');

      // Can generate financial reports
      await page.selectOption('select[name="reportType"]', 'annual');
      await page.click('button:has-text("Generate Report")');

      // Can export for accounting
      await page.click('button:has-text("Export for QuickBooks")');
      await expect(page.locator('text=Export generated')).toBeVisible();
    });
  });
});