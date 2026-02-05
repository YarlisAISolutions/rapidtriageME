# RapidTriageME Playwright Test Suite

Interactive and automated testing for the RapidTriageME Chrome extension.

## Prerequisites

- Node.js 18+
- Chrome browser (installed automatically by Playwright)

## Installation

```bash
cd test-suite/playwright
npm install
npx playwright install chromium
```

## Interactive Player Mode

The extension player provides an interactive way to test all extension features step-by-step:

```bash
npm test
# or
node extension-player.js
```

### Player Commands

| Command | Action |
|---------|--------|
| `p` | Play/auto-run all steps |
| `n` | Next step |
| `b` | Back (browser back) |
| `r` | Replay current step |
| `j` | Jump to specific step |
| `l` | List all steps |
| `s` | Stop/quit |

### Test Steps

The player tests the following features:

**Setup**
1. Navigate to test page
2. Open extension popup

**Core Functions**
3. Test server connection
4. Take screenshot
5. Inject test console logs

**Debug Tools**
6. Capture console logs
7. Capture network requests
8. Inspect element

**Audit Tools**
9. Run performance check
10. Run accessibility check
11. Run SEO check
12. Run best practices check

**Modes**
13. Debug mode simulation
14. Audit mode simulation

**Cleanup**
15. Clear all logs
16. Final screenshot

## Automated Tests

Run the full automated test suite:

```bash
npx playwright test
```

Run with UI:
```bash
npx playwright test --ui
```

Run specific test file:
```bash
npx playwright test extension-test.spec.js
```

## Test Results

After running tests:
- Screenshots: `screenshots/`
- Test results: `test-results/`
- HTML report: `test-results/html-report/`

View HTML report:
```bash
npx playwright show-report test-results/html-report
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RAPIDTRIAGE_SERVER_URL` | `http://localhost:3025` | Browser server URL |
| `HEADLESS` | `false` | Run in headless mode |

### Extension Path

The extension is loaded from `../../rapidtriage-extension`. Ensure the extension files are present.

## Test Categories

### Extension Loading
- Extension loads successfully
- Popup is accessible
- Options page is accessible

### Core Functions
- Page navigation
- Console log capture
- Network request capture
- Screenshot capture

### Performance Metrics
- Performance timing capture
- Resource counting

### Accessibility Checks
- H1 presence
- Image alt attributes

### SEO Checks
- Page title
- Meta description
- Viewport meta

### Extension Popup UI
- Core function buttons present
- Audit buttons present
- Debug buttons present
- Mode buttons present

### Server Connection
- Browser server health check

## Troubleshooting

### Extension not loading
1. Verify extension path: `../../rapidtriage-extension/manifest.json` exists
2. Check Chrome DevTools for extension errors
3. Ensure all extension files are present

### Server connection fails
1. Start the browser server: `cd rapidtriage-server && npm start`
2. Verify server is running on port 3025
3. Check firewall settings

### Tests timing out
1. Increase timeout in `playwright.config.js`
2. Check network connectivity
3. Run tests with `--debug` flag for more info

## Writing New Tests

Add new tests to `extension-test.spec.js`:

```javascript
test.describe("My Feature", () => {
  test("should do something", async () => {
    // Test code here
    await page.goto("https://example.com");
    expect(await page.title()).toContain("Example");
  });
});
```

Add new player steps to `extension-player.js`:

```javascript
{
  name: "My New Step",
  category: "My Category",
  run: async () => {
    // Step code here
    logSuccess("Step completed");
  },
},
```
