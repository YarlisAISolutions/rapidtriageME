# Common Issues & Solutions

This guide covers the most frequently encountered issues when using RapidTriageME, along with step-by-step solutions and preventive measures.

## Installation & Setup Issues

### Chrome Extension Installation

??? bug "Extension fails to load"
    **Symptoms:**
    - Extension not appearing in Chrome Extensions page
    - "Failed to load extension" error message
    - Manifest parsing errors
    
    **Solutions:**
    1. **Enable Developer Mode**:
        ```
        1. Go to chrome://extensions/
        2. Toggle "Developer mode" in top right
        3. Try loading extension again
        ```
    
    2. **Check Manifest Validity**:
        ```bash
        # Validate manifest.json syntax
        cat rapidtriage-extension/manifest.json | jq .
        
        # Check for common issues
        grep -n "permissions\|host_permissions" rapidtriage-extension/manifest.json
        ```
    
    3. **Clear Extension Cache**:
        ```
        1. Remove extension from Chrome
        2. Restart Chrome completely
        3. Clear extension directory cache
        4. Reload extension
        ```

??? bug "DevTools panel not appearing"
    **Symptoms:**
    - Extension loads but no "BrowserToolsMCP" tab in DevTools
    - Console errors about panel registration
    
    **Solutions:**
    1. **Refresh Target Page**:
        - Close DevTools
        - Refresh the web page
        - Reopen DevTools (F12)
        - Look for BrowserToolsMCP tab
    
    2. **Check Extension Permissions**:
        ```json
        // Verify these permissions in manifest.json
        {
          "permissions": [
            "debugger",
            "storage", 
            "tabs",
            "activeTab"
          ]
        }
        ```
    
    3. **Reset Extension Data**:
        ```
        1. Go to chrome://extensions/
        2. Click "Details" on RapidTriage extension
        3. Click "Extension options"  
        4. Reset all settings to defaults
        ```

### Browser Connector Issues

??? bug "Server fails to start"
    **Symptoms:**
    - "Port 1421 already in use" error
    - "Permission denied" on port binding
    - Process exits immediately after start
    
    **Solutions:**
    1. **Check Port Availability**:
        ```bash
        # Check if port is in use
        lsof -i :1421
        netstat -an | grep 1421
        
        # Kill existing process if needed
        pkill -f rapidtriage-server
        ```
    
    2. **Run with Different Port**:
        ```bash
        # Start on alternative port
        rapidtriage-server --port 1422
        
        # Or set environment variable
        export RAPIDTRIAGE_PORT=1422
        rapidtriage-server
        ```
    
    3. **Check Permissions**:
        ```bash
        # Linux/Mac: Check if port requires sudo
        sudo rapidtriage-server --port 80  # Don't actually do this
        
        # Use unprivileged port (>1024)
        rapidtriage-server --port 8421
        ```

??? bug "Connection timeout errors"
    **Symptoms:**
    - Extension shows "Failed to connect" 
    - Timeout errors in browser console
    - Red connection indicator in DevTools panel
    
    **Solutions:**
    1. **Verify Server Status**:
        ```bash
        # Check if server is running
        ps aux | grep rapidtriage
        
        # Test server response
        curl http://localhost:1421/.identity
        ```
    
    2. **Check Firewall Settings**:
        ```bash
        # Linux: Check iptables
        sudo iptables -L | grep 1421
        
        # Mac: Check firewall
        sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate
        
        # Windows: Check Windows Firewall
        netsh advfirewall firewall show rule name="RapidTriage"
        ```
    
    3. **Test Network Connectivity**:
        ```bash
        # Test local connection
        telnet localhost 1421
        
        # Check routing
        netstat -rn | grep 127.0.0.1
        ```

### MCP Server Issues

??? bug "MCP server not recognized by Claude"
    **Symptoms:**
    - RapidTriage tools don't appear in Claude Desktop
    - "Server not found" errors in Claude logs
    - MCP connection failures
    
    **Solutions:**
    1. **Verify Configuration Path**:
        ```bash
        # Check Claude config location
        # Mac: ~/Library/Application Support/Claude/claude_desktop_config.json
        # Windows: %APPDATA%\Claude\claude_desktop_config.json
        # Linux: ~/.config/Claude/claude_desktop_config.json
        
        # Validate JSON syntax
        cat ~/.config/Claude/claude_desktop_config.json | jq .
        ```
    
    2. **Check MCP Server Binary**:
        ```bash
        # Verify installation
        which rapidtriage-mcp
        rapidtriage-mcp --version
        
        # Test direct execution
        rapidtriage-mcp --test-connection
        ```
    
    3. **Review Configuration**:
        ```json
        {
          "mcpServers": {
            "rapidtriage": {
              "command": "rapidtriage-mcp",
              "args": ["--config", "/full/path/to/mcp-config.json"],
              "env": {
                "DEBUG": "true"
              }
            }
          }
        }
        ```

