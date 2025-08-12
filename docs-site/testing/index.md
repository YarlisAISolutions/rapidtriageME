# Testing Process

## Overview

This guide provides a complete testing process for RapidTriageME, including local setup, verification steps, debugging workflows, and our comprehensive automated test suite.

## 🚀 Automated Test Suite

RapidTriageME includes a comprehensive test suite with **41+ automated tests** covering all critical functionality:

- ✅ **100% Pass Rate** - All tests currently passing
- 📊 **Real-time Progress Tracking** - Live console progress bars
- 📸 **Visual Reports** - HTML reports with screenshots
- 🎯 **Expected vs Actual** - Side-by-side result comparison
- 📈 **Category Organization** - Tests grouped by functionality

### Quick Test Execution

```bash
# Run complete test suite (~1 second)
node test-lifecycle.js

# Run with screenshot capture for all tests
CAPTURE_ALL_SCREENSHOTS=true node test-lifecycle.js

# View interactive HTML report
node serve-report.js
# Open http://localhost:8080
```

### Test Coverage
- **Authentication**: Registration, login, profile management
- **API Keys**: Creation, listing, revocation
- **Browser Ops**: Screenshots, navigation
- **Debugging**: Console/network logs, triage reports
- **Error Handling**: Validation, edge cases
- **Documentation**: API docs, OpenAPI specs

📖 [View Complete Test Suite Documentation](test-suite.md)

## Quick Test Setup

### 1. Start Required Services

```bash
# Terminal 1: Start Wrangler Dev Server (Port 3025)
cd /Users/yarlis/Downloads/rapidtriageME
npm run dev -- --port 3025

# Terminal 2: Start Browser Connector (Port 1422)
cd rapidtriage-server
npm start
```

### 2. Verify Services

```bash
# Check Wrangler Server
curl http://localhost:3025/health

# Check Browser Connector
curl http://localhost:1422/.identity
```

## Complete Testing Process

### Step 1: Environment Preparation

#### 1.1 Clone and Install

```bash
# Clone repository
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME

# Install dependencies
npm install
npm install -g wrangler
```

#### 1.2 Environment Configuration

```bash
# Create .env file
cp .env.example .env

# Set required variables
BROWSER_TOOLS_PORT=3025
NODE_ENV=development
```

### Step 2: Service Startup

#### 2.1 Start Wrangler Server

```bash
npm run dev -- --port 3025
```

**Expected Output:**
```
⛅️ wrangler 3.114.13
[wrangler:inf] Ready on http://localhost:3025
```

#### 2.2 Start Browser Connector

```bash
cd rapidtriage-server
npm start
```

**Expected Output:**
```
=== Browser Tools Server Started ===
Aggregator listening on http://0.0.0.0:1422
Available on: http://localhost:1422
```

### Step 3: Service Verification

#### 3.1 Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| **Wrangler** | `http://localhost:3025/health` | `{"status":"healthy","service":"RapidTriageME"}` |
| **Connector** | `http://localhost:1422/.identity` | `{"port":1422,"name":"rapidtriage-server"}` |

#### 3.2 Test Commands

```bash
# Test health endpoints
curl -s http://localhost:3025/health | jq .
curl -s http://localhost:1422/.identity | jq .

# Test log endpoints
curl http://localhost:1422/console-logs
curl http://localhost:1422/network-errors
curl http://localhost:1422/current-url
```

### Step 4: Chrome Extension Setup

#### 4.1 Load Extension

```bash
# Load extension in Chrome with DevTools
open -a "Google Chrome" --args \
  --load-extension=/Users/yarlis/Downloads/rapidtriageME/rapidtriage-extension \
  --auto-open-devtools-for-tabs
```

#### 4.2 Verify Extension

1. Open Chrome DevTools (F12)
2. Navigate to **RapidTriageME** panel
3. Check connection status indicator
4. Verify "Connected to server" message

### Step 5: IDE Configuration

#### 5.1 Cursor IDE Setup

Update `~/.cursor/mcp_settings.json`:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@rapidtriage/mcp-server"],
      "env": {
        "BROWSER_TOOLS_PORT": "1422",
        "BROWSER_TOOLS_HOST": "localhost"
      }
    }
  }
}
```

#### 5.2 VS Code Setup

Update `~/.continue/config.json`:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@rapidtriage/mcp-server"],
      "env": {
        "BROWSER_TOOLS_PORT": "1422"
      }
    }
  }
}
```

### Step 6: Functional Testing

#### 6.1 Test Page

Open the test page:

```bash
# Create and open test page
open /Users/yarlis/Downloads/rapidtriageME/test-rapidtriage.html
```

#### 6.2 Generate Test Data

Click buttons on test page to:
- Generate console logs
- Create error messages
- Trigger network requests
- Test performance metrics

#### 6.3 Verify Data Capture

```bash
# Check captured logs
curl http://localhost:1422/console-logs | jq .

# Check network requests
curl http://localhost:1422/all-xhr | jq .

# Check errors
curl http://localhost:1422/console-errors | jq .
```

## Testing Checklist

### ✅ Service Status

- [ ] Wrangler server running on port 3025
- [ ] Browser connector running on port 1422
- [ ] Health endpoints responding
- [ ] No port conflicts

### ✅ Chrome Extension

