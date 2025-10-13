import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object Model
 * Provides common functionality for all page objects
 */
export abstract class BasePage {
  protected page: Page;
  protected baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.TEST_BASE_URL || 'https://rapidtriage.me';
  }

  // Common navigation methods
  async goto(path: string = ''): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path}`;
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  // Enhanced waiting for Chrome-specific elements
  async waitForElement(selector: string, timeout: number = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  // Screenshot capture with naming convention
  async captureScreenshot(name: string): Promise<Buffer> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return await this.page.screenshot({
      path: `test/playwright/reports/screenshots/chrome-${name}-${timestamp}.png`,
      fullPage: true
    });
  }

  // Chrome DevTools specific methods
  async enableDevTools(): Promise<void> {
    await this.page.keyboard.press('F12');
    await this.page.waitForTimeout(2000); // Allow DevTools to load
  }

  // Authentication helpers
  async authenticate(token?: string): Promise<void> {
    const authToken = token || process.env.TEST_AUTH_TOKEN || 'KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8';
    await this.page.context().addCookies([{
      name: 'auth_token',
      value: authToken,
      domain: new URL(this.baseURL).hostname,
      path: '/'
    }]);
  }

  // Performance monitoring
  async measurePageLoad(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  // Error detection helpers
  async checkForConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }
}