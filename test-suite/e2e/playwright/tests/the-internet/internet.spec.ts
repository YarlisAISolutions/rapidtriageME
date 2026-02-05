/**
 * The Internet (Herokuapp) - E2E Automation Tests
 *
 * URL: https://the-internet.herokuapp.com
 * Use Case: Forms, authentication, UI flows
 *
 * Tests various automation capabilities:
 * - Form authentication
 * - Checkboxes manipulation
 * - Dropdown selection
 * - File upload/download
 * - Dynamic content
 * - Alert handling
 */

import { test, expect, Page } from '@playwright/test';
import { takeScreenshot, waitForElement, fillInput, safeClick } from '../../utils/helpers';
import { TEST_USERS } from '../../config/test-users';
import { getCredentials } from '../../config/secrets';

const BASE_URL = 'https://the-internet.herokuapp.com';

// Page helper class
class InternetPage {
  constructor(private page: Page) {}

  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  // Authentication
  async login(username: string, password: string): Promise<boolean> {
    await this.navigate('/login');
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');

    const flash = this.page.locator('#flash');
    const message = await flash.textContent() || '';
    return message.includes('You logged into a secure area');
  }

  async logout(): Promise<void> {
    await this.page.click('a[href="/logout"]');
    await this.page.waitForLoadState('networkidle');
  }

  // Checkboxes
  async getCheckboxStates(): Promise<boolean[]> {
    const checkboxes = this.page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    const states: boolean[] = [];

    for (let i = 0; i < count; i++) {
      states.push(await checkboxes.nth(i).isChecked());
    }

    return states;
  }

  async toggleCheckbox(index: number): Promise<void> {
    const checkbox = this.page.locator('input[type="checkbox"]').nth(index);
    await checkbox.click();
  }

  // Dropdown
  async selectDropdownOption(value: string): Promise<void> {
    await this.page.selectOption('#dropdown', value);
  }

  async getSelectedDropdownValue(): Promise<string> {
    return this.page.locator('#dropdown').inputValue();
  }

  // Dynamic content
  async getDynamicContent(): Promise<string[]> {
    const rows = this.page.locator('.row .large-10');
    const count = await rows.count();
    const content: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).textContent() || '';
      content.push(text.trim());
    }

    return content;
  }

  // Alerts
  async triggerAlert(): Promise<void> {
    await this.page.click('button[onclick="jsAlert()"]');
  }

  async triggerConfirm(): Promise<void> {
    await this.page.click('button[onclick="jsConfirm()"]');
  }

  async triggerPrompt(): Promise<void> {
    await this.page.click('button[onclick="jsPrompt()"]');
  }

  async getAlertResult(): Promise<string> {
    return await this.page.locator('#result').textContent() || '';
  }

  // Hovers
  async hoverOnFigure(index: number): Promise<string> {
    const figure = this.page.locator('.figure').nth(index);
    await figure.hover();
    const caption = figure.locator('.figcaption h5');
    await caption.waitFor({ state: 'visible' });
    return await caption.textContent() || '';
  }

  // Drag and Drop
  async dragAndDrop(sourceSelector: string, targetSelector: string): Promise<void> {
    await this.page.dragAndDrop(sourceSelector, targetSelector);
  }

  // Key Presses
  async pressKey(key: string): Promise<string> {
    await this.page.locator('#target').click();
    await this.page.keyboard.press(key);
    return await this.page.locator('#result').textContent() || '';
  }

  // Add/Remove Elements
  async addElement(): Promise<void> {
    await this.page.click('button[onclick="addElement()"]');
  }

  async removeElement(): Promise<void> {
    const deleteButton = this.page.locator('.added-manually').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    }
  }

  async getAddedElementCount(): Promise<number> {
    return this.page.locator('.added-manually').count();
  }
}

// ============================================
// TEST SUITE
// ============================================

