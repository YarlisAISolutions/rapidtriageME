# RapidTriageME Test Suite

Comprehensive test suite for the RapidTriageME platform, including API tests, browser tests, extension tests, and integration tests.

## 📁 Test Structure

```
test/
├── 01-unit/           # Unit tests for individual functions
├── 02-api/            # API endpoint tests
├── 03-browser/        # Browser automation tests
├── 04-extension/      # Chrome extension tests
├── 05-integration/    # Integration tests
├── 06-e2e/           # End-to-end tests
├── 07-performance/    # Performance tests
├── 08-security/       # Security tests
├── config/           # Test configuration
├── fixtures/         # Test data and HTML fixtures
├── reports/          # Test reports output
├── utils/            # Test utilities and helpers
└── run-all-tests.js  # Master test runner
```

## 🚀 Quick Start

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API tokens
```

3. For extension tests, ensure Chrome is installed.

### Running Tests

#### Run all tests:
```bash
npm test
```

#### Run specific test suites:
```bash
# API tests only
npm run test:api

# Extension tests only
npm run test:extension

# Integration tests only
npm run test:integration
```

#### Run with specific environment:
```bash
# Test against production
ENVIRONMENT=production npm test

# Test against local
ENVIRONMENT=development npm test
```

## 📊 Test Suites

### 1. API Tests (`02-api/`)
Tests all REST API endpoints including:
- Health checks
- Screenshot upload/retrieval
- Console and network logs
- Lighthouse audits
- Authentication

**Run:** `npm run test:api`

### 2. Browser Tests (`03-browser/`)
Tests browser automation features:
- DevTools integration
- Page navigation
- JavaScript execution
- Element inspection

**Run:** `npm run test:browser`

### 3. Extension Tests (`04-extension/`)
Tests Chrome extension functionality:
- Popup UI elements
- Button interactions
- API communication
- Settings management

**Run:** `npm run test:extension`

### 4. Integration Tests (`05-integration/`)
Tests system integration:
- Multiple component interaction
- Data flow between services
- Mode switching (debug/audit)
- Session management

**Run:** `npm run test:integration`

### 5. E2E Tests (`06-e2e/`)
Complete user journey tests:
- Full workflow scenarios
- Real browser interactions
- Multi-step processes

**Run:** `npm run test:e2e`

### 6. Performance Tests (`07-performance/`)
Performance benchmarks:
- API response times
- Resource usage
- Load testing
- Concurrent request handling

**Run:** `npm run test:performance`

### 7. Security Tests (`08-security/`)
Security validation:
- Authentication tests
- Authorization checks
- Input validation
- XSS/CSRF protection

**Run:** `npm run test:security`

## 📈 Test Reports

Test results are saved in multiple formats:

1. **JSON Reports:** `test/reports/*.json`
   - Machine-readable format
   - Detailed test results
   - Timing information

2. **HTML Report:** `test/reports/test-report.html`
   - Visual test summary
   - Success/failure breakdown
   - Open in browser for best view

3. **Console Output:**
   - Real-time test progress
   - Color-coded results
   - Immediate feedback

## 🔧 Configuration

Test configuration is in `test/config/test.config.js`:

```javascript
{
  api: {
    baseUrl: 'https://rapidtriage.me',
    token: 'your-api-token'
  },
  browser: {
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  timeouts: {
    api: 15000,
    browser: 30000
  }
}
```

## 🐛 Debugging Tests

### Run tests in debug mode:
```bash
DEBUG=true npm test
```

### Run with verbose output:
```bash
TEST_VERBOSE=true npm test
```

### Run specific test file:
```bash
node test/02-api/api-test-suite.js
```

### Run tests with Chrome visible (for extension tests):
```bash
TEST_HEADLESS=false npm run test:extension
```

## 📝 Writing New Tests

### Adding API Tests

Create a new file in `test/02-api/`:

```javascript
const config = require('../config/test.config');

async function testNewEndpoint() {
  const response = await fetch(config.getApiUrl('/new-endpoint'), {
    headers: config.getHeaders()
  });
  
  if (!response.ok) {
    throw new Error(`Test failed: ${response.status}`);
  }
}
```

### Adding Browser Tests

Use Puppeteer for browser automation in `test/03-browser/`:

```javascript
const puppeteer = require('puppeteer');

async function testBrowserFeature() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://example.com');
  // Your test logic here
  
  await browser.close();
}
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - uses: actions/upload-artifact@v2
        with:
          name: test-reports
          path: test/reports/
```

### Environment Variables for CI

```bash
CI=true                          # Skip browser-based tests
ENVIRONMENT=production           # Test environment
RAPIDTRIAGE_API_TOKEN=xxx       # API token
TEST_HEADLESS=true              # Run browser tests headless
```

## 🚨 Common Issues

### Issue: Extension tests fail
**Solution:** Ensure Chrome is installed and extension path is correct.

### Issue: API tests timeout
**Solution:** Check network connection and API token validity.

### Issue: Permission denied
**Solution:** Run `chmod +x test/*.js` to make test files executable.

### Issue: Missing dependencies
**Solution:** Run `npm install` to install all required packages.

## 📦 Required Dependencies

Add to your `package.json`:

```json
{
  "devDependencies": {
    "puppeteer": "^21.0.0",
    "node-fetch": "^2.6.7",
    "colors": "^1.4.0",
    "dotenv": "^16.0.3"
  }
}
```

## 🎯 Test Coverage Goals

- **API Coverage:** 100% of endpoints
- **UI Coverage:** All user-facing features
- **Integration:** Critical user paths
- **Performance:** Response times < 1s
- **Security:** All auth paths validated

## 📞 Support

For test-related issues:
1. Check this README
2. Review test reports in `test/reports/`
3. Check CI logs if available
4. File an issue with test logs attached

---

*Last Updated: January 2025*
*Test Suite Version: 1.0.0*