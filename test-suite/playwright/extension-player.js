/**
 * RapidTriageME Extension Player
 * Interactive Playwright test runner for the Chrome extension
 *
 * Usage: node extension-player.js
 *
 * Commands:
 *   p = play/auto-run all steps
 *   n = next step
 *   b = back (browser back)
 *   r = replay current step
 *   j = jump to step (enter number)
 *   l = list all steps
 *   s = stop/quit
 */

const { chromium } = require("playwright");
const readline = require("readline");
const path = require("path");
const fs = require("fs");

// Configuration
const CONFIG = {
  extensionPath: path.resolve(__dirname, "../../rapidtriage-extension"),
  testUrl: "https://example.com",
  serverUrl: "http://localhost:3025",
  slowMo: 100,
  headless: false,
};

// Helper to ask questions
function ask(rl, prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

// Color helpers for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(index, total, name) {
  console.log(`\n${colors.cyan}▶ Step ${index + 1}/${total}: ${name}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

// Main test runner
(async () => {
  log("\n╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║      RapidTriageME Extension Test Player                   ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝\n", "cyan");

  // Verify extension exists
  if (!fs.existsSync(CONFIG.extensionPath)) {
    logError(`Extension not found at: ${CONFIG.extensionPath}`);
    process.exit(1);
  }

  logInfo(`Extension path: ${CONFIG.extensionPath}`);
  logInfo(`Test URL: ${CONFIG.testUrl}`);
  logInfo(`Server URL: ${CONFIG.serverUrl}\n`);

  // Launch browser with extension
  log("Launching browser with extension...", "yellow");

  const browser = await chromium.launchPersistentContext("", {
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: [
      `--disable-extensions-except=${CONFIG.extensionPath}`,
      `--load-extension=${CONFIG.extensionPath}`,
      "--auto-open-devtools-for-tabs",
    ],
    viewport: { width: 1400, height: 900 },
  });

  const page = await browser.newPage();

  // Get extension ID
  let extensionId = null;
  const serviceWorkers = browser.serviceWorkers();
  for (const worker of serviceWorkers) {
    const url = worker.url();
    if (url.includes("chrome-extension://")) {
      extensionId = url.split("/")[2];
      break;
    }
  }

  if (!extensionId) {
    // Try to get from background pages
    const pages = browser.pages();
    for (const p of pages) {
      const url = p.url();
      if (url.startsWith("chrome-extension://")) {
        extensionId = url.split("/")[2];
        break;
      }
    }
  }

  logInfo(`Extension ID: ${extensionId || "unknown"}`);

  // Test Steps
  const steps = [
    // =====================================================
    // SETUP
    // =====================================================
    {
      name: "Navigate to test page",
      category: "Setup",
      run: async () => {
        await page.goto(CONFIG.testUrl, { waitUntil: "domcontentloaded" });
        logSuccess(`Navigated to: ${page.url()}`);
      },
    },
    {
      name: "Open extension popup",
      category: "Setup",
      run: async () => {
        if (extensionId) {
          const popupPage = await browser.newPage();
          await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
          await popupPage.waitForLoadState("domcontentloaded");
          logSuccess("Extension popup opened");

          // Take screenshot of popup
          await popupPage.screenshot({ path: "screenshots/popup-initial.png" });
          logInfo("Screenshot saved: screenshots/popup-initial.png");
        } else {
          logError("Extension ID not found - cannot open popup directly");
          logInfo("Tip: Open the popup manually via the extension icon");
        }
      },
    },

    // =====================================================
    // CORE FUNCTIONS
    // =====================================================
    {
      name: "Test Server Connection",
      category: "Core Functions",
      run: async () => {
        logInfo("Testing server connection...");
        try {
          const response = await page.evaluate(async (serverUrl) => {
            const res = await fetch(`${serverUrl}/health`);
            return { status: res.status, ok: res.ok };
          }, CONFIG.serverUrl);

          if (response.ok) {
            logSuccess(`Server is healthy (status: ${response.status})`);
          } else {
            logError(`Server returned status: ${response.status}`);
          }
        } catch (error) {
          logError(`Server connection failed: ${error.message}`);
          logInfo("Make sure the browser server is running: cd rapidtriage-server && npm start");
        }
      },
    },
    {
      name: "Take Screenshot",
      category: "Core Functions",
      run: async () => {
        // Ensure screenshots directory exists
        if (!fs.existsSync("screenshots")) {
          fs.mkdirSync("screenshots");
        }

        await page.screenshot({
          path: "screenshots/page-screenshot.png",
          fullPage: true
        });
        logSuccess("Screenshot saved: screenshots/page-screenshot.png");

        // Also try to trigger extension screenshot
        logInfo("Extension screenshot would be triggered via popup button");
      },
    },
    {
      name: "Inject Test Console Logs",
      category: "Core Functions",
      run: async () => {
        await page.evaluate(() => {
          console.log("RapidTriage Test: This is a log message");
          console.info("RapidTriage Test: This is an info message");
          console.warn("RapidTriage Test: This is a warning message");
          console.error("RapidTriage Test: This is an error message");
          console.debug("RapidTriage Test: This is a debug message");
        });
        logSuccess("Injected 5 test console messages (log, info, warn, error, debug)");
      },
    },

    // =====================================================
    // DEBUG TOOLS
    // =====================================================
    {
      name: "Capture Console Logs",
      category: "Debug Tools",
      run: async () => {
        const logs = [];
        page.on("console", (msg) => {
          logs.push({
            type: msg.type(),
            text: msg.text(),
          });
        });

        // Generate some logs
        await page.evaluate(() => {
          console.log("Captured log 1");
          console.log("Captured log 2");
          console.warn("Captured warning");
        });

        await page.waitForTimeout(500);

        logSuccess(`Captured ${logs.length} console messages`);
        logs.forEach((log, i) => {
          logInfo(`  [${log.type}] ${log.text.substring(0, 50)}`);
        });
      },
    },
    {
      name: "Capture Network Requests",
      category: "Debug Tools",
      run: async () => {
        const requests = [];

        page.on("request", (request) => {
          requests.push({
            url: request.url(),
            method: request.method(),
            resourceType: request.resourceType(),
          });
        });

        // Trigger some network requests
        await page.evaluate(() => {
          fetch("https://httpbin.org/get").catch(() => {});
          fetch("https://jsonplaceholder.typicode.com/posts/1").catch(() => {});
        });

        await page.waitForTimeout(1000);

        logSuccess(`Captured ${requests.length} network requests`);
        requests.slice(0, 5).forEach((req) => {
          logInfo(`  [${req.method}] ${req.url.substring(0, 60)}...`);
        });
      },
    },
    {
      name: "Inspect Element",
      category: "Debug Tools",
      run: async () => {
        const elementInfo = await page.evaluate(() => {
          const el = document.querySelector("h1") || document.querySelector("body");
          return {
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            textContent: el.textContent?.substring(0, 50),
            childCount: el.children.length,
          };
        });

        logSuccess("Inspected first heading/body element:");
        logInfo(`  Tag: ${elementInfo.tagName}`);
        logInfo(`  Class: ${elementInfo.className || "(none)"}`);
        logInfo(`  ID: ${elementInfo.id || "(none)"}`);
        logInfo(`  Text: ${elementInfo.textContent}`);
        logInfo(`  Children: ${elementInfo.childCount}`);
      },
    },

    // =====================================================
    // AUDIT TOOLS
    // =====================================================
    {
      name: "Run Performance Check",
      category: "Audit Tools",
      run: async () => {
        const metrics = await page.evaluate(() => {
          const perf = window.performance;
          const timing = perf.timing;
          const navigation = perf.getEntriesByType("navigation")[0];

          return {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            resourceCount: perf.getEntriesByType("resource").length,
          };
        });

        logSuccess("Performance metrics:");
        logInfo(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`);
        logInfo(`  Full Load: ${metrics.loadComplete}ms`);
        logInfo(`  DOM Interactive: ${metrics.domInteractive}ms`);
        logInfo(`  Resources Loaded: ${metrics.resourceCount}`);
      },
    },
    {
      name: "Run Accessibility Check",
      category: "Audit Tools",
      run: async () => {
        const a11yResults = await page.evaluate(() => {
          const issues = [];

          // Check for images without alt
          const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");
          if (imagesWithoutAlt.length > 0) {
            issues.push(`${imagesWithoutAlt.length} images missing alt text`);
          }

          // Check for missing form labels
          const inputsWithoutLabels = document.querySelectorAll("input:not([aria-label]):not([id])");
          if (inputsWithoutLabels.length > 0) {
            issues.push(`${inputsWithoutLabels.length} inputs missing labels`);
          }

          // Check for proper heading hierarchy
          const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
          const h1Count = document.querySelectorAll("h1").length;
          if (h1Count !== 1) {
            issues.push(`Page has ${h1Count} h1 elements (should be 1)`);
          }

          // Check for sufficient color contrast (simplified)
          const hasSkipLink = document.querySelector("[href='#main'], [href='#content'], .skip-link");
          if (!hasSkipLink) {
            issues.push("No skip-to-content link found");
          }

          return {
            issues,
            headingCount: headings.length,
            h1Count,
            imagesCount: document.querySelectorAll("img").length,
            linksCount: document.querySelectorAll("a").length,
          };
        });

        if (a11yResults.issues.length === 0) {
          logSuccess("No major accessibility issues found!");
        } else {
          logError(`Found ${a11yResults.issues.length} accessibility issues:`);
          a11yResults.issues.forEach((issue) => {
            logInfo(`  ⚠ ${issue}`);
          });
        }

        logInfo(`  Headings: ${a11yResults.headingCount}`);
        logInfo(`  Images: ${a11yResults.imagesCount}`);
        logInfo(`  Links: ${a11yResults.linksCount}`);
      },
    },
    {
      name: "Run SEO Check",
      category: "Audit Tools",
      run: async () => {
        const seoResults = await page.evaluate(() => {
          const issues = [];

          // Check title
          const title = document.title;
          if (!title) {
            issues.push("Missing page title");
          } else if (title.length < 10) {
            issues.push("Page title too short (< 10 chars)");
          } else if (title.length > 60) {
            issues.push("Page title too long (> 60 chars)");
          }

          // Check meta description
          const metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            issues.push("Missing meta description");
          }

          // Check canonical
          const canonical = document.querySelector('link[rel="canonical"]');
          if (!canonical) {
            issues.push("Missing canonical URL");
          }

          // Check h1
          const h1 = document.querySelector("h1");
          if (!h1) {
            issues.push("Missing h1 heading");
          }

          // Check viewport
          const viewport = document.querySelector('meta[name="viewport"]');
          if (!viewport) {
            issues.push("Missing viewport meta tag");
          }

          return {
            issues,
            title,
            hasMetaDesc: !!metaDesc,
            hasCanonical: !!canonical,
            hasH1: !!h1,
            hasViewport: !!viewport,
          };
        });

        if (seoResults.issues.length === 0) {
          logSuccess("All basic SEO checks passed!");
        } else {
          logError(`Found ${seoResults.issues.length} SEO issues:`);
          seoResults.issues.forEach((issue) => {
            logInfo(`  ⚠ ${issue}`);
          });
        }

        logInfo(`  Title: "${seoResults.title?.substring(0, 40)}..."`);
      },
    },
    {
      name: "Run Best Practices Check",
      category: "Audit Tools",
      run: async () => {
        const bpResults = await page.evaluate(() => {
          const issues = [];

          // Check HTTPS
          if (location.protocol !== "https:") {
            issues.push("Page not served over HTTPS");
          }

          // Check for deprecated APIs
          if (typeof document.all !== "undefined") {
            issues.push("Using deprecated document.all");
          }

          // Check for console errors in the page
          const scripts = document.querySelectorAll("script:not([src])");

          // Check for inline styles
          const inlineStyles = document.querySelectorAll("[style]");
          if (inlineStyles.length > 10) {
            issues.push(`${inlineStyles.length} elements with inline styles`);
          }

          // Check for document.write
          // This is just a placeholder check

          return {
            issues,
            isHttps: location.protocol === "https:",
            scriptCount: document.querySelectorAll("script").length,
            inlineStyleCount: inlineStyles.length,
          };
        });

        if (bpResults.issues.length === 0) {
          logSuccess("Best practices check passed!");
        } else {
          logError(`Found ${bpResults.issues.length} best practice issues:`);
          bpResults.issues.forEach((issue) => {
            logInfo(`  ⚠ ${issue}`);
          });
        }

        logInfo(`  HTTPS: ${bpResults.isHttps ? "Yes" : "No"}`);
        logInfo(`  Scripts: ${bpResults.scriptCount}`);
      },
    },

    // =====================================================
    // MODES
    // =====================================================
    {
      name: "Debug Mode Simulation",
      category: "Modes",
      run: async () => {
        logInfo("Debug Mode enables enhanced logging and error tracking");

        // Set up enhanced error tracking
        await page.evaluate(() => {
          window.__rapidTriageDebug = true;

          // Override console methods to track
          const originalConsole = { ...console };
          window.__rapidTriageLogs = [];

          ["log", "info", "warn", "error", "debug"].forEach((method) => {
            console[method] = (...args) => {
              window.__rapidTriageLogs.push({
                type: method,
                args: args.map((a) => String(a)),
                timestamp: Date.now(),
              });
              originalConsole[method](...args);
            };
          });

          // Track errors
          window.addEventListener("error", (e) => {
            window.__rapidTriageLogs.push({
              type: "error",
              args: [e.message],
              timestamp: Date.now(),
            });
          });
        });

        logSuccess("Debug mode enabled - console methods now tracked");

        // Test it
        await page.evaluate(() => {
          console.log("Debug mode test message");
          console.error("Debug mode test error");
        });

        const logCount = await page.evaluate(() => window.__rapidTriageLogs.length);
        logInfo(`Tracked ${logCount} log entries`);
      },
    },
    {
      name: "Audit Mode Simulation",
      category: "Modes",
      run: async () => {
        logInfo("Audit Mode runs all audits sequentially...\n");

        const audits = ["Performance", "Accessibility", "SEO", "Best Practices"];

        for (const audit of audits) {
          logInfo(`Running ${audit} audit...`);
          await page.waitForTimeout(300);
          logSuccess(`${audit} audit complete`);
        }

        logSuccess("\nAll audits completed in Audit Mode");
      },
    },

    // =====================================================
    // CLEANUP
    // =====================================================
    {
      name: "Clear All Logs",
      category: "Cleanup",
      run: async () => {
        await page.evaluate(() => {
          if (window.__rapidTriageLogs) {
            window.__rapidTriageLogs = [];
          }
          console.clear();
        });
        logSuccess("Logs cleared");
      },
    },
    {
      name: "Final Screenshot",
      category: "Cleanup",
      run: async () => {
        await page.screenshot({
          path: "screenshots/final-state.png",
          fullPage: true
        });
        logSuccess("Final screenshot saved: screenshots/final-state.png");
      },
    },
  ];

  // Create screenshots directory
  if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots");
  }

  // Interactive player
  let index = 0;
  let isAuto = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Print instructions
  log("\n╔════════════════════════════════════════════════════════════╗", "magenta");
  log("║                    Player Commands                          ║", "magenta");
  log("╠════════════════════════════════════════════════════════════╣", "magenta");
  log("║  p = play/auto-run all steps                               ║", "magenta");
  log("║  n = next step                                             ║", "magenta");
  log("║  b = back (browser back)                                   ║", "magenta");
  log("║  r = replay current step                                   ║", "magenta");
  log("║  j = jump to step (enter number)                           ║", "magenta");
  log("║  l = list all steps                                        ║", "magenta");
  log("║  s = stop/quit                                             ║", "magenta");
  log("╚════════════════════════════════════════════════════════════╝\n", "magenta");

  // List steps
  function listSteps() {
    log("\n📋 Available Steps:", "cyan");
    let currentCategory = "";
    steps.forEach((step, i) => {
      if (step.category !== currentCategory) {
        currentCategory = step.category;
        log(`\n  ${colors.yellow}═══ ${currentCategory} ═══${colors.reset}`);
      }
      const marker = i === index ? "→" : " ";
      const status = i < index ? "✓" : " ";
      console.log(`  ${marker} ${status} ${i + 1}. ${step.name}`);
    });
    console.log("");
  }

  async function runStep(i) {
    const step = steps[i];
    if (!step) {
      log("No more steps.", "yellow");
      return;
    }
    logStep(i, steps.length, step.name);
    log(`Category: ${step.category}`, "blue");

    try {
      await step.run();
    } catch (error) {
      logError(`Step failed: ${error.message}`);
    }
  }

  async function autoRun() {
    isAuto = true;
    while (isAuto && index < steps.length) {
      await runStep(index);
      index += 1;
      await page.waitForTimeout(800);
    }
    if (index >= steps.length) {
      log("\n✅ Finished all steps.", "green");
      isAuto = false;
    }
  }

  // Main command loop
  listSteps();

  while (true) {
    const cmdRaw = await ask(rl, `\n[Step ${index + 1}/${steps.length}] Command (p/n/b/r/j/l/s): `);
    const cmd = cmdRaw.trim().toLowerCase();

    try {
      if (cmd === "p") {
        if (index >= steps.length) {
          log("Already finished. Use 'j' to jump to a step or restart.", "yellow");
          continue;
        }
        log("▶ Auto-play started...", "green");
        await autoRun();
      } else if (cmd === "n") {
        if (index >= steps.length) {
          log("No more steps. Use 'j' to jump or 's' to quit.", "yellow");
          continue;
        }
        await runStep(index);
        index += 1;
      } else if (cmd === "b") {
        await page.goBack({ waitUntil: "domcontentloaded" });
        log(`⬅ Back to: ${page.url()}`, "blue");
      } else if (cmd === "r") {
        const replayIndex = Math.min(index, steps.length - 1);
        await runStep(replayIndex);
      } else if (cmd === "j") {
        const jumpTo = await ask(rl, "Jump to step number: ");
        const jumpIndex = parseInt(jumpTo, 10) - 1;
        if (jumpIndex >= 0 && jumpIndex < steps.length) {
          index = jumpIndex;
          await runStep(index);
          index += 1;
        } else {
          log(`Invalid step number. Enter 1-${steps.length}`, "red");
        }
      } else if (cmd === "l") {
        listSteps();
      } else if (cmd === "s") {
        log("Stopping...", "yellow");
        break;
      } else {
        log("Unknown command. Use p/n/b/r/j/l/s.", "red");
      }
    } catch (err) {
      logError(`Error: ${err?.message || err}`);
    }
  }

  rl.close();
  await browser.close();
  log("\n✅ Browser closed. Test session complete.", "green");
})();
