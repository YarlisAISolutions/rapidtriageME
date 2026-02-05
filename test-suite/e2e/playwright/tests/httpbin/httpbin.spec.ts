/**
 * HTTPBin - E2E Automation Tests
 *
 * URL: https://httpbin.org
 * Use Case: Headers, IP, HTTP requests testing
 *
 * Tests various HTTP capabilities:
 * - Request headers inspection
 * - IP address detection
 * - HTTP methods (GET, POST, PUT, DELETE)
 * - Authentication testing
 * - Response inspection
 * - Cookies handling
 */

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { takeScreenshot } from '../../utils/helpers';
import { TEST_USERS } from '../../config/test-users';
import { getCredentials } from '../../config/secrets';

const BASE_URL = 'https://httpbin.org';

// Response interfaces
interface HeadersResponse {
  headers: Record<string, string>;
}

interface IpResponse {
  origin: string;
}

interface UserAgentResponse {
  'user-agent': string;
}

interface HttpMethodResponse {
  args: Record<string, string>;
  data: string;
  files: Record<string, string>;
  form: Record<string, string>;
  headers: Record<string, string>;
  json: any;
  method: string;
  origin: string;
  url: string;
}

interface CookiesResponse {
  cookies: Record<string, string>;
}

// Page helper class
class HttpBinPage {
  constructor(private page: Page) {}

  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getPageJson<T>(): Promise<T> {
    const content = await this.page.locator('pre').textContent() || '{}';
    return JSON.parse(content);
  }

  // API testing via page context
  async apiGet(endpoint: string): Promise<HttpMethodResponse> {
    await this.navigate(endpoint);
    return this.getPageJson<HttpMethodResponse>();
  }

  async apiPost(endpoint: string, data: any): Promise<HttpMethodResponse> {
    const response = await this.page.evaluate(async ({ url, payload }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    }, { url: `${BASE_URL}${endpoint}`, payload: data });

    return response;
  }

  // Headers
  async getHeaders(): Promise<HeadersResponse> {
    await this.navigate('/headers');
    return this.getPageJson<HeadersResponse>();
  }

  // IP
  async getIp(): Promise<IpResponse> {
    await this.navigate('/ip');
    return this.getPageJson<IpResponse>();
  }

  // User Agent
  async getUserAgent(): Promise<UserAgentResponse> {
    await this.navigate('/user-agent');
    return this.getPageJson<UserAgentResponse>();
  }

  // Get request with query params
  async getWithParams(params: Record<string, string>): Promise<HttpMethodResponse> {
    const queryString = new URLSearchParams(params).toString();
    await this.navigate(`/get?${queryString}`);
    return this.getPageJson<HttpMethodResponse>();
  }

  // Status code testing
  async getStatusCode(code: number): Promise<number> {
    const response = await this.page.goto(`${BASE_URL}/status/${code}`);
    return response?.status() || 0;
  }

  // Cookies
  async setCookies(cookies: Record<string, string>): Promise<CookiesResponse> {
    const params = new URLSearchParams(cookies).toString();
    await this.navigate(`/cookies/set?${params}`);
    return this.getPageJson<CookiesResponse>();
  }

  async getCookies(): Promise<CookiesResponse> {
    await this.navigate('/cookies');
    return this.getPageJson<CookiesResponse>();
  }

  // Delay
  async getWithDelay(seconds: number): Promise<{ delay: number }> {
    const start = Date.now();
    await this.navigate(`/delay/${seconds}`);
    const duration = (Date.now() - start) / 1000;
    return { delay: duration };
  }

  // Basic Auth
  async basicAuth(user: string, password: string): Promise<boolean> {
    const response = await this.page.goto(`https://${user}:${password}@httpbin.org/basic-auth/${user}/${password}`);
    return response?.status() === 200;
  }

  // Response formats
  async getHtml(): Promise<string> {
    await this.navigate('/html');
    return this.page.content();
  }

  async getXml(): Promise<string> {
    await this.navigate('/xml');
    return this.page.content();
  }
}

// ============================================
// TEST SUITE
// ============================================

