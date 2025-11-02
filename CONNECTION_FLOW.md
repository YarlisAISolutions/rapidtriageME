# RapidTriageME Connection Flow

## 🔄 How Everything Connects

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Browser                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Any Webpage (e.g., example.com)            │    │
│  │                                                     │    │
│  │  [Console Logs] [Network] [DOM] [Performance]     │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│                     │ Captures via DevTools API              │
│                     ↓                                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │      RapidTriage Extension (v3.2.0)                │    │
│  │                                                     │    │
│  │  • DevTools Panel UI                               │    │
│  │  • Background Service Worker                       │    │
│  │  • Content Scripts                                 │    │
│  └──────────────────┬──────────────────────────────────┘    │
└────────────────────┼───────────────────────────────────────┘
                     │
                     │ HTTP/WebSocket
                     │ localhost:3025
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Local Server (Node.js/Express)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  RapidTriageME Browser Tools Server                │    │
│  │                                                     │    │
│  │  • Express API Endpoints                           │    │
│  │  • Puppeteer Integration                           │    │
│  │  • Screenshot Handler                              │    │
│  │  • Console Log Storage                             │    │
│  │  • Audit Engine                                    │    │
│  └──────────────────┬──────────────────────────────────┘    │
└────────────────────┼───────────────────────────────────────┘
                     │
                     │ Saves to
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              File System                                     │
│                                                              │
│  📁 ~/RapidTriage_Screenshots/                              │
│     └── screenshot_20251102_143022.png                      │
│     └── screenshot_20251102_143156.png                      │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Connection Sequence

### 1. Server Startup
```
User runs:
  ./start-server.sh
     ↓
Server loads:
  config.json → config.js → server.js
     ↓
Server starts:
  ✅ Listening on localhost:3025
  ✅ Identity endpoint: /.identity
  ✅ Health check: /health
```

### 2. Extension Load
```
Chrome loads extension:
  manifest.json (v3.2.0)
     ↓
Extension initializes:
  config.js → background.js → devtools.js
     ↓
Panel loads:
  panel.html → panel.js
     ↓
Auto-discovery starts:
  Scans localhost:3025 → Validates identity
```

### 3. Connection Established
```
Extension sends:
  GET http://localhost:3025/.identity
     ↓
Server responds:
  {
    "signature": "mcp-browser-connector-24x7",
    "name": "RapidTriageME Browser Tools Server",
    "version": "2.0.0",
    "port": 3025
  }
     ↓
Extension confirms:
  🟢 Connected to server
```

### 4. User Interaction
```
User clicks "Screenshot":
  Extension → chrome.tabs.captureVisibleTab()
     ↓
Extension sends to server:
  POST http://localhost:3025/screenshot
  { data: "base64..." }
     ↓
Server saves:
  ~/RapidTriage_Screenshots/screenshot_*.png
     ↓
Server responds:
  { success: true, path: "..." }
     ↓
Extension shows:
  ✅ "Screenshot saved!"
```

## 🔐 Security Flow

### Configuration Loading (No Hardcoded Values)
```
Server startup:
  1. Check config.json
  2. Check .env file (if exists)
  3. Check environment variables
  4. Use defaults only if nothing configured
     ↓
  ✅ All values configurable
  ✅ No hardcoded ports, hosts, or paths
```

### Extension Configuration
```
Extension load:
  1. Loads config.js
  2. Checks chrome.storage.local (user settings)
  3. Uses RAPIDTRIAGE_CONFIG defaults
     ↓
  ✅ User can configure in extension UI
  ✅ Settings persist across sessions
```

## 🎯 Data Flow Examples

### Console Logs
```
Webpage logs:
  console.log("Hello world")
     ↓
Extension captures:
  { type: "log", text: "Hello world", timestamp: "..." }
     ↓
Sends to server:
  POST /extension-log
     ↓
Server stores:
  browserLogs[] (in memory)
     ↓
Available via:
  GET /logs (returns all logs)
  GET /api/latest-console (latest only)
```

### Performance Audit
```
User clicks "Performance":
  Extension sends:
    POST /performance-audit
    { url: "https://example.com" }
       ↓
  Server launches:
    Puppeteer → Lighthouse
       ↓
  Server returns:
    { scores: {...}, metrics: {...} }
       ↓
  Extension displays:
    Performance: 95/100 ✅
```

### Screenshot Capture
```
User clicks "Screenshot 📸":
  Extension:
    chrome.tabs.captureVisibleTab()
       ↓
  Gets base64 image data
       ↓
  Sends to server:
    POST /screenshot
    { data: "data:image/png;base64,..." }
       ↓
  Server:
    Decodes base64
    Saves to ~/RapidTriage_Screenshots/
       ↓
  Returns:
    { path: "/Users/.../screenshot_*.png" }
       ↓
  Extension shows:
    "Screenshot saved: screenshot_*.png"
```

## 🔄 Reconnection Logic

### Auto-Discovery on Page Refresh
```
Page refreshes:
     ↓
Extension detects:
  chrome.tabs.onUpdated (status: "complete")
     ↓
Tests connection:
  GET /.identity (with 3s timeout)
     ↓
If successful:
  Maintains connection ✅
     ↓
If failed:
  Starts auto-discovery
  Scans ports 3025-3035
  Shows "Searching..." UI
```

### Manual Reconnect
```
User clicks "Reconnect":
     ↓
Cancels ongoing discovery
     ↓
Runs fresh discovery:
  1. Try localhost:3025 (configured)
  2. Try localhost:3025 (default)
  3. Try 127.0.0.1:3025
  4. Scan ports 3026-3035
  5. Check local network IPs
     ↓
First success:
  Updates settings
  Shows "Connected" ✅
     ↓
All fail:
  Shows "Reconnect" button
  Schedules retry in 30s
```

## 📡 API Endpoints

### Server Endpoints
```
GET  /.identity              → Server info (for validation)
GET  /health                 → Health check
POST /extension-log          → Receive browser logs
POST /current-url            → Update current URL
GET  /current-url            → Get current URL
GET  /logs                   → Get all logs
POST /screenshot             → Save screenshot
POST /wipelogs               → Clear all logs
POST /api/screenshot         → Puppeteer screenshot
POST /api/console-logs       → Capture console
POST /api/lighthouse         → Run Lighthouse
POST /accessibility-audit    → Accessibility check
POST /performance-audit      → Performance check
POST /seo-audit             → SEO check
POST /best-practices-audit  → Best practices
POST /debug-mode            → Enable debug mode
POST /audit-mode            → Enable audit mode
```

## 🎨 UI Status Indicators

### Connection Banner
```
🟢 Green: Connected
   "Connected to RapidTriageME Browser Tools Server v2.0.0"
   
🔴 Red: Disconnected
   "Not connected to server"
   [Reconnect] button shown
   
🟡 Yellow: Searching
   "Searching for server..."
   Discovery in progress
```

## 🔗 Integration Points

### Future Integrations
```
RapidTriageME Server
        ↓
        ├── MCP Server (AI assistants)
        │   ├── Claude
        │   ├── ChatGPT
        │   └── Other AI tools
        │
        ├── Firebase Functions (cloud)
        │   ├── Authentication
        │   ├── Storage
        │   └── Firestore
        │
        └── Remote Access
            └── https://rapidtriage.me
```

---

**Current State**: ✅ All connections working  
**Server**: Running on localhost:3025  
**Extension**: v3.2.0 (no hardcoded values)  
**Configuration**: Fully environment-based