test.describe('The Internet - Forms, Auth & UI Flows', () => {
  let internetPage: InternetPage;

  test.beforeEach(async ({ page }) => {
    internetPage = new InternetPage(page);
  });

  // Test for each user role
  for (const [roleName, user] of Object.entries(TEST_USERS)) {
    test.describe(`Role: ${roleName}`, () => {

      test(`[${roleName}] TC-INET-001: Form Authentication - Valid Login`, async ({ page }) => {
        const creds = getCredentials('theInternet');

        const success = await internetPage.login(creds.username, creds.password);

        // Take screenshot
        await takeScreenshot(page, `internet-login-success-${roleName}`);

        expect(success).toBe(true);
        expect(page.url()).toContain('/secure');

        // Logout
        await internetPage.logout();
        expect(page.url()).toContain('/login');

        console.log(`[${roleName}] Successfully authenticated and logged out`);
      });

      test(`[${roleName}] TC-INET-002: Form Authentication - Invalid Login`, async ({ page }) => {
        const success = await internetPage.login('wronguser', 'wrongpassword');

        // Take screenshot
        await takeScreenshot(page, `internet-login-failed-${roleName}`);

        expect(success).toBe(false);

        const flash = await page.locator('#flash').textContent();
        expect(flash).toContain('Your username is invalid');

        console.log(`[${roleName}] Invalid login correctly rejected`);
      });

      test(`[${roleName}] TC-INET-003: Checkboxes - Toggle State`, async ({ page }) => {
        await internetPage.navigate('/checkboxes');

        // Get initial states
        const initialStates = await internetPage.getCheckboxStates();
        console.log(`[${roleName}] Initial checkbox states:`, initialStates);

        // Toggle first checkbox
        await internetPage.toggleCheckbox(0);
        const afterToggle = await internetPage.getCheckboxStates();

        // Take screenshot
        await takeScreenshot(page, `internet-checkboxes-${roleName}`);

        expect(afterToggle[0]).not.toBe(initialStates[0]);

        console.log(`[${roleName}] Checkbox toggled: ${initialStates[0]} -> ${afterToggle[0]}`);
      });

      test(`[${roleName}] TC-INET-004: Dropdown Selection`, async ({ page }) => {
        await internetPage.navigate('/dropdown');

        // Select Option 1
        await internetPage.selectDropdownOption('1');
        let selected = await internetPage.getSelectedDropdownValue();
        expect(selected).toBe('1');

        // Select Option 2
        await internetPage.selectDropdownOption('2');
        selected = await internetPage.getSelectedDropdownValue();
        expect(selected).toBe('2');

        // Take screenshot
        await takeScreenshot(page, `internet-dropdown-${roleName}`);

        console.log(`[${roleName}] Dropdown selection working correctly`);
      });

      test(`[${roleName}] TC-INET-005: JavaScript Alerts`, async ({ page }) => {
        await internetPage.navigate('/javascript_alerts');

        // Handle regular alert
        page.on('dialog', async (dialog) => {
          expect(dialog.type()).toBe('alert');
          await dialog.accept();
        });

        await internetPage.triggerAlert();
        let result = await internetPage.getAlertResult();
        expect(result).toContain('You successfully clicked an alert');

        // Take screenshot
        await takeScreenshot(page, `internet-alerts-${roleName}`);

        console.log(`[${roleName}] JavaScript alerts handled correctly`);
      });

      test(`[${roleName}] TC-INET-006: Confirm Dialog`, async ({ page }) => {
        await internetPage.navigate('/javascript_alerts');

        // Accept confirm
        page.once('dialog', async (dialog) => {
          expect(dialog.type()).toBe('confirm');
          await dialog.accept();
        });

        await internetPage.triggerConfirm();
        let result = await internetPage.getAlertResult();
        expect(result).toContain('Ok');

        // Dismiss confirm
        page.once('dialog', async (dialog) => {
          await dialog.dismiss();
        });

        await internetPage.triggerConfirm();
        result = await internetPage.getAlertResult();
        expect(result).toContain('Cancel');

        await takeScreenshot(page, `internet-confirm-${roleName}`);

        console.log(`[${roleName}] Confirm dialogs handled correctly`);
      });

      test(`[${roleName}] TC-INET-007: Prompt Dialog`, async ({ page }) => {
        await internetPage.navigate('/javascript_alerts');

        const testText = `Test input from ${roleName}`;

        page.once('dialog', async (dialog) => {
          expect(dialog.type()).toBe('prompt');
          await dialog.accept(testText);
        });

        await internetPage.triggerPrompt();
        const result = await internetPage.getAlertResult();
        expect(result).toContain(testText);

        await takeScreenshot(page, `internet-prompt-${roleName}`);

        console.log(`[${roleName}] Prompt dialog input: "${testText}"`);
      });

      test(`[${roleName}] TC-INET-008: Mouse Hover`, async ({ page }) => {
        await internetPage.navigate('/hovers');

        // Hover on each figure
        const names: string[] = [];
        for (let i = 0; i < 3; i++) {
          const name = await internetPage.hoverOnFigure(i);
          names.push(name);
        }

        await takeScreenshot(page, `internet-hovers-${roleName}`);

        expect(names.length).toBe(3);
        expect(names[0]).toContain('user1');
        expect(names[1]).toContain('user2');
        expect(names[2]).toContain('user3');

        console.log(`[${roleName}] Hover revealed users:`, names);
      });

      test(`[${roleName}] TC-INET-009: Add/Remove Elements`, async ({ page }) => {
        await internetPage.navigate('/add_remove_elements/');

        // Add elements
        for (let i = 0; i < 3; i++) {
          await internetPage.addElement();
        }

        let count = await internetPage.getAddedElementCount();
        expect(count).toBe(3);

        await takeScreenshot(page, `internet-add-elements-${roleName}`);

        // Remove one
        await internetPage.removeElement();
        count = await internetPage.getAddedElementCount();
        expect(count).toBe(2);

        console.log(`[${roleName}] Added 3 elements, removed 1, remaining: ${count}`);
      });

      test(`[${roleName}] TC-INET-010: Key Presses`, async ({ page }) => {
        await internetPage.navigate('/key_presses');

        // Test various keys
        const keysToTest = ['a', 'Enter', 'Tab', 'Escape'];

        for (const key of keysToTest) {
          await page.locator('#target').click();
          await page.keyboard.press(key);
          const result = await page.locator('#result').textContent() || '';
          expect(result).toContain('You entered:');
        }

        await takeScreenshot(page, `internet-keypresses-${roleName}`);

        console.log(`[${roleName}] Key presses captured correctly`);
      });

    });
  }
});