## Connection & Communication Issues

### WebSocket Connection Problems

??? bug "WebSocket connection keeps dropping"
    **Symptoms:**
    - Frequent reconnection attempts in logs
    - Intermittent data loss
    - "Connection lost" notifications
    
    **Solutions:**
    1. **Increase Timeout Values**:
        ```javascript
        // In extension background script
        const wsConfig = {
          reconnectInterval: 5000,    // 5 seconds
          maxReconnectAttempts: 10,   // Increased from 5
          heartbeatInterval: 30000    // 30 seconds
        };
        ```
    
    2. **Implement Proper Heartbeat**:
        ```javascript
        // Ensure heartbeat is working
        setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'heartbeat',
              timestamp: Date.now()
            }));
          }
        }, 30000);
        ```
    
    3. **Check Network Stability**:
        ```bash
        # Test network stability
        ping -c 100 localhost
        
        # Monitor connection quality
        netstat -i
        ```

??? bug "Message delivery failures"
    **Symptoms:**
    - Messages sent but not received
    - Console logs missing from AI context
    - Network requests not appearing
    
    **Solutions:**
    1. **Enable Message Acknowledgment**:
        ```javascript
        // Add message ID tracking
        const pendingMessages = new Map();
        
        function sendMessage(message) {
          const id = generateId();
          message.id = id;
          
          pendingMessages.set(id, {
            message,
            timestamp: Date.now()
          });
          
          ws.send(JSON.stringify(message));
          
          // Retry if no ack within 5 seconds
          setTimeout(() => {
            if (pendingMessages.has(id)) {
              console.log('Retrying message:', id);
              ws.send(JSON.stringify(message));
            }
          }, 5000);
        }
        ```
    
    2. **Check Message Size Limits**:
        ```javascript
        // Monitor message sizes
        function checkMessageSize(message) {
          const size = JSON.stringify(message).length;
          if (size > 1048576) { // 1MB limit
            console.warn('Message too large:', size);
            return false;
          }
          return true;
        }
        ```
    
    3. **Verify Message Format**:
        ```javascript
        // Validate message structure
        function validateMessage(message) {
          const required = ['type', 'timestamp'];
          return required.every(field => message.hasOwnProperty(field));
        }
        ```

### Remote Access Issues

??? bug "JWT authentication failures"
    **Symptoms:**
    - 401 Unauthorized errors
    - "Invalid token" messages
    - Remote connections rejected
    
    **Solutions:**
    1. **Check Token Expiration**:
        ```bash
        # Decode JWT to check expiration
        echo "eyJhbGc..." | base64 -d | jq .exp
        
        # Compare with current time
        date +%s
        ```
    
    2. **Verify Token Generation**:
        ```bash
        # Test token generation endpoint
        curl -X POST https://rapidtriage.me/auth/token \
          -H "Content-Type: application/json" \
          -d '{"clientId":"test-client"}'
        ```
    
    3. **Check Token Format**:
        ```javascript
        // Ensure proper header format
        const headers = {
          'Authorization': `Bearer ${token}`,  // Note: "Bearer " prefix
          'Content-Type': 'application/json'
        };
        ```

## Data Capture Issues

### Console Logs Not Appearing

??? bug "Console logs missing from capture"
    **Symptoms:**
    - No logs appearing in AI context
    - Empty response from /console-logs endpoint
    - Extension shows "No logs captured"
    
    **Solutions:**
    1. **Check DevTools Attachment**:
        ```javascript
        // In extension: verify debugger is attached
        chrome.debugger.getTargets((targets) => {
          const attached = targets.filter(t => t.attached);
          console.log('Attached targets:', attached);
        });
        ```
    
    2. **Verify Log Level Capture**:
        ```javascript
        // Ensure all log levels are captured
        const logLevels = ['verbose', 'info', 'warning', 'error'];
        
        chrome.debugger.sendCommand(tabId, 'Runtime.enable');
        chrome.debugger.sendCommand(tabId, 'Console.enable');
        ```
    
    3. **Test Console Output Directly**:
        ```html
        <!-- Test page to generate logs -->
        <script>
          console.log('Test log message');
          console.warn('Test warning message');
          console.error('Test error message');
        </script>
        ```

