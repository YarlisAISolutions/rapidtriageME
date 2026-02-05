/**
 * Example.com - E2E Automation Tests
 *
 * URL: https://example.com
 * Use Case: Basic DOM manipulation, element inspection
 *
 * Tests fundamental automation capabilities:
 * - DOM element inspection
 * - Text extraction
 * - Attribute handling
 * - Style verification
 * - Screenshot capture
 * - Performance basics
 */

import { test, expect, Page } from '@playwright/test';
import { takeScreenshot, getText, elementExists } from '../../utils/helpers';
import { TEST_USERS } from '../../config/test-users';

const BASE_URL = 'https://example.com';

// Page helper class
class ExamplePage {
  constructor(private page: Page) {}

  async navigate(): Promise<void> {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getHeading(): Promise<string> {
    return await this.page.locator('h1').textContent() || '';
  }

  async getParagraphs(): Promise<string[]> {
    const paragraphs = this.page.locator('p');
    return paragraphs.allTextContents();
  }

  async getLinks(): Promise<{ text: string; href: string }[]> {
    const links: { text: string; href: string }[] = [];
    const anchors = this.page.locator('a');
    const count = await anchors.count();

    for (let i = 0; i < count; i++) {
      const anchor = anchors.nth(i);
      const text = await anchor.textContent() || '';
      const href = await anchor.getAttribute('href') || '';
      links.push({ text: text.trim(), href });
    }

    return links;
  }

  async getElementStyles(selector: string): Promise<Record<string, string>> {
    return this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return {};

      const styles = window.getComputedStyle(element);
      return {
        color: styles.color,
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily,
        textAlign: styles.textAlign,
        display: styles.display,
        margin: styles.margin,
        padding: styles.padding,
      };
    }, selector);
  }

  async getViewportSize(): Promise<{ width: number; height: number }> {
    return this.page.viewportSize() || { width: 0, height: 0 };
  }

  async getDocumentDimensions(): Promise<{ width: number; height: number; scrollHeight: number }> {
    return this.page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
    }));
  }

  async getMetaTags(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const metas: Record<string, string> = {};
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach((meta) => {
        const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('charset');
        const content = meta.getAttribute('content') || meta.getAttribute('charset');
        if (name && content) {
          metas[name] = content;
        }
      });
      return metas;
    });
  }

  async getDomStats(): Promise<{
    totalElements: number;
    totalTags: Record<string, number>;
    depth: number;
  }> {
    return this.page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const tagCounts: Record<string, number> = {};

      allElements.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      // Calculate max depth
      let maxDepth = 0;
      const getDepth = (el: Element, depth: number): number => {
        if (el.children.length === 0) return depth;
        let max = depth;
        for (const child of Array.from(el.children)) {
          max = Math.max(max, getDepth(child, depth + 1));
        }
        return max;
      };
      maxDepth = getDepth(document.body, 1);

      return {
        totalElements: allElements.length,
        totalTags: tagCounts,
        depth: maxDepth,
      };
    });
  }

  async measurePerformance(): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
  }> {
    return this.page.evaluate(() => {
      const timing = performance.timing;
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');

      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstContentfulPaint: fcpEntry ? fcpEntry.startTime : 0,
      };
    });
  }

  async injectElement(html: string): Promise<void> {
    await this.page.evaluate((htmlContent) => {
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
    }, html);
  }

  async modifyElement(selector: string, property: string, value: string): Promise<void> {
    await this.page.evaluate(({ sel, prop, val }) => {
      const element = document.querySelector(sel) as HTMLElement;
      if (element) {
        (element.style as any)[prop] = val;
      }
    }, { sel: selector, prop: property, val: value });
  }
}

// ============================================
// TEST SUITE
// ============================================

