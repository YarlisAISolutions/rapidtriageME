# 🧪 RapidTriageME Local Testing Guide

Complete guide for testing RapidTriageME locally before publishing to NPM or deploying to production.

## 📋 Prerequisites

- Node.js 14+ installed
- Chrome or Chromium browser
- An IDE with MCP support (Cursor, VS Code, etc.)
- Git (optional, for version control)

## 🚀 Quick Test Setup

### Step 1: Build All Packages

```bash
# Navigate to project root
cd /Users/yarlis/Downloads/rapidtriageME

# Build the server package
cd rapidtriage-server
npm install
npm run build
cd ..

# Build the MCP package
cd rapidtriage-mcp
npm install
npm run build
cd ..
```

### Step 2: Install Chrome Extension (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `rapidtriage-extension` folder
5. The extension should appear with name "RapidTriage DevTools"

### Step 3: Start the Server Locally

```bash
# In terminal 1 - Start the browser server
cd rapidtriage-server
npm start
# Should see: "RapidTriage Server running on port 3025"
```

### Step 4: Configure Your IDE for Local Testing

#### For Cursor
Create/edit `~/.cursor/mcp_settings.json`:
```json
{
  "mcpServers": {
    "rapidtriage-local": {
      "command": "node",
      "args": ["/Users/yarlis/Downloads/rapidtriageME/rapidtriage-mcp/dist/mcp-server.js"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

#### For VS Code with Continue
Create/edit `~/.continue/config.json`:
```json
{
  "mcpServers": {
    "rapidtriage-local": {
      "command": "node",
      "args": ["/Users/yarlis/Downloads/rapidtriageME/rapidtriage-mcp/dist/mcp-server.js"],
      "env": {
        "RAPIDTRIAGE_PORT": "3025"
      }
    }
  }
}
```

### Step 5: Verify Connection

1. **Open Chrome DevTools** (F12)
2. Navigate to **RapidTriage** panel (should be a new tab in DevTools)
3. You should see "Connected" status
4. **Restart your IDE** to load the MCP configuration

## 🔬 Comprehensive Testing Scenarios

### Test 1: Basic Connection Test

```bash
# In your IDE's AI assistant, type:
"Test MCP connection"

# Expected: Should respond that MCP is connected
```

### Test 2: Screenshot Capture

1. Open any website in Chrome
2. Open DevTools → RapidTriage panel
3. In your IDE, ask the AI:
```
"Take a screenshot of the current browser tab"
```
4. **Expected**: Screenshot should be captured and displayed

### Test 3: Console Log Monitoring

1. Open a test webpage (or use the sample below)
2. In browser console, run:
```javascript
console.log("Test message");
console.error("Test error");
console.warn("Test warning");
```
3. In your IDE, ask:
```
"Show me all console logs from the browser"
```
4. **Expected**: Should see all console messages

### Test 4: Network Request Monitoring

1. Navigate to any website
2. In your IDE, ask:
```
"Show me all network requests"
"What requests are failing?"
```
3. **Expected**: Should see network request details

### Test 5: Lighthouse Audits

1. Navigate to a website
2. In your IDE, ask:
```
"Run a performance audit on this page"
"Check accessibility issues"
```
3. **Expected**: Should receive audit results

## 📝 Sample Test Page

Create `test-page.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>RapidTriage Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .error { color: red; }
        .success { color: green; }
        button { margin: 10px; padding: 10px; }
    </style>
</head>
<body>
    <h1>RapidTriage Test Page</h1>
    
    <div id="test-element" class="test-class">
        Test Element for Inspection
    </div>
    
    <button onclick="testConsole()">Test Console Logs</button>
    <button onclick="testNetwork()">Test Network Request</button>
    <button onclick="testError()">Trigger Error</button>
    
    <div id="output"></div>
    
    <script>
        // Test console logging
        function testConsole() {
            console.log("✅ Log message test");
            console.warn("⚠️ Warning message test");
            console.error("❌ Error message test");
            console.info("ℹ️ Info message test");
            document.getElementById('output').innerHTML = 
                '<p class="success">Console messages sent!</p>';
        }
        
        // Test network request
        function testNetwork() {
            fetch('https://jsonplaceholder.typicode.com/posts/1')
                .then(response => response.json())
                .then(data => {
                    console.log('Network request successful:', data);
                    document.getElementById('output').innerHTML = 
                        '<p class="success">Network request completed!</p>';
                })
                .catch(error => {
                    console.error('Network request failed:', error);
                    document.getElementById('output').innerHTML = 
                        '<p class="error">Network request failed!</p>';
                });
            
            // Also make a failing request
            fetch('https://invalid-domain-that-doesnt-exist.com/api')
                .catch(error => console.error('Expected error:', error));
        }
        
        // Test error handling
        function testError() {
            try {
                throw new Error("Test error for debugging");
            } catch (e) {
                console.error("Caught error:", e);
                document.getElementById('output').innerHTML = 
                    '<p class="error">Error triggered and logged!</p>';
            }
        }
        
        // Initial console message
        console.log("🚀 RapidTriage test page loaded");
    </script>