??? bug "Network requests not captured"
    **Symptoms:**
    - Empty network requests list
    - XHR/Fetch requests missing
    - Only page navigation requests visible
    
    **Solutions:**
    1. **Enable Network Domain**:
        ```javascript
        // In extension background script
        chrome.debugger.sendCommand(tabId, 'Network.enable', {
          maxResourceBufferSize: 10000000,
          maxPostDataSize: 10000000
        });
        ```
    
    2. **Check Request Filtering**:
        ```javascript
        // Verify no overly restrictive filtering
        const shouldCaptureRequest = (url) => {
          // Don't filter out too much
          const blocklist = ['chrome-extension://', 'data:', 'blob:'];
          return !blocklist.some(blocked => url.startsWith(blocked));
        };
        ```
    
    3. **Monitor Network Events**:
        ```javascript
        // Add comprehensive network event handling
        const networkEvents = [
          'Network.requestWillBeSent',
          'Network.responseReceived', 
          'Network.loadingFinished',
          'Network.loadingFailed'
        ];
        
        networkEvents.forEach(event => {
          chrome.debugger.onEvent.addListener((source, method, params) => {
            if (method === event) {
              console.log(`Network event: ${event}`, params);
            }
          });
        });
        ```

### Screenshot Issues

??? bug "Screenshots fail to capture"
    **Symptoms:**
    - "Screenshot failed" error messages
    - Blank or corrupted images
    - Permission denied errors
    
    **Solutions:**
    1. **Check Tab Permissions**:
        ```javascript
        // Verify active tab access
        chrome.tabs.query({active: true}, (tabs) => {
          if (!tabs.length) {
            console.error('No active tab available');
            return;
          }
          
          const tab = tabs[0];
          if (!tab.url.startsWith('http')) {
            console.error('Cannot capture chrome:// or file:// pages');
            return;
          }
        });
        ```
    
    2. **Test Screenshot API**:
        ```javascript
        // Basic screenshot test
        chrome.tabs.captureVisibleTab(null, {
          format: 'png',
          quality: 90
        }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Screenshot error:', chrome.runtime.lastError);
          } else {
            console.log('Screenshot success, size:', dataUrl.length);
          }
        });
        ```
    
    3. **Check File System Permissions**:
        ```bash
        # Verify downloads directory is writable
        ls -la ~/Downloads/
        touch ~/Downloads/test-file.txt
        rm ~/Downloads/test-file.txt
        ```

## Performance Issues

### High Memory Usage

??? bug "Extension consuming excessive memory"
    **Symptoms:**
    - Chrome becomes slow or unresponsive
    - Task manager shows high extension memory
    - Browser crashes or tabs become unresponsive
    
    **Solutions:**
    1. **Implement Data Limits**:
        ```javascript
        // Limit stored log entries
        const MAX_LOG_ENTRIES = 1000;
        const MAX_NETWORK_ENTRIES = 500;
        
        function addLogEntry(entry) {
          logs.push(entry);
          if (logs.length > MAX_LOG_ENTRIES) {
            logs.splice(0, logs.length - MAX_LOG_ENTRIES);
          }
        }
        ```
    
    2. **Clear Old Data Regularly**:
        ```javascript
        // Auto-cleanup old data
        setInterval(() => {
          const cutoff = Date.now() - (5 * 60 * 1000); // 5 minutes
          
          logs = logs.filter(log => log.timestamp > cutoff);
          networkRequests = networkRequests.filter(req => req.timestamp > cutoff);
        }, 60000); // Every minute
        ```
    
    3. **Optimize Data Structures**:
        ```javascript
        // Use efficient data structures
        const logBuffer = new CircularBuffer(MAX_LOG_ENTRIES);
        const networkBuffer = new CircularBuffer(MAX_NETWORK_ENTRIES);
        
        class CircularBuffer {
          constructor(size) {
            this.size = size;
            this.data = new Array(size);
            this.index = 0;
            this.count = 0;
          }
          
          push(item) {
            this.data[this.index] = item;
            this.index = (this.index + 1) % this.size;
            this.count = Math.min(this.count + 1, this.size);
          }
          
          toArray() {
            if (this.count < this.size) {
              return this.data.slice(0, this.count);
            }
            return [...this.data.slice(this.index), ...this.data.slice(0, this.index)];
          }
        }
        ```

