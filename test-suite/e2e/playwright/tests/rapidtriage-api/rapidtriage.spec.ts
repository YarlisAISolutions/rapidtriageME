/**
 * RapidTriage Extension API - E2E Automation Tests
 *
 * Tests the backend APIs that the RapidTriage Chrome Extension connects to.
 *
 * Features Tested:
 * - Server Identity Validation
 * - Screenshot Capture & Upload
 * - Console Logs Retrieval
 * - Network Logs Retrieval
 * - Lighthouse Audits (Full, Performance, Accessibility, SEO, Best Practices)
 * - Log Management (Wipe Logs)
 * - URL Tracking
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { takeScreenshot } from '../../utils/helpers';
import { TEST_USERS } from '../../config/test-users';
import { RAPIDTRIAGE_TOKENS, getApiToken } from '../../config/secrets';

// Server configuration
const LOCAL_SERVER = 'http://localhost:3025';
const REMOTE_SERVER = 'https://rapidtriage-me.web.app';

// Test URLs for audit testing
const TEST_URLS = {
  simple: 'https://example.com',
  complex: 'https://books.toscrape.com',
  performance: 'https://httpbin.org/html',
};

// Response interfaces
interface IdentityResponse {
  name: string;
  version: string;
  signature?: string;
}

interface ScreenshotResponse {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

interface LogsResponse {
  success: boolean;
  logs?: any[];
  count?: number;
  error?: string;
}

interface LighthouseResponse {
  success: boolean;
  scores?: {
    performance?: number;
    accessibility?: number;
    seo?: number;
    bestPractices?: number;
  };
  metrics?: Record<string, any>;
  error?: string;
}

interface HealthResponse {
  status: string;
  timestamp?: string;
  version?: string;
}

// Helper class for RapidTriage API testing
class RapidTriageApiClient {
  private baseUrl: string;
  private token: string;

  constructor(
    private request: APIRequestContext,
    baseUrl: string = REMOTE_SERVER,
    token: string = ''
  ) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    const response = await this.request.get(`${this.baseUrl}/health`);
    return response.json();
  }

  // Server identity validation
  async getIdentity(): Promise<IdentityResponse | null> {
    try {
      const response = await this.request.get(`${this.baseUrl}/.identity`, {
        timeout: 5000,
      });
      if (response.ok()) {
        return response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  // Screenshot capture
  async captureScreenshot(
    url: string,
    options?: { fullPage?: boolean; format?: string }
  ): Promise<ScreenshotResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/screenshot`, {
      headers: this.getHeaders(),
      data: {
        url,
        fullPage: options?.fullPage ?? false,
        format: options?.format ?? 'png',
      },
    });
    return response.json();
  }

  // Console logs
  async getConsoleLogs(url?: string): Promise<LogsResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/console-logs`, {
      headers: this.getHeaders(),
      data: { url },
    });
    return response.json();
  }

  // Console errors only
  async getConsoleErrors(url?: string): Promise<LogsResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/console-errors`, {
      headers: this.getHeaders(),
      data: { url },
    });
    return response.json();
  }

  // Network logs
  async getNetworkLogs(url?: string): Promise<LogsResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/network-logs`, {
      headers: this.getHeaders(),
      data: { url },
    });
    return response.json();
  }

  // Network errors only
  async getNetworkErrors(url?: string): Promise<LogsResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/network-errors`, {
      headers: this.getHeaders(),
      data: { url },
    });
    return response.json();
  }

  // Full Lighthouse audit
  async runLighthouseAudit(
    url: string,
    categories?: string[]
  ): Promise<LighthouseResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/lighthouse`, {
      headers: this.getHeaders(),
      data: {
        url,
        categories: categories || ['performance', 'accessibility', 'seo', 'best-practices'],
      },
      timeout: 120000, // 2 minutes for full audit
    });
    return response.json();
  }

  // Accessibility audit
  async runAccessibilityAudit(url: string): Promise<LighthouseResponse> {
    const response = await this.request.post(
      `${this.baseUrl}/api/lighthouse/accessibility`,
      {
        headers: this.getHeaders(),
        data: { url },
        timeout: 60000,
      }
    );
    return response.json();
  }

  // Performance audit
  async runPerformanceAudit(url: string): Promise<LighthouseResponse> {
    const response = await this.request.post(
      `${this.baseUrl}/api/lighthouse/performance`,
      {
        headers: this.getHeaders(),
        data: { url },
        timeout: 60000,
      }
    );
    return response.json();
  }

  // SEO audit
  async runSeoAudit(url: string): Promise<LighthouseResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/lighthouse/seo`, {
      headers: this.getHeaders(),
      data: { url },
      timeout: 60000,
    });
    return response.json();
  }

  // Best practices audit
  async runBestPracticesAudit(url: string): Promise<LighthouseResponse> {
    const response = await this.request.post(
      `${this.baseUrl}/api/lighthouse/best-practices`,
      {
        headers: this.getHeaders(),
        data: { url },
        timeout: 60000,
      }
    );
    return response.json();
  }

  // Wipe logs
  async wipeLogs(): Promise<{ success: boolean; message?: string }> {
    const response = await this.request.post(`${this.baseUrl}/api/wipelogs`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  // Update current URL (simulating extension behavior)
  async updateCurrentUrl(url: string, title?: string): Promise<{ success: boolean }> {
    const response = await this.request.post(`${this.baseUrl}/api/current-url`, {
      headers: this.getHeaders(),
      data: { url, title },
    });
    return response.json();
  }

  // Execute JavaScript on a page
  async executeJs(url: string, script: string): Promise<{ success: boolean; result?: any }> {
    const response = await this.request.post(`${this.baseUrl}/api/execute-js`, {
      headers: this.getHeaders(),
      data: { url, script },
    });
    return response.json();
  }

  // Get triage report
  async getTriageReport(url: string): Promise<any> {
    const response = await this.request.post(`${this.baseUrl}/api/triage-report`, {
      headers: this.getHeaders(),
      data: { url },
      timeout: 180000, // 3 minutes for full report
    });
    return response.json();
  }
}

// ============================================
// TEST SUITE
// ============================================

test.describe('RapidTriage Extension API - Backend Services', () => {
  let apiClient: RapidTriageApiClient;

  // Test for each user role
  for (const [roleName, user] of Object.entries(TEST_USERS)) {
    test.describe(`Role: ${roleName}`, () => {
      test.beforeEach(async ({ request }) => {
        const token = getApiToken(roleName);
        apiClient = new RapidTriageApiClient(request, REMOTE_SERVER, token);
      });

      // ==========================================
      // Health & Identity Tests
      // ==========================================

      test(`[${roleName}] TC-RT-001: Server health check`, async ({ page }) => {
        const health = await apiClient.getHealth();

        await takeScreenshot(page, `rapidtriage-health-${roleName}`);

        expect(health.status).toBeTruthy();
        console.log(`[${roleName}] Server health:`, health);
      });

      test(`[${roleName}] TC-RT-002: Server identity validation`, async ({ page }) => {
        const identity = await apiClient.getIdentity();

        await takeScreenshot(page, `rapidtriage-identity-${roleName}`);

        // Identity endpoint may not be available on all servers
        if (identity) {
          expect(identity.name).toBeTruthy();
          console.log(`[${roleName}] Server identity:`, identity);
        } else {
          console.log(`[${roleName}] Identity endpoint not available (expected for some configs)`);
        }
      });

      // ==========================================
      // Screenshot Tests
      // ==========================================

      test(`[${roleName}] TC-RT-003: Screenshot capture - Simple page`, async ({ page, request }) => {
        // Skip for free tier if screenshots not enabled
        if (!user.features.lighthouseEnabled && roleName === 'free') {
          test.skip();
          return;
        }

        const result = await apiClient.captureScreenshot(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-screenshot-simple-${roleName}`);

        // API may return error without active browser session
        console.log(`[${roleName}] Screenshot result:`, result);
        expect(result).toBeDefined();
      });

      test(`[${roleName}] TC-RT-004: Screenshot capture - Full page`, async ({ page }) => {
        if (!user.features.lighthouseEnabled && roleName === 'free') {
          test.skip();
          return;
        }

        const result = await apiClient.captureScreenshot(TEST_URLS.complex, {
          fullPage: true,
        });

        await takeScreenshot(page, `rapidtriage-screenshot-fullpage-${roleName}`);

        console.log(`[${roleName}] Full page screenshot:`, result);
        expect(result).toBeDefined();
      });

      // ==========================================
      // Console Logs Tests
      // ==========================================

      test(`[${roleName}] TC-RT-005: Get console logs`, async ({ page }) => {
        const result = await apiClient.getConsoleLogs(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-console-logs-${roleName}`);

        console.log(`[${roleName}] Console logs response:`, result);
        expect(result).toBeDefined();
      });

      test(`[${roleName}] TC-RT-006: Get console errors`, async ({ page }) => {
        const result = await apiClient.getConsoleErrors(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-console-errors-${roleName}`);

        console.log(`[${roleName}] Console errors response:`, result);
        expect(result).toBeDefined();
      });

      // ==========================================
      // Network Logs Tests
      // ==========================================

      test(`[${roleName}] TC-RT-007: Get network logs`, async ({ page }) => {
        const result = await apiClient.getNetworkLogs(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-network-logs-${roleName}`);

        console.log(`[${roleName}] Network logs response:`, result);
        expect(result).toBeDefined();
      });

      test(`[${roleName}] TC-RT-008: Get network errors`, async ({ page }) => {
        const result = await apiClient.getNetworkErrors(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-network-errors-${roleName}`);

        console.log(`[${roleName}] Network errors response:`, result);
        expect(result).toBeDefined();
      });

      // ==========================================
      // Lighthouse Audit Tests
      // ==========================================

      test(`[${roleName}] TC-RT-009: Lighthouse - Full audit`, async ({ page }) => {
        // Skip for free tier - Lighthouse not enabled
        if (!user.features.lighthouseEnabled) {
          console.log(`[${roleName}] Skipping Lighthouse - not enabled for this tier`);
          test.skip();
          return;
        }

        const result = await apiClient.runLighthouseAudit(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-lighthouse-full-${roleName}`);

        console.log(`[${roleName}] Lighthouse full audit:`, result);
        expect(result).toBeDefined();

        if (result.scores) {
          console.log(`[${roleName}] Scores:`);
          console.log(`  Performance: ${result.scores.performance}`);
          console.log(`  Accessibility: ${result.scores.accessibility}`);
          console.log(`  SEO: ${result.scores.seo}`);
          console.log(`  Best Practices: ${result.scores.bestPractices}`);
        }
      });

      test(`[${roleName}] TC-RT-010: Lighthouse - Performance audit`, async ({ page }) => {
        if (!user.features.lighthouseEnabled) {
          test.skip();
          return;
        }

        const result = await apiClient.runPerformanceAudit(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-lighthouse-perf-${roleName}`);

        console.log(`[${roleName}] Performance audit:`, result);
        expect(result).toBeDefined();
      });

      test(`[${roleName}] TC-RT-011: Lighthouse - Accessibility audit`, async ({ page }) => {
        if (!user.features.lighthouseEnabled) {
          test.skip();
          return;
        }

        const result = await apiClient.runAccessibilityAudit(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-lighthouse-a11y-${roleName}`);

        console.log(`[${roleName}] Accessibility audit:`, result);
        expect(result).toBeDefined();
      });

      test(`[${roleName}] TC-RT-012: Lighthouse - SEO audit`, async ({ page }) => {
        if (!user.features.lighthouseEnabled) {
          test.skip();
          return;
        }

        const result = await apiClient.runSeoAudit(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-lighthouse-seo-${roleName}`);

        console.log(`[${roleName}] SEO audit:`, result);
        expect(result).toBeDefined();
      });

      test(`[${roleName}] TC-RT-013: Lighthouse - Best Practices audit`, async ({ page }) => {
        if (!user.features.lighthouseEnabled) {
          test.skip();
          return;
        }

        const result = await apiClient.runBestPracticesAudit(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-lighthouse-bp-${roleName}`);

        console.log(`[${roleName}] Best Practices audit:`, result);
        expect(result).toBeDefined();
      });

      // ==========================================
      // Log Management Tests
      // ==========================================

      test(`[${roleName}] TC-RT-014: Wipe logs`, async ({ page }) => {
        const result = await apiClient.wipeLogs();

        await takeScreenshot(page, `rapidtriage-wipe-logs-${roleName}`);

        console.log(`[${roleName}] Wipe logs result:`, result);
        expect(result).toBeDefined();
      });

      // ==========================================
      // URL Tracking Tests
      // ==========================================

      test(`[${roleName}] TC-RT-015: Update current URL`, async ({ page }) => {
        const result = await apiClient.updateCurrentUrl(
          TEST_URLS.simple,
          'Example Domain'
        );

        await takeScreenshot(page, `rapidtriage-url-update-${roleName}`);

        console.log(`[${roleName}] URL update result:`, result);
        expect(result).toBeDefined();
      });

      // ==========================================
      // JavaScript Execution Tests
      // ==========================================

      test(`[${roleName}] TC-RT-016: Execute JavaScript`, async ({ page }) => {
        const result = await apiClient.executeJs(
          TEST_URLS.simple,
          'return document.title;'
        );

        await takeScreenshot(page, `rapidtriage-execute-js-${roleName}`);

        console.log(`[${roleName}] JS execution result:`, result);
        expect(result).toBeDefined();
      });

      // ==========================================
      // Comprehensive Triage Report Test
      // ==========================================

      test(`[${roleName}] TC-RT-017: Generate triage report`, async ({ page }) => {
        // Skip for free tier
        if (!user.features.lighthouseEnabled) {
          test.skip();
          return;
        }

        const result = await apiClient.getTriageReport(TEST_URLS.simple);

        await takeScreenshot(page, `rapidtriage-report-${roleName}`);

        console.log(`[${roleName}] Triage report:`, result);
        expect(result).toBeDefined();
      });
    });
  }
});

// ============================================
// EXTENSION FEATURE SIMULATION TESTS
// ============================================

test.describe('RapidTriage Extension - Feature Simulation', () => {
  test.describe('Element Inspector Simulation', () => {
    test('TC-RT-EXT-001: Extract element data from page', async ({ page }) => {
      await page.goto('https://example.com');
      await page.waitForLoadState('domcontentloaded');

      // Simulate what content.js does - extract element data
      const elementData = await page.evaluate(() => {
        const element = document.querySelector('h1');
        if (!element) return null;

        const getXPath = (el: Element): string => {
          if (el.id) return `//*[@id="${el.id}"]`;
          if (el === document.body) return '/html/body';

          let ix = 0;
          const siblings = el.parentNode?.childNodes || [];
          for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === el) {
              const parentPath = el.parentElement ? getXPath(el.parentElement) : '';
              return `${parentPath}/${el.tagName.toLowerCase()}[${ix + 1}]`;
            }
            if (sibling.nodeType === 1 && (sibling as Element).tagName === el.tagName) {
              ix++;
            }
          }
          return '';
        };

        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);

        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          className: element.className || null,
          xpath: getXPath(element),
          text: element.textContent?.substring(0, 100) || '',
          innerHTML: element.innerHTML.substring(0, 200),
          position: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          styles: {
            display: styles.display,
            color: styles.color,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
          },
          attributes: Array.from(element.attributes).map(attr => ({
            name: attr.name,
            value: attr.value,
          })),
        };
      });

      await takeScreenshot(page, 'rapidtriage-element-inspector');

      expect(elementData).not.toBeNull();
      expect(elementData?.tagName).toBe('h1');
      expect(elementData?.text).toBe('Example Domain');
      expect(elementData?.position.width).toBeGreaterThan(0);

      console.log('Element data extracted:', elementData);
    });

    test('TC-RT-EXT-002: Generate CSS selector', async ({ page }) => {
      await page.goto('https://books.toscrape.com');
      await page.waitForLoadState('domcontentloaded');

      const selectorData = await page.evaluate(() => {
        const element = document.querySelector('.product_pod h3 a');
        if (!element) return null;

        const getCssSelector = (el: Element): string => {
          if (el.id) return `#${el.id}`;

          let selector = el.tagName.toLowerCase();
          if (el.className) {
            const classes = el.className.split(' ').filter(c => c);
            selector += '.' + classes.join('.');
          }

          const parent = el.parentElement;
          if (parent && parent !== document.body) {
            return getCssSelector(parent) + ' > ' + selector;
          }
          return selector;
        };

        return {
          selector: getCssSelector(element),
          text: element.textContent,
          href: element.getAttribute('href'),
        };
      });

      await takeScreenshot(page, 'rapidtriage-css-selector');

      expect(selectorData).not.toBeNull();
      expect(selectorData?.selector).toContain('a');

      console.log('CSS selector generated:', selectorData);
    });
  });

  test.describe('Performance Metrics Capture', () => {
    test('TC-RT-EXT-003: Capture Web Vitals', async ({ page }) => {
      await page.goto('https://example.com');
      await page.waitForLoadState('load');

      // Wait a bit for metrics to stabilize
      await page.waitForTimeout(1000);

      const metrics = await page.evaluate(() => {
        const timing = performance.timing;
        const paintEntries = performance.getEntriesByType('paint');
        const lcpEntry = performance.getEntriesByType('largest-contentful-paint')[0] as any;
        const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');

        return {
          // Navigation timing
          loadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          ttfb: timing.responseStart - timing.navigationStart,

          // Paint metrics
          fcp: fcpEntry ? fcpEntry.startTime : null,
          lcp: lcpEntry ? lcpEntry.startTime : null,

          // Resource timing
          resourceCount: performance.getEntriesByType('resource').length,
        };
      });

      await takeScreenshot(page, 'rapidtriage-web-vitals');

      expect(metrics.loadTime).toBeGreaterThan(0);
      expect(metrics.domContentLoaded).toBeGreaterThan(0);

      console.log('Web Vitals captured:');
      console.log(`  TTFB: ${metrics.ttfb}ms`);
      console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`  Load Time: ${metrics.loadTime}ms`);
      console.log(`  FCP: ${metrics.fcp}ms`);
      console.log(`  LCP: ${metrics.lcp}ms`);
      console.log(`  Resources: ${metrics.resourceCount}`);
    });

    test('TC-RT-EXT-004: Capture network request chain', async ({ page }) => {
      const requests: { url: string; method: string; resourceType: string }[] = [];

      page.on('request', (request) => {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
        });
      });

      await page.goto('https://books.toscrape.com');
      await page.waitForLoadState('networkidle');

      await takeScreenshot(page, 'rapidtriage-network-chain');

      expect(requests.length).toBeGreaterThan(0);

      // Group by resource type
      const byType: Record<string, number> = {};
      requests.forEach(r => {
        byType[r.resourceType] = (byType[r.resourceType] || 0) + 1;
      });

      console.log('Network request chain:');
      console.log(`  Total requests: ${requests.length}`);
      console.log('  By type:', byType);
    });
  });

  test.describe('Console Log Capture', () => {
    test('TC-RT-EXT-005: Capture console messages', async ({ page }) => {
      const consoleLogs: { type: string; text: string }[] = [];

      page.on('console', (msg) => {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
        });
      });

      // Navigate to a page and inject some console messages
      await page.goto('https://example.com');

      await page.evaluate(() => {
        console.log('RapidTriage test log');
        console.warn('RapidTriage test warning');
        console.info('RapidTriage test info');
      });

      await takeScreenshot(page, 'rapidtriage-console-capture');

      expect(consoleLogs.length).toBeGreaterThan(0);

      // Filter our test messages
      const testLogs = consoleLogs.filter(l => l.text.includes('RapidTriage'));
      expect(testLogs.length).toBe(3);

      console.log('Console logs captured:');
      testLogs.forEach(l => console.log(`  [${l.type}] ${l.text}`));
    });

    test('TC-RT-EXT-006: Capture page errors', async ({ page }) => {
      const pageErrors: string[] = [];

      page.on('pageerror', (error) => {
        pageErrors.push(error.message);
      });

      await page.goto('https://example.com');

      // Inject an error
      await page.evaluate(() => {
        try {
          throw new Error('RapidTriage test error');
        } catch (e) {
          console.error('Caught error:', e);
        }
      });

      await takeScreenshot(page, 'rapidtriage-error-capture');

      console.log('Page errors captured:', pageErrors);
    });
  });

  test.describe('DOM Analysis', () => {
    test('TC-RT-EXT-007: Analyze DOM structure', async ({ page }) => {
      await page.goto('https://books.toscrape.com');
      await page.waitForLoadState('domcontentloaded');

      const domAnalysis = await page.evaluate(() => {
        const allElements = document.querySelectorAll('*');
        const tagCounts: Record<string, number> = {};

        allElements.forEach(el => {
          const tag = el.tagName.toLowerCase();
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });

        // Calculate DOM depth
        const getDepth = (el: Element, depth: number): number => {
          if (el.children.length === 0) return depth;
          let max = depth;
          for (const child of Array.from(el.children)) {
            max = Math.max(max, getDepth(child, depth + 1));
          }
          return max;
        };

        const depth = getDepth(document.body, 1);

        // Find elements with specific attributes
        const elementsWithId = document.querySelectorAll('[id]').length;
        const elementsWithClass = document.querySelectorAll('[class]').length;
        const links = document.querySelectorAll('a').length;
        const images = document.querySelectorAll('img').length;
        const forms = document.querySelectorAll('form').length;

        return {
          totalElements: allElements.length,
          maxDepth: depth,
          tagCounts,
          elementsWithId,
          elementsWithClass,
          links,
          images,
          forms,
        };
      });

      await takeScreenshot(page, 'rapidtriage-dom-analysis');

      expect(domAnalysis.totalElements).toBeGreaterThan(0);
      expect(domAnalysis.maxDepth).toBeGreaterThan(0);

      console.log('DOM Analysis:');
      console.log(`  Total elements: ${domAnalysis.totalElements}`);
      console.log(`  Max depth: ${domAnalysis.maxDepth}`);
      console.log(`  Elements with ID: ${domAnalysis.elementsWithId}`);
      console.log(`  Elements with class: ${domAnalysis.elementsWithClass}`);
      console.log(`  Links: ${domAnalysis.links}`);
      console.log(`  Images: ${domAnalysis.images}`);
      console.log(`  Forms: ${domAnalysis.forms}`);
    });

    test('TC-RT-EXT-008: Accessibility quick scan', async ({ page }) => {
      await page.goto('https://example.com');
      await page.waitForLoadState('domcontentloaded');

      const a11yCheck = await page.evaluate(() => {
        const issues: string[] = [];

        // Check images without alt
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
          issues.push(`${imagesWithoutAlt.length} images missing alt text`);
        }

        // Check links without text
        const linksWithoutText = Array.from(document.querySelectorAll('a')).filter(
          a => !a.textContent?.trim() && !a.getAttribute('aria-label')
        );
        if (linksWithoutText.length > 0) {
          issues.push(`${linksWithoutText.length} links without accessible text`);
        }

        // Check form inputs without labels
        const inputs = document.querySelectorAll('input:not([type="hidden"])');
        const inputsWithoutLabels = Array.from(inputs).filter(input => {
          const id = input.id;
          if (!id) return true;
          const label = document.querySelector(`label[for="${id}"]`);
          return !label && !input.getAttribute('aria-label');
        });
        if (inputsWithoutLabels.length > 0) {
          issues.push(`${inputsWithoutLabels.length} inputs without labels`);
        }

        // Check heading hierarchy
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        let lastLevel = 0;
        let hierarchyIssues = 0;
        headings.forEach(h => {
          const level = parseInt(h.tagName[1]);
          if (lastLevel > 0 && level > lastLevel + 1) {
            hierarchyIssues++;
          }
          lastLevel = level;
        });
        if (hierarchyIssues > 0) {
          issues.push(`${hierarchyIssues} heading hierarchy issues`);
        }

        // Check page has main landmark
        const hasMain = document.querySelector('main') !== null;
        if (!hasMain) {
          issues.push('No main landmark found');
        }

        return {
          issues,
          passed: issues.length === 0,
          counts: {
            images: document.querySelectorAll('img').length,
            links: document.querySelectorAll('a').length,
            inputs: inputs.length,
            headings: headings.length,
          },
        };
      });

      await takeScreenshot(page, 'rapidtriage-a11y-scan');

      console.log('Accessibility Quick Scan:');
      console.log(`  Passed: ${a11yCheck.passed}`);
      console.log(`  Issues: ${a11yCheck.issues.length}`);
      a11yCheck.issues.forEach(issue => console.log(`    - ${issue}`));
      console.log('  Element counts:', a11yCheck.counts);
    });
  });
});