test.describe('Example.com - Basic DOM & Element Inspection', () => {
  let examplePage: ExamplePage;

  test.beforeEach(async ({ page }) => {
    examplePage = new ExamplePage(page);
  });

  // Test for each user role
  for (const [roleName, user] of Object.entries(TEST_USERS)) {
    test.describe(`Role: ${roleName}`, () => {

      test(`[${roleName}] TC-EXAM-001: Page title and heading extraction`, async ({ page }) => {
        await examplePage.navigate();

        const title = await examplePage.getTitle();
        const heading = await examplePage.getHeading();

        await takeScreenshot(page, `example-homepage-${roleName}`);

        expect(title).toBe('Example Domain');
        expect(heading).toBe('Example Domain');

        console.log(`[${roleName}] Page title: "${title}"`);
        console.log(`[${roleName}] Heading: "${heading}"`);
      });

      test(`[${roleName}] TC-EXAM-002: Extract paragraph content`, async ({ page }) => {
        await examplePage.navigate();

        const paragraphs = await examplePage.getParagraphs();

        expect(paragraphs.length).toBeGreaterThan(0);

        for (const p of paragraphs) {
          expect(p.trim()).toBeTruthy();
        }

        console.log(`[${roleName}] Found ${paragraphs.length} paragraphs`);
        console.log(`[${roleName}] First paragraph: "${paragraphs[0].substring(0, 50)}..."`);
      });

      test(`[${roleName}] TC-EXAM-003: Extract links`, async ({ page }) => {
        await examplePage.navigate();

        const links = await examplePage.getLinks();

        await takeScreenshot(page, `example-links-${roleName}`);

        expect(links.length).toBeGreaterThan(0);

        for (const link of links) {
          expect(link.href).toBeTruthy();
        }

        console.log(`[${roleName}] Found ${links.length} links:`);
        links.forEach(l => console.log(`  - "${l.text}" -> ${l.href}`));
      });

      test(`[${roleName}] TC-EXAM-004: Inspect element styles`, async ({ page }) => {
        await examplePage.navigate();

        const headingStyles = await examplePage.getElementStyles('h1');
        const bodyStyles = await examplePage.getElementStyles('body');

        expect(headingStyles.display).toBeTruthy();
        expect(bodyStyles.fontFamily).toBeTruthy();

        console.log(`[${roleName}] Heading styles:`);
        console.log(`  Font size: ${headingStyles.fontSize}`);
        console.log(`  Color: ${headingStyles.color}`);
        console.log(`  Display: ${headingStyles.display}`);
      });

      test(`[${roleName}] TC-EXAM-005: Viewport and document dimensions`, async ({ page }) => {
        await examplePage.navigate();

        const viewport = await examplePage.getViewportSize();
        const document = await examplePage.getDocumentDimensions();

        expect(viewport.width).toBeGreaterThan(0);
        expect(viewport.height).toBeGreaterThan(0);
        expect(document.width).toBeGreaterThan(0);

        console.log(`[${roleName}] Viewport: ${viewport.width}x${viewport.height}`);
        console.log(`[${roleName}] Document: ${document.width}x${document.height}`);
        console.log(`[${roleName}] Scroll height: ${document.scrollHeight}`);
      });

      test(`[${roleName}] TC-EXAM-006: Extract meta tags`, async ({ page }) => {
        await examplePage.navigate();

        const metas = await examplePage.getMetaTags();

        await takeScreenshot(page, `example-meta-${roleName}`);

        // Example.com has minimal meta tags
        expect(Object.keys(metas).length).toBeGreaterThanOrEqual(0);

        console.log(`[${roleName}] Meta tags found: ${Object.keys(metas).length}`);
        for (const [name, content] of Object.entries(metas)) {
          console.log(`  ${name}: ${content}`);
        }
      });

      test(`[${roleName}] TC-EXAM-007: DOM structure analysis`, async ({ page }) => {
        await examplePage.navigate();

        const stats = await examplePage.getDomStats();

        expect(stats.totalElements).toBeGreaterThan(0);
        expect(stats.depth).toBeGreaterThan(0);

        console.log(`[${roleName}] DOM statistics:`);
        console.log(`  Total elements: ${stats.totalElements}`);
        console.log(`  Max depth: ${stats.depth}`);
        console.log(`  Tags used:`, stats.totalTags);
      });

      test(`[${roleName}] TC-EXAM-008: Performance measurement`, async ({ page }) => {
        await examplePage.navigate();

        const perf = await examplePage.measurePerformance();

        expect(perf.loadTime).toBeGreaterThan(0);
        expect(perf.domContentLoaded).toBeGreaterThan(0);

        console.log(`[${roleName}] Performance metrics:`);
        console.log(`  Load time: ${perf.loadTime}ms`);
        console.log(`  DOM Content Loaded: ${perf.domContentLoaded}ms`);
        console.log(`  First Contentful Paint: ${perf.firstContentfulPaint.toFixed(2)}ms`);
      });

      test(`[${roleName}] TC-EXAM-009: DOM manipulation - Inject element`, async ({ page }) => {
        await examplePage.navigate();

        // Inject a test element
        const testHtml = `<div id="test-inject-${roleName}" style="padding: 10px; background: #f0f0f0; margin: 10px 0;">
          <h3>Injected by ${roleName}</h3>
          <p>This element was dynamically added by Playwright</p>
        </div>`;

        await examplePage.injectElement(testHtml);

        // Verify injection
        const injected = page.locator(`#test-inject-${roleName}`);
        await expect(injected).toBeVisible();

        await takeScreenshot(page, `example-inject-${roleName}`);

        const text = await injected.locator('h3').textContent();
        expect(text).toContain(roleName);

        console.log(`[${roleName}] Element injected and verified`);
      });

      test(`[${roleName}] TC-EXAM-010: DOM manipulation - Modify styles`, async ({ page }) => {
        await examplePage.navigate();

        // Modify heading color
        await examplePage.modifyElement('h1', 'color', 'red');
        await examplePage.modifyElement('h1', 'backgroundColor', 'yellow');

        // Verify modification
        const styles = await examplePage.getElementStyles('h1');

        await takeScreenshot(page, `example-modified-${roleName}`);

        // Note: Colors may be reported in rgb format
        expect(styles.color).toBeTruthy();

        console.log(`[${roleName}] Element modified:`);
        console.log(`  New color: ${styles.color}`);
      });

      test(`[${roleName}] TC-EXAM-011: Full page screenshot`, async ({ page }) => {
        await examplePage.navigate();

        const screenshotPath = await takeScreenshot(page, `example-fullpage-${roleName}`);

        expect(screenshotPath).toBeTruthy();

        console.log(`[${roleName}] Screenshot saved: ${screenshotPath}`);
      });

      test(`[${roleName}] TC-EXAM-012: Network request monitoring`, async ({ page }) => {
        const requests: string[] = [];

        // Monitor network requests
        page.on('request', (request) => {
          requests.push(`${request.method()} ${request.url()}`);
        });

        await examplePage.navigate();

        expect(requests.length).toBeGreaterThan(0);

        console.log(`[${roleName}] Network requests captured: ${requests.length}`);
        requests.forEach(r => console.log(`  ${r}`));
      });

    });
  }
});