</body>
</html>
```

## 🔍 Testing with npm link (Alternative to npx)

For more realistic testing, use npm link to simulate installed packages:

```bash
# Link the server package
cd rapidtriage-server
npm link

# Link the MCP package
cd ../rapidtriage-mcp
npm link

# Now you can use them as if installed globally
rapidtriage-server  # Instead of npm start
rapidtriage-mcp     # Instead of node dist/mcp-server.js
```

## 🐛 Debugging Common Issues

### Issue: Extension Not Showing in DevTools

**Solution:**
```bash
# 1. Completely quit Chrome
# 2. Restart Chrome
# 3. Ensure extension is enabled in chrome://extensions/
# 4. Open DevTools and look for RapidTriage tab
```

### Issue: Server Connection Failed

**Solution:**
```bash
# Check if port 3025 is already in use
lsof -i :3025

# If in use, kill the process
kill -9 <PID>

# Restart the server
cd rapidtriage-server
npm start
```

### Issue: MCP Not Connecting in IDE

**Solution:**
```bash
# 1. Verify the path in IDE configuration is correct
# 2. Check Node.js is in PATH
which node

# 3. Try absolute path to node
/usr/local/bin/node /full/path/to/rapidtriage-mcp/dist/mcp-server.js

# 4. Restart IDE completely
```

### Issue: TypeScript Build Errors

**Solution:**
```bash
# Clean and rebuild
cd rapidtriage-mcp
npm run clean
npm install
npm run build

cd ../rapidtriage-server
npm run clean
npm install
npm run build
```

## 📊 Performance Testing

### Test Response Times

```javascript
// In browser console
console.time('screenshot');
// Ask AI to take screenshot
console.timeEnd('screenshot');

console.time('logs');
// Ask AI to get logs
console.timeEnd('logs');
```

### Memory Usage

```bash
# Monitor Node.js memory usage
while true; do
  ps aux | grep node | grep -v grep
  sleep 5
done
```

## ✅ Testing Checklist

Before publishing, ensure:

- [ ] **Build Success**
  - [ ] rapidtriage-mcp builds without errors
  - [ ] rapidtriage-server builds without errors
  - [ ] No TypeScript errors

- [ ] **Extension Works**
  - [ ] Loads in Chrome without errors
  - [ ] DevTools panel appears
  - [ ] Shows "Connected" status

- [ ] **Server Functions**
  - [ ] Starts on port 3025
  - [ ] Handles connections
  - [ ] No memory leaks

- [ ] **MCP Integration**
  - [ ] Connects to IDE
  - [ ] Responds to commands
  - [ ] All tools work

- [ ] **Features Work**
  - [ ] Screenshot capture
  - [ ] Console log retrieval
  - [ ] Network monitoring
  - [ ] Lighthouse audits
  - [ ] Element inspection

- [ ] **Error Handling**
  - [ ] Graceful failures
  - [ ] Clear error messages
  - [ ] Recovery from disconnection

## 🚦 Test Automation Script

Run all tests automatically:

```bash
# Use the test-local.sh script
./test-local.sh

# Or run individual test commands
npm test  # In each package directory
```

## 📈 Test Coverage Goals

- **Unit Tests**: 80% coverage
- **Integration Tests**: All major flows
- **E2E Tests**: Critical user journeys
- **Performance**: < 100ms response time
- **Memory**: < 100MB usage

## 🎯 Ready for Production?

If all tests pass:
1. ✅ All builds successful
2. ✅ Extension works in developer mode
3. ✅ Server runs without errors
4. ✅ MCP connects to IDE
5. ✅ All features functional
6. ✅ No console errors

**Then you're ready to:**
- Publish to NPM
- Deploy to Cloudflare
- Submit extension to Chrome Web Store

---

**YarlisAISolutions** - Test locally, deploy confidently!