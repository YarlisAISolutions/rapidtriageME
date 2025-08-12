# Comprehensive Test Suite

## Overview

RapidTriageME includes a comprehensive automated test suite that validates all API endpoints, authentication flows, and system functionality. The test suite provides real-time progress tracking, detailed reporting, and visual test results.

## Features

### 🚀 Core Capabilities

- **41+ Automated Tests** covering all critical functionality
- **Real-time Progress Tracking** with console progress bars
- **Visual Test Reports** with HTML and JSON output
- **Screenshot Capture** for failed tests using Puppeteer
- **Expected vs Actual Results** comparison
- **Response Header Capture** for debugging
- **Category-based Organization** for easy navigation

### 📊 Test Coverage Areas

1. **Authentication (4 tests)**
   - User registration
   - Login flows
   - Profile management
   - Token validation

2. **API Key Management (3 tests)**
   - Key creation
   - Key listing with pagination
   - Key revocation

3. **Browser Operations (7 tests)**
   - Screenshot capture (PNG, JPEG, WebP)
   - Full page screenshots
   - Custom viewport screenshots
   - Browser navigation

4. **Debugging Tools (6 tests)**
   - Console log retrieval
   - Network log analysis
   - Triage report generation
   - Log level filtering

5. **Dashboard & Monitoring (3 tests)**
   - Health checks
   - Metrics collection
   - Status pages

6. **Error Handling (8 tests)**
   - Invalid credentials
   - Duplicate registrations
   - Malformed requests
   - Token expiration

7. **Documentation (4 tests)**
   - API documentation access
   - OpenAPI spec (JSON/YAML)
   - CORS preflight

## Running the Test Suite

### Basic Execution

```bash
# Run all tests
node test-lifecycle.js

# Run with full screenshot capture
CAPTURE_ALL_SCREENSHOTS=true node test-lifecycle.js

# Run against production
TEST_URL=https://api.rapidtriage.me node test-lifecycle.js
```

### Test Output

The test suite provides multiple output formats:

#### Console Output
- Real-time progress bar showing test execution
- Color-coded pass/fail indicators
- Detailed request/response logging
- Category-wise progress tracking

#### HTML Report
- Interactive visual report
- Side-by-side expected vs actual results
- Response headers for each test
- Screenshot gallery (for failed tests)
- Category-wise success metrics
- Execution timeline visualization

#### JSON Report
- Machine-readable test results
- Complete request/response data
- Timing and performance metrics
- Suitable for CI/CD integration

## Test Report Features

### Progress Indicators

```
Progress: [████████████████████░░░░░░░░░░░░░░░░░░░] 40% (12/30)
```

- Real-time console progress bar
- Visual progress in HTML report
- Category-wise progress breakdown
- Execution timeline with timestamps

### Expected vs Actual Results

Each test displays:
- **Expected Result**: Status code and description
- **Actual Result**: Real response data
- **Match Status**: Pass/fail determination
- **Response Headers**: Full header capture

### Screenshot Capture

- Automatic screenshots for failed tests
- Optional full screenshot mode
- Puppeteer-based browser automation
- Visual test result cards

## Viewing Test Results

### Serve HTML Report

```bash
# Start report server
node serve-report.js

# View at http://localhost:8080
```

### View Summary

```bash
# Display test summary
node view-test-summary.js
```

### Direct File Access

Reports are saved in the `reports/` directory:
- `test-report-TIMESTAMP.html` - Visual report
- `test-report-TIMESTAMP.json` - Raw data

## Test Categories

### Authentication Tests
- User registration with validation
- Login with credentials
- Profile retrieval and updates
- Token refresh flows

### API Key Tests
- Create keys with permissions
- List keys with pagination
- Revoke keys
- Permission validation

### Browser Operation Tests
- Screenshot capture formats
- Full page captures
- Custom viewport sizes
- Navigation commands

### Debugging Tests
- Console log retrieval
- Network analysis
- Error tracking
- Performance metrics

### Error Handling Tests
- Invalid credentials
- Duplicate registrations
- Malformed requests
- Rate limiting
- Token expiration

## Integration with CI/CD

### GitHub Actions

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node test-lifecycle.js
      - uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-reports
          path: reports/
```

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed
- `2` - Test suite error

## Custom Test Configuration

### Environment Variables

```bash
# API endpoint
TEST_URL=http://localhost:8787

# Screenshot capture
CAPTURE_ALL_SCREENSHOTS=true

# Test credentials
TEST_EMAIL=test@example.com
TEST_PASSWORD=SecurePass123!
```

### Test Customization

Edit `test-lifecycle.js` to:
- Add new test cases
- Modify test categories
- Adjust timeouts
- Change report formats

## Performance Metrics

Typical test execution times:
- Full suite: ~1 second
- Average per test: 10-15ms
- Screenshot capture: 50-100ms
- Report generation: <100ms

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Check network connectivity
   - Verify API is running
   - Increase timeout values

2. **Screenshot failures**
   - Ensure Puppeteer is installed
   - Check system resources
   - Verify Chrome/Chromium availability

3. **Report not displaying**
   - Use `serve-report.js` for proper serving
   - Check file permissions
   - Verify browser compatibility

## Best Practices

1. **Run tests regularly**
   - Before deployments
   - After configuration changes
   - As part of CI/CD pipeline

2. **Monitor trends**
   - Track execution times
   - Watch for flaky tests
   - Identify performance regressions

3. **Maintain test data**
   - Use unique test emails
   - Clean up test artifacts
   - Rotate API keys

## Advanced Features

### Parallel Execution

Future enhancement for faster test runs:
```javascript
// Planned feature
const testRunner = new ParallelTestRunner({
  workers: 4,
  categories: ['auth', 'api', 'browser', 'debug']
});
```

### Custom Reporters

Extend reporting capabilities:
```javascript
class SlackReporter {
  async report(results) {
    // Send results to Slack
  }
}
```

### Test Data Management

Automated test data cleanup:
```javascript
async function cleanupTestData() {
  // Remove test users
  // Revoke test API keys
  // Clear test screenshots
}
```

## Summary

The RapidTriageME test suite provides comprehensive validation of all system functionality with advanced reporting and visualization capabilities. Regular test execution ensures system reliability and helps identify issues early in the development cycle.