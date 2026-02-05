/**
 * Reusable Helper Methods
 *
 * Common utility functions for Playwright tests
 */

import { Page, Locator, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for element with retry
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' } = {}
): Promise<Locator> {
  const { timeout = 10000, state = 'visible' } = options;
  const element = page.locator(selector);
  await element.waitFor({ state, timeout });
  return element;
}

/**
 * Safe click with retry
 */
export async function safeClick(
  page: Page,
  selector: string,
  options: { timeout?: number; force?: boolean } = {}
): Promise<void> {
  const { timeout = 10000, force = false } = options;
  const element = await waitForElement(page, selector, { timeout });
  await element.click({ force, timeout });
}

/**
 * Fill input with clear
 */
export async function fillInput(
  page: Page,
  selector: string,
  value: string,
  options: { clear?: boolean } = {}
): Promise<void> {
  const { clear = true } = options;
  const element = await waitForElement(page, selector);
  if (clear) {
    await element.clear();
  }
  await element.fill(value);
}

/**
 * Get text content safely
 */
export async function getText(page: Page, selector: string): Promise<string> {
  const element = await waitForElement(page, selector);
  return (await element.textContent()) || '';
}

/**
 * Get all text contents from multiple elements
 */
export async function getAllTexts(page: Page, selector: string): Promise<string[]> {
  const elements = page.locator(selector);
  return elements.allTextContents();
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string, timeout: number = 3000): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: 'attached', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  const element = await waitForElement(page, selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * Scroll to bottom of page (for infinite scroll)
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
}

/**
 * Scroll incrementally (for lazy loading)
 */
export async function scrollIncrementally(
  page: Page,
  steps: number = 5,
  delay: number = 500
): Promise<void> {
  for (let i = 0; i < steps; i++) {
    await page.evaluate((step) => {
      const scrollHeight = document.body.scrollHeight;
      const stepSize = scrollHeight / 5;
      window.scrollBy(0, stepSize);
    }, i);
    await page.waitForTimeout(delay);
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  outputDir: string = './reports/screenshots'
): Promise<string> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const timestamp = Date.now();
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(outputDir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

/**
 * Extract table data
 */
export async function extractTableData(
  page: Page,
  tableSelector: string
): Promise<Record<string, string>[]> {
  return page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return [];

    const headers: string[] = [];
    const headerCells = table.querySelectorAll('thead th, tr:first-child th');
    headerCells.forEach((cell) => {
      headers.push((cell.textContent || '').trim());
    });

    const rows: Record<string, string>[] = [];
    const bodyRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
    bodyRows.forEach((row) => {
      const rowData: Record<string, string> = {};
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        const header = headers[index] || `column_${index}`;
        rowData[header] = (cell.textContent || '').trim();
      });
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    });

    return rows;
  }, tableSelector);
}

/**
 * Extract all links from page
 */
export async function extractLinks(page: Page, selector: string = 'a'): Promise<{ text: string; href: string }[]> {
  return page.evaluate((sel) => {
    const links = document.querySelectorAll(sel);
    return Array.from(links).map((link) => ({
      text: (link.textContent || '').trim(),
      href: (link as HTMLAnchorElement).href || '',
    }));
  }, selector);
}

/**
 * Wait for URL to contain
 */
export async function waitForUrlContains(page: Page, urlPart: string, timeout: number = 10000): Promise<void> {
  await page.waitForURL(`**/*${urlPart}*`, { timeout });
}

/**
 * Get current URL
 */
export function getCurrentUrl(page: Page): string {
  return page.url();
}

/**
 * Retry function with backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(backoff, attempt)));
      }
    }
  }

  throw lastError;
}

/**
 * Generate random string
 */
export function randomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse price from string
 */
export function parsePrice(priceString: string): number {
  const match = priceString.match(/[\d,.]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(',', ''));
}

export default {
  waitForNetworkIdle,
  waitForElement,
  safeClick,
  fillInput,
  getText,
  getAllTexts,
  elementExists,
  scrollToElement,
  scrollToBottom,
  scrollIncrementally,
  takeScreenshot,
  extractTableData,
  extractLinks,
  waitForUrlContains,
  getCurrentUrl,
  retry,
  randomString,
  formatDate,
  parsePrice,
};