### Slow Response Times

??? bug "API endpoints responding slowly"
    **Symptoms:**
    - Long delays when fetching console logs
    - Timeouts on network request endpoints
    - AI assistant waits too long for data
    
    **Solutions:**
    1. **Implement Response Caching**:
        ```javascript
        // Cache API responses
        const responseCache = new Map();
        const CACHE_TTL = 30000; // 30 seconds
        
        app.get('/console-logs', (req, res) => {
          const cacheKey = 'console-logs';
          const cached = responseCache.get(cacheKey);
          
          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return res.json(cached.data);
          }
          
          const logs = getConsoleLogs();
          responseCache.set(cacheKey, {
            data: logs,
            timestamp: Date.now()
          });
          
          res.json(logs);
        });
        ```
    
    2. **Paginate Large Responses**:
        ```javascript
        // Add pagination support
        app.get('/console-logs', (req, res) => {
          const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
          const offset = parseInt(req.query.offset) || 0;
          
          const allLogs = getConsoleLogs();
          const paginatedLogs = allLogs.slice(offset, offset + limit);
          
          res.json({
            logs: paginatedLogs,
            total: allLogs.length,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < allLogs.length
          });
        });
        ```
    
    3. **Optimize Data Serialization**:
        ```javascript
        // Use streaming JSON for large responses
        const JSONStream = require('JSONStream');
        
        app.get('/console-logs', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          
          const logStream = getConsoleLogsStream();
          logStream
            .pipe(JSONStream.stringify())
            .pipe(res);
        });
        ```

## Browser-Specific Issues

### Chrome Extension Manifest V3

??? bug "Manifest V3 compatibility issues"
    **Symptoms:**
    - Extension works in dev but fails when packaged
    - Service worker limitations
    - Content Security Policy violations
    
    **Solutions:**
    1. **Update Manifest Version**:
        ```json
        {
          "manifest_version": 3,
          "background": {
            "service_worker": "background.js"
          },
          "action": {
            "default_popup": "popup.html"
          },
          "permissions": [
            "debugger",
            "storage",
            "tabs"
          ],
          "host_permissions": [
            "http://localhost/*",
            "https://*/*"
          ]
        }
        ```
    
    2. **Convert Background Page to Service Worker**:
        ```javascript
        // background.js - Service Worker compatible
        let connections = new Map();
        
        // Use chrome.storage instead of variables
        chrome.storage.session.get(['connections'], (result) => {
          connections = new Map(result.connections || []);
        });
        
        // Persist state changes
        function saveConnections() {
          chrome.storage.session.set({
            connections: Array.from(connections.entries())
          });
        }
        ```
    
    3. **Handle CSP Restrictions**:
        ```javascript
        // Use chrome.scripting instead of eval
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: () => {
            // Injected code
            console.log('Script injected');
          }
        });
        ```

### Firefox Compatibility

??? bug "Extension not working in Firefox"
    **Symptoms:**
    - Firefox rejects extension manifest
    - API differences causing failures
    - WebExtensions compatibility issues
    
    **Solutions:**
    1. **Create Firefox-Specific Manifest**:
        ```json
        {
          "manifest_version": 2,
          "background": {
            "scripts": ["background.js"],
            "persistent": false
          },
          "browser_action": {
            "default_popup": "popup.html"
          },
          "permissions": [
            "debugger",
            "storage", 
            "tabs",
            "http://localhost/*"
          ]
        }
        ```
    
    2. **Handle API Differences**:
        ```javascript
        // Cross-browser compatibility
        const browser = window.browser || window.chrome;
        
        // Use browser namespace consistently
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
          // Handler code
        });
        ```
    
    3. **Test Extension ID Handling**:
        ```javascript
        // Firefox uses different extension ID format
        const getExtensionId = () => {
          if (typeof browser !== 'undefined' && browser.runtime) {
            return browser.runtime.id;
          }
          return chrome.runtime.id;
        };
        ```

