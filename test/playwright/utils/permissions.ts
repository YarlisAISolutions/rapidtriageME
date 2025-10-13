import { Page, expect } from '@playwright/test';
import { AuthHelper } from './auth';

export class PermissionTester {
  private auth: AuthHelper;

  constructor(private page: Page) {
    this.auth = new AuthHelper(page);
  }

  /**
   * Test if user can access a specific page
   */
  async canAccessPage(url: string, expectedStatus: 'allowed' | 'denied' = 'allowed') {
    await this.page.goto(url);

    if (expectedStatus === 'allowed') {
      // Should not redirect to login or show 403
      await expect(this.page).not.toHaveURL('/login');
      await expect(this.page).not.toHaveURL(/403|forbidden/);
      await expect(this.page.locator('text=403')).not.toBeVisible();
      await expect(this.page.locator('text=Forbidden')).not.toBeVisible();
    } else {
      // Should redirect to login or show 403
      const isLoginPage = this.page.url().includes('/login');
      const is403Page = this.page.url().includes('403') || this.page.url().includes('forbidden');
      const has403Text = await this.page.locator('text=403').isVisible() ||
                         await this.page.locator('text=Forbidden').isVisible();

      expect(isLoginPage || is403Page || has403Text).toBeTruthy();
    }
  }

  /**
   * Test if user can see specific UI elements
   */
  async canSeeElement(selector: string, shouldSee: boolean = true) {
    if (shouldSee) {
      await expect(this.page.locator(selector)).toBeVisible();
    } else {
      await expect(this.page.locator(selector)).not.toBeVisible();
    }
  }

  /**
   * Test if user can perform an action
   */
  async canPerformAction(action: () => Promise<void>, shouldSucceed: boolean = true) {
    try {
      await action();
      if (!shouldSucceed) {
        throw new Error('Action should have failed but succeeded');
      }
    } catch (error) {
      if (shouldSucceed) {
        throw error;
      }
      // Action failed as expected
    }
  }

  /**
   * Test API endpoint access
   */
  async canAccessAPI(endpoint: string, method: string = 'GET', shouldSucceed: boolean = true) {
    const response = await this.page.request[method.toLowerCase()](endpoint);

    if (shouldSucceed) {
      expect(response.status()).toBeLessThan(400);
    } else {
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }

    return response;
  }