- [ ] Extension loaded successfully
- [ ] DevTools panel visible
- [ ] Connection indicator green
- [ ] Auto-discovery working

### ✅ Data Flow

- [ ] Console logs captured
- [ ] Network requests logged
- [ ] Errors recorded
- [ ] Screenshots working

### ✅ IDE Integration

- [ ] MCP configuration updated
- [ ] Port set to 1422
- [ ] AI assistant recognizes tools
- [ ] Commands executing properly

## API Endpoint Reference

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health status |
| `/.identity` | GET | Server identification |
| `/.port` | GET | Server port number |
| `/console-logs` | GET | Retrieve console logs |
| `/console-errors` | GET | Retrieve console errors |
| `/network-success` | GET | Successful network requests |
| `/network-errors` | GET | Failed network requests |
| `/all-xhr` | GET | All network requests |
| `/current-url` | GET/POST | Current page URL |
| `/wipelogs` | POST | Clear all logs |
| `/extension-log` | POST | Submit log entry |

### Test API Calls

```bash
# Submit test log
curl -X POST http://localhost:1422/extension-log \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "type": "console-log",
      "level": "info",
      "message": "Test message",
      "timestamp": "'$(date +%s)'"
    }
  }'

# Update current URL
curl -X POST http://localhost:1422/current-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "tabId": 1,
    "source": "test"
  }'

# Clear all logs
curl -X POST http://localhost:1422/wipelogs
```

## Debugging Workflows

### Workflow 1: Basic Debugging

1. **Start Services**
   ```bash
   npm run dev -- --port 3025  # Terminal 1
   npm start                    # Terminal 2 (in rapidtriage-server)
   ```

2. **Load Extension**
   ```bash
   open -a "Google Chrome" --args \
     --load-extension=/Users/yarlis/Downloads/rapidtriageME/rapidtriage-extension
   ```

3. **Generate Events**
   - Open any website
   - Open DevTools → RapidTriageME panel
   - Perform actions on the page

4. **Retrieve Data**
   ```bash
   curl http://localhost:1422/console-logs | jq .
   ```

### Workflow 2: AI-Assisted Debugging

1. **Configure IDE** with port 1422
2. **Ask AI Assistant**:
   - "Show me console errors from the current page"
   - "Take a screenshot of the application"
   - "Get all failed network requests"

3. **AI retrieves data** via MCP protocol
4. **Analyze results** with AI assistance

### Workflow 3: Performance Testing

1. **Run Lighthouse Audit**
   ```
   "Run performance audit on current page"
   ```

2. **Check Metrics**
   ```bash
   curl http://localhost:1422/performance-metrics | jq .
   ```

3. **Analyze Results**
   - Core Web Vitals
   - Resource timing
   - JavaScript execution

## Common Test Scenarios

### Scenario 1: Port Conflict

**Issue:** Port 3025 already in use

**Solution:**
```bash
# Find process using port
lsof -i :3025

# Kill process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Scenario 2: Extension Not Connecting

**Issue:** Extension shows disconnected

**Solution:**
1. Check server is running: `curl http://localhost:1422/.identity`
2. Reload extension in `chrome://extensions/`
3. Restart Chrome with extension

### Scenario 3: No Data Captured

**Issue:** Endpoints return empty arrays

**Solution:**
1. Verify extension is loaded
2. Check DevTools panel is open
3. Refresh the page being debugged
4. Generate new events

## Performance Benchmarks

### Expected Response Times

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Health check | <50ms | <100ms |
| Log retrieval | <100ms | <200ms |
| Screenshot capture | <500ms | <1000ms |
| Lighthouse audit | <5s | <10s |

### Resource Usage

| Component | Memory | CPU |
|-----------|--------|-----|
| Wrangler Server | ~50MB | <2% |
| Browser Connector | ~80MB | <1% |
| Chrome Extension | ~20MB | <1% |
| MCP Server | ~40MB | <1% |

## Automated Testing

### Run Test Suite

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:integration
```

## Test Data Management

### Generate Test Data

```javascript
// generate-test-data.js
const testData = {
  consoleLogs: [
    { level: 'info', message: 'Application started' },
    { level: 'error', message: 'Failed to load resource' },
    { level: 'warn', message: 'Deprecated API usage' }
  ],
  networkRequests: [
    { url: '/api/users', status: 200, method: 'GET' },
    { url: '/api/login', status: 401, method: 'POST' },
    { url: '/api/data', status: 500, method: 'GET' }
  ]
};

// Send to connector
testData.consoleLogs.forEach(log => {
  fetch('http://localhost:1422/extension-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { ...log, type: 'console-log' } })
  });
});
```

### Clear Test Data

```bash
# Clear all logs
curl -X POST http://localhost:1422/wipelogs

# Verify cleared
curl http://localhost:1422/console-logs
# Should return: []
```

## Next Steps

After successful testing:

1. **Deploy to Production**
   - See [Production Deployment](../deployment/production.md)

2. **Configure Monitoring**
   - Set up logging
   - Configure alerts
   - Monitor performance

3. **Team Onboarding**
   - Share test procedures
   - Document workflows
   - Create runbooks

## Support

Need help with testing?

- 📖 [Documentation](https://docs.rapidtriage.me)
- 🐛 [Report Issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- 💬 [Discord Community](https://discord.gg/rapidtriage)