## Debugging & Diagnostics

### Enable Debug Logging

```bash
# Environment variables for debug output
export DEBUG=rapidtriage:*
export LOG_LEVEL=debug
export RAPIDTRIAGE_VERBOSE=true

# Start with debug output
rapidtriage-server --debug --log-level=debug
```

### Health Check Endpoints

```bash
# Test all components
curl http://localhost:1421/health
curl http://localhost:1421/.identity  
curl http://localhost:1422/health    # MCP server

# Check component status
curl http://localhost:1421/status | jq .
```

### Log File Locations

```bash
# Default log locations
# Linux/Mac
~/.rapidtriage/logs/
/var/log/rapidtriage/

# Windows
%APPDATA%\RapidTriage\logs\

# View recent logs
tail -f ~/.rapidtriage/logs/server.log
tail -f ~/.rapidtriage/logs/mcp.log
tail -f ~/.rapidtriage/logs/extension.log
```

### Performance Monitoring

```javascript
// Add performance monitoring to extension
const performanceMonitor = {
  start: performance.now(),
  
  log(event) {
    const duration = performance.now() - this.start;
    console.log(`[PERF] ${event}: ${duration.toFixed(2)}ms`);
  },
  
  reset() {
    this.start = performance.now();
  }
};

// Monitor message handling
performanceMonitor.reset();
handleMessage(message);
performanceMonitor.log('Message handled');
```

## Getting Help

### Community Support

- **GitHub Issues**: Report bugs and request features
- **Discord Server**: Real-time community support  
- **Stack Overflow**: Tag questions with `rapidtriage`
- **Documentation**: Check latest docs at rapidtriage.me/docs

### Filing Bug Reports

Include the following information:

1. **System Information**:
   - Operating System and version
   - Chrome/Firefox version
   - Extension version
   - Server version

2. **Error Details**:
   - Full error messages
   - Console logs (with debug enabled)
   - Screenshots if UI-related

3. **Reproduction Steps**:
   - Minimal steps to reproduce
   - Expected vs actual behavior
   - Frequency (always/sometimes/rare)

4. **Configuration**:
   - Relevant config files (redact sensitive data)
   - Environment variables
   - Network setup if relevant

### Log Collection Script

```bash
#!/bin/bash
# collect-logs.sh - Gather diagnostic information

echo "RapidTriage Diagnostic Information"
echo "=================================="
echo "Date: $(date)"
echo "OS: $(uname -a)"
echo

echo "Chrome Version:"
google-chrome --version 2>/dev/null || echo "Chrome not found"
echo

echo "Extension Status:"
ls -la ~/.config/google-chrome/Default/Extensions/*/
echo

echo "Server Process:"
ps aux | grep rapidtriage
echo

echo "Port Status:"
netstat -an | grep -E "(1421|1422)"
echo

echo "Recent Logs:"
tail -50 ~/.rapidtriage/logs/server.log 2>/dev/null || echo "No server logs found"
echo

echo "Configuration:"
cat ~/.rapidtriage/config.json 2>/dev/null || echo "No config file found"
```

## Prevention & Best Practices

### Regular Maintenance

1. **Update Regularly**: Keep all components updated
2. **Monitor Logs**: Set up log rotation and monitoring  
3. **Clean Data**: Regularly clear old debugging data
4. **Test Connections**: Periodically verify all connections work
5. **Backup Config**: Keep configuration files backed up

### Performance Optimization

1. **Limit Data Retention**: Don't store unlimited logs
2. **Use Appropriate Timeouts**: Balance responsiveness vs reliability
3. **Monitor Resource Usage**: Keep an eye on memory and CPU
4. **Optimize Network Calls**: Cache responses where appropriate
5. **Profile Performance**: Regular performance audits

### Security Considerations

1. **Keep Localhost Only**: Don't expose server ports externally
2. **Validate Input**: Sanitize all data from browser
3. **Use HTTPS**: For remote connections, always use encryption
4. **Regular Audits**: Review permissions and access patterns
5. **Update Dependencies**: Keep all libraries up to date

## Next Steps

- [FAQ](faq.md) - Frequently asked questions
- [Performance Guide](../guides/performance.md) - Optimization tips
- [Security Guide](../guides/security.md) - Security best practices
- [Contributing](../contributing.md) - Help improve RapidTriage