  /**
   * Test CRUD operations
   */
  async testCRUDPermissions(resource: string, permissions: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  }) {
    const results = {
      create: false,
      read: false,
      update: false,
      delete: false
    };

    // Test Create
    if (permissions.create !== undefined) {
      try {
        await this.page.goto(`/${resource}/new`);
        await this.page.click('button:has-text("Create")');
        const hasError = await this.page.locator('text=Permission denied').isVisible();
        results.create = !hasError;
        expect(results.create).toBe(permissions.create);
      } catch (error) {
        results.create = false;
        if (permissions.create) throw error;
      }
    }

    // Test Read
    if (permissions.read !== undefined) {
      try {
        await this.page.goto(`/${resource}`);
        const hasError = await this.page.locator('text=Permission denied').isVisible();
        results.read = !hasError;
        expect(results.read).toBe(permissions.read);
      } catch (error) {
        results.read = false;
        if (permissions.read) throw error;
      }
    }

    // Test Update
    if (permissions.update !== undefined) {
      try {
        await this.page.goto(`/${resource}/1/edit`);
        const hasEditButton = await this.page.locator('button:has-text("Save")').isVisible();
        results.update = hasEditButton;
        expect(results.update).toBe(permissions.update);
      } catch (error) {
        results.update = false;
        if (permissions.update) throw error;
      }
    }

    // Test Delete
    if (permissions.delete !== undefined) {
      try {
        await this.page.goto(`/${resource}/1`);
        const hasDeleteButton = await this.page.locator('button:has-text("Delete")').isVisible();
        results.delete = hasDeleteButton;
        expect(results.delete).toBe(permissions.delete);
      } catch (error) {
        results.delete = false;
        if (permissions.delete) throw error;
      }
    }

    return results;
  }

  /**
   * Test workspace access levels
   */
  async testWorkspacePermissions(workspaceId: string, level: 'owner' | 'admin' | 'member' | 'viewer') {
    const permissions = {
      owner: { settings: true, invite: true, delete: true, edit: true, view: true },
      admin: { settings: true, invite: true, delete: false, edit: true, view: true },
      member: { settings: false, invite: false, delete: false, edit: true, view: true },
      viewer: { settings: false, invite: false, delete: false, edit: false, view: true }
    };

    const expectedPerms = permissions[level];

    await this.page.goto(`/workspace/${workspaceId}`);

    // Check settings access
    await this.canSeeElement('button:has-text("Settings")', expectedPerms.settings);

    // Check invite access
    await this.canSeeElement('button:has-text("Invite Members")', expectedPerms.invite);

    // Check delete access
    await this.canSeeElement('button:has-text("Delete Workspace")', expectedPerms.delete);

    // Check edit access
    if (expectedPerms.edit) {
      await this.canSeeElement('button:has-text("Edit")', true);
    }

    // Check view access (should always be true if they can access the page)
    await expect(this.page).not.toHaveURL('/403');
  }

  /**
   * Test subscription limits
   */
  async testSubscriptionLimits(plan: 'free' | 'starter' | 'pro' | 'enterprise') {
    const limits = {
      free: { projects: 1, apiKeys: 3, features: ['basic'] },
      starter: { projects: 5, apiKeys: 5, features: ['basic', 'workspace'] },
      pro: { projects: 25, apiKeys: 10, features: ['basic', 'workspace', 'analytics', 'audit'] },
      enterprise: { projects: -1, apiKeys: -1, features: ['all'] }
    };

    const planLimits = limits[plan];

    // Test project limits
    await this.page.goto('/projects');
    const projectCount = await this.page.locator('.project-card').count();

    if (planLimits.projects !== -1) {
      const canCreateNew = await this.page.locator('button:has-text("New Project")').isEnabled();
      expect(canCreateNew).toBe(projectCount < planLimits.projects);
    }

    // Test API key limits
    await this.page.goto('/settings/api-keys');
    const apiKeyCount = await this.page.locator('.api-key-row').count();

    if (planLimits.apiKeys !== -1) {
      const canCreateNewKey = await this.page.locator('button:has-text("Generate API Key")').isEnabled();
      expect(canCreateNewKey).toBe(apiKeyCount < planLimits.apiKeys);
    }

    // Test feature access
    if (!planLimits.features.includes('analytics') && !planLimits.features.includes('all')) {
      await this.canAccessPage('/analytics', 'denied');
    }

    if (!planLimits.features.includes('audit') && !planLimits.features.includes('all')) {
      await this.canAccessPage('/audit', 'denied');
    }
  }

  /**
   * Test organization role permissions
   */
  async testOrganizationRole(role: 'owner' | 'admin' | 'developer' | 'analyst' | 'viewer' | 'billing') {
    const rolePermissions = {
      owner: {
        billing: true,
        members: true,
        settings: true,
        delete: true,
        audit: true,
        impersonate: true
      },
      admin: {
        billing: false,
        members: true,
        settings: true,
        delete: false,
        audit: true,
        impersonate: false
      },
      developer: {
        billing: false,
        members: false,
        settings: false,
        delete: false,
        audit: false,
        impersonate: false
      },
      analyst: {
        billing: false,
        members: false,
        settings: false,
        delete: false,
        audit: false,
        impersonate: false
      },
      viewer: {
        billing: false,
        members: false,
        settings: false,
        delete: false,
        audit: false,
        impersonate: false
      },
      billing: {
        billing: true,
        members: false,
        settings: false,
        delete: false,
        audit: false,
        impersonate: false
      }
    };

    const perms = rolePermissions[role];

    // Test billing access
    await this.canAccessPage('/organization/billing', perms.billing ? 'allowed' : 'denied');

    // Test member management
    await this.canAccessPage('/organization/members', perms.members ? 'allowed' : 'denied');

    // Test settings access
    await this.canAccessPage('/organization/settings', perms.settings ? 'allowed' : 'denied');

    // Test organization deletion
    if (perms.delete) {
      await this.page.goto('/organization/settings');
      await this.canSeeElement('button:has-text("Delete Organization")', true);
    }

    // Test audit log access
    await this.canAccessPage('/organization/audit', perms.audit ? 'allowed' : 'denied');

    // Test impersonation capability
    if (perms.impersonate) {
      await this.page.goto('/organization/members');
      await this.canSeeElement('button[data-action="impersonate"]', true);
    }
  }
}