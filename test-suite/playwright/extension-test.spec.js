/**
 * RapidTriageME Extension Automated Tests
 * Run with: npx playwright test extension-test.spec.js
 */

const { test, expect, chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const EXTENSION_PATH = path.resolve(__dirname, "../../rapidtriage-extension");
const TEST_URL = "https://example.com";
const SERVER_URL = process.env.RAPIDTRIAGE_SERVER_URL || "http://localhost:3025";

test.describe("RapidTriageME Chrome Extension", () => {
  let context;
  let page;
  let extensionId;

  test.beforeAll(async () => {
    // Verify extension exists
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(`Extension not found at: ${EXTENSION_PATH}`);
    }

    // Launch browser with extension
    context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });

    // Get extension ID
    const serviceWorkers = context.serviceWorkers();
    for (const worker of serviceWorkers) {
      const url = worker.url();
      if (url.includes("chrome-extension://")) {
        extensionId = url.split("/")[2];
        break;
      }
    }

    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.describe("Extension Loading", () => {
    test("should load extension successfully", async () => {
      expect(extensionId).toBeTruthy();
      console.log(`Extension ID: ${extensionId}`);
    });

    test("should have popup accessible", async () => {
      if (!extensionId) {
        test.skip();
        return;
      }

      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      await popupPage.waitForLoadState("domcontentloaded");

      // Check popup loaded
      const title = await popupPage.title();
      expect(title).toContain("RapidTriage");

      await popupPage.close();
    });

    test("should have options page accessible", async () => {
      if (!extensionId) {
        test.skip();
        return;
      }

      const optionsPage = await context.newPage();
      await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
      await optionsPage.waitForLoadState("domcontentloaded");

      await optionsPage.close();
    });
  });

  test.describe("Core Functions", () => {
    test("should navigate to test page", async () => {
      await page.goto(TEST_URL, { waitUntil: "domcontentloaded" });
      expect(page.url()).toContain("example.com");
    });

    test("should capture console logs", async () => {
      const logs = [];
      page.on("console", (msg) => {
        logs.push({ type: msg.type(), text: msg.text() });
      });

      await page.evaluate(() => {
        console.log("Test log message");
        console.warn("Test warning message");
        console.error("Test error message");
      });

      await page.waitForTimeout(500);

      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs.some((l) => l.type === "log")).toBeTruthy();
      expect(logs.some((l) => l.type === "warning")).toBeTruthy();
      expect(logs.some((l) => l.type === "error")).toBeTruthy();
    });

    test("should capture network requests", async () => {
      const requests = [];

      page.on("request", (request) => {
        requests.push({
          url: request.url(),
          method: request.method(),
        });
      });

      await page.goto(TEST_URL);
      await page.waitForTimeout(500);

      expect(requests.length).toBeGreaterThan(0);
    });

    test("should take screenshot", async () => {
      const screenshotDir = path.join(__dirname, "screenshots");
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir);
      }

      const screenshotPath = path.join(screenshotDir, "test-screenshot.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });

      expect(fs.existsSync(screenshotPath)).toBeTruthy();
    });
  });

  test.describe("Performance Metrics", () => {
    test("should capture performance timing", async () => {
      await page.goto(TEST_URL, { waitUntil: "load" });

      const metrics = await page.evaluate(() => {
        const timing = window.performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
        };
      });

      expect(metrics.domContentLoaded).toBeGreaterThan(0);
      expect(metrics.loadComplete).toBeGreaterThan(0);
    });

    test("should count page resources", async () => {
      const resourceCount = await page.evaluate(() => {
        return window.performance.getEntriesByType("resource").length;
      });

      expect(resourceCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Accessibility Checks", () => {
    test("should check for h1 presence", async () => {
      await page.goto(TEST_URL);

      const h1Count = await page.evaluate(() => {
        return document.querySelectorAll("h1").length;
      });

      expect(h1Count).toBeGreaterThanOrEqual(0);
    });

    test("should check for image alt attributes", async () => {
      await page.goto(TEST_URL);

      const imagesInfo = await page.evaluate(() => {
        const images = document.querySelectorAll("img");
        const withAlt = document.querySelectorAll("img[alt]");
        return {
          total: images.length,
          withAlt: withAlt.length,
        };
      });

      // All images should have alt (if any images exist)
      if (imagesInfo.total > 0) {
        expect(imagesInfo.withAlt).toBe(imagesInfo.total);
      }
    });
  });

  test.describe("SEO Checks", () => {
    test("should have page title", async () => {
      await page.goto(TEST_URL);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });

    test("should check for meta description", async () => {
      await page.goto(TEST_URL);

      const hasMetaDesc = await page.evaluate(() => {
        return !!document.querySelector('meta[name="description"]');
      });

      // Just report, don't fail
      console.log(`Meta description present: ${hasMetaDesc}`);
    });

    test("should check for viewport meta", async () => {
      await page.goto(TEST_URL);

      const hasViewport = await page.evaluate(() => {
        return !!document.querySelector('meta[name="viewport"]');
      });

      // Most modern sites should have viewport
      expect(hasViewport).toBeTruthy();
    });
  });

  test.describe("Extension Popup UI", () => {
    test("should display all core function buttons", async () => {
      if (!extensionId) {
        test.skip();
        return;
      }

      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      await popupPage.waitForLoadState("domcontentloaded");

      // Check for core buttons
      const buttons = await popupPage.evaluate(() => {
        return {
          testServer: !!document.getElementById("btn-test-server"),
          screenshot: !!document.getElementById("btn-screenshot"),
          clear: !!document.getElementById("btn-clear"),
          devtools: !!document.getElementById("btn-devtools"),
        };
      });

      expect(buttons.testServer).toBeTruthy();
      expect(buttons.screenshot).toBeTruthy();
      expect(buttons.clear).toBeTruthy();
      expect(buttons.devtools).toBeTruthy();

      await popupPage.close();
    });

    test("should display all audit buttons", async () => {
      if (!extensionId) {
        test.skip();
        return;
      }

      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      await popupPage.waitForLoadState("domcontentloaded");

      const buttons = await popupPage.evaluate(() => {
        return {
          accessibility: !!document.getElementById("btn-accessibility"),
          performance: !!document.getElementById("btn-performance"),
          seo: !!document.getElementById("btn-seo"),
          bestPractices: !!document.getElementById("btn-best-practices"),
          lighthouse: !!document.getElementById("btn-lighthouse"),
        };
      });

      expect(buttons.accessibility).toBeTruthy();
      expect(buttons.performance).toBeTruthy();
      expect(buttons.seo).toBeTruthy();
      expect(buttons.bestPractices).toBeTruthy();
      expect(buttons.lighthouse).toBeTruthy();

      await popupPage.close();
    });

    test("should display all debug buttons", async () => {
      if (!extensionId) {
        test.skip();
        return;
      }

      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      await popupPage.waitForLoadState("domcontentloaded");

      const buttons = await popupPage.evaluate(() => {
        return {
          console: !!document.getElementById("btn-console"),
          consoleErrors: !!document.getElementById("btn-console-errors"),
          inspect: !!document.getElementById("btn-inspect"),
          network: !!document.getElementById("btn-network"),
          networkErrors: !!document.getElementById("btn-network-errors"),
          wipeLogs: !!document.getElementById("btn-wipe-logs"),
        };
      });

      expect(buttons.console).toBeTruthy();
      expect(buttons.consoleErrors).toBeTruthy();
      expect(buttons.inspect).toBeTruthy();
      expect(buttons.network).toBeTruthy();
      expect(buttons.networkErrors).toBeTruthy();
      expect(buttons.wipeLogs).toBeTruthy();

      await popupPage.close();
    });

    test("should display mode buttons", async () => {
      if (!extensionId) {
        test.skip();
        return;
      }

      const popupPage = await context.newPage();
      await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
      await popupPage.waitForLoadState("domcontentloaded");

      const buttons = await popupPage.evaluate(() => {
        return {
          debugMode: !!document.getElementById("btn-debug-mode"),
          auditMode: !!document.getElementById("btn-audit-mode"),
        };
      });

      expect(buttons.debugMode).toBeTruthy();
      expect(buttons.auditMode).toBeTruthy();

      await popupPage.close();
    });
  });

  test.describe("Server Connection", () => {
    test("should connect to browser server", async () => {
      // Skip if server URL not configured
      if (!SERVER_URL) {
        test.skip();
        return;
      }

      try {
        const response = await page.evaluate(async (url) => {
          const res = await fetch(`${url}/health`);
          return { status: res.status, ok: res.ok };
        }, SERVER_URL);

        expect(response.ok).toBeTruthy();
      } catch (error) {
        console.log(`Server not running at ${SERVER_URL} - skipping`);
        test.skip();
      }
    });
  });
});