test.describe('HTTPBin - Headers, IP & Requests', () => {
  let httpBinPage: HttpBinPage;

  test.beforeEach(async ({ page }) => {
    httpBinPage = new HttpBinPage(page);
  });

  // Test for each user role
  for (const [roleName, user] of Object.entries(TEST_USERS)) {
    test.describe(`Role: ${roleName}`, () => {

      test(`[${roleName}] TC-HTTP-001: Inspect request headers`, async ({ page }) => {
        const response = await httpBinPage.getHeaders();

        await takeScreenshot(page, `httpbin-headers-${roleName}`);

        expect(response.headers).toBeDefined();
        expect(response.headers['Host']).toBe('httpbin.org');
        expect(response.headers['User-Agent']).toBeTruthy();

        console.log(`[${roleName}] Request headers:`);
        console.log(`  Host: ${response.headers['Host']}`);
        console.log(`  User-Agent: ${response.headers['User-Agent']}`);
        console.log(`  Accept: ${response.headers['Accept']}`);
      });

      test(`[${roleName}] TC-HTTP-002: Get client IP address`, async ({ page }) => {
        const response = await httpBinPage.getIp();

        await takeScreenshot(page, `httpbin-ip-${roleName}`);

        expect(response.origin).toBeTruthy();
        // IP format validation (IPv4 or IPv6)
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F:]+)$/;
        expect(response.origin).toMatch(ipPattern);

        console.log(`[${roleName}] Client IP: ${response.origin}`);
      });

      test(`[${roleName}] TC-HTTP-003: Get User Agent`, async ({ page }) => {
        const response = await httpBinPage.getUserAgent();

        await takeScreenshot(page, `httpbin-useragent-${roleName}`);

        expect(response['user-agent']).toBeTruthy();
        expect(response['user-agent']).toContain('Mozilla');

        console.log(`[${roleName}] User Agent: ${response['user-agent']}`);
      });

      test(`[${roleName}] TC-HTTP-004: GET request with query parameters`, async ({ page }) => {
        const params = {
          name: 'RapidTriage',
          version: '1.0',
          role: roleName,
        };

        const response = await httpBinPage.getWithParams(params);

        await takeScreenshot(page, `httpbin-get-params-${roleName}`);

        expect(response.args).toEqual(params);
        expect(response.url).toContain('name=RapidTriage');

        console.log(`[${roleName}] Query params echoed correctly:`, response.args);
      });

      test(`[${roleName}] TC-HTTP-005: POST request with JSON body`, async ({ page }) => {
        const data = {
          testUser: roleName,
          timestamp: Date.now(),
          features: ['screenshot', 'console', 'network'],
        };

        const response = await httpBinPage.apiPost('/post', data);

        expect(response.json).toEqual(data);

        console.log(`[${roleName}] POST data echoed:`);
        console.log(`  User: ${response.json.testUser}`);
        console.log(`  Features: ${response.json.features.join(', ')}`);
      });

      test(`[${roleName}] TC-HTTP-006: Test HTTP status codes`, async ({ page }) => {
        // Note: 204 removed as it returns no content and causes networkidle timeout
        const statusCodes = [200, 201, 400, 401, 403, 404, 500];
        const results: Record<number, number> = {};

        for (const expectedCode of statusCodes) {
          const actualCode = await httpBinPage.getStatusCode(expectedCode);
          results[expectedCode] = actualCode;
          expect(actualCode).toBe(expectedCode);
        }

        console.log(`[${roleName}] Status code tests:`);
        for (const [expected, actual] of Object.entries(results)) {
          console.log(`  ${expected}: ${actual === parseInt(expected) ? '✓' : '✗'}`);
        }
      });

      test(`[${roleName}] TC-HTTP-007: Cookie handling`, async ({ page }) => {
        // Set cookies
        const cookiesToSet = {
          session: `test-${roleName}`,
          user: 'rapidtriage',
        };

        await httpBinPage.setCookies(cookiesToSet);

        // Get cookies
        const response = await httpBinPage.getCookies();

        await takeScreenshot(page, `httpbin-cookies-${roleName}`);

        expect(response.cookies.session).toBe(cookiesToSet.session);
        expect(response.cookies.user).toBe(cookiesToSet.user);

        console.log(`[${roleName}] Cookies set and verified:`, response.cookies);
      });

      test(`[${roleName}] TC-HTTP-008: Response delay handling`, async ({ page }) => {
        const delaySeconds = 2;

        const result = await httpBinPage.getWithDelay(delaySeconds);

        expect(result.delay).toBeGreaterThanOrEqual(delaySeconds);
        expect(result.delay).toBeLessThan(delaySeconds + 2); // Allow some buffer

        console.log(`[${roleName}] Delay test: requested ${delaySeconds}s, actual ${result.delay.toFixed(2)}s`);
      });

      test(`[${roleName}] TC-HTTP-009: HTML response format`, async ({ page }) => {
        const html = await httpBinPage.getHtml();

        await takeScreenshot(page, `httpbin-html-${roleName}`);

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html>');
        expect(html).toContain('Herman Melville');

        console.log(`[${roleName}] HTML response received (${html.length} chars)`);
      });

      test(`[${roleName}] TC-HTTP-010: API request context`, async ({ page, request }) => {
        // Using Playwright's API request context for direct API testing
        const response = await request.get(`${BASE_URL}/get`, {
          params: {
            role: roleName,
            test: 'playwright-api',
          },
        });

        expect(response.ok()).toBe(true);

        const json = await response.json();
        expect(json.args.role).toBe(roleName);
        expect(json.args.test).toBe('playwright-api');

        console.log(`[${roleName}] API request context test passed`);
        console.log(`  URL: ${json.url}`);
        console.log(`  Origin: ${json.origin}`);
      });

    });
  }
});
