# RapidTriage Extension Configuration Guide

## Overview
The RapidTriage Chrome extension now uses centralized configuration management with NO hardcoded values. All sensitive data and deployment-specific settings are managed through environment configuration and Chrome storage.

## Configuration Files

### 1. `config.js` - Main Configuration
Located in: `/rapidtriage-extension/config.js`

Contains:
- Server connection defaults
- API endpoints
- Feature flags
- Extension defaults
- Helper functions for accessing config values

**Key Functions:**
- `CONFIG.getLocalServerUrl()` - Returns local server URL
- `CONFIG.getRemoteServerUrl()` - Returns remote server URL
- `CONFIG.getApiToken(callback)` - Retrieves API token from Chrome storage

### 2. Chrome Storage - User Settings
Managed via `chrome.storage.sync`

**Stored Values:**
- `apiToken` - User's API authentication token
- `screenshotPath` - Custom screenshot save location
- `serverUrl` - Override server URL

**Setting API Token:**
```javascript
chrome.storage.sync.set({ apiToken: 'YOUR_TOKEN_HERE' });
```

## Environment-Specific Setup

### Development Setup
1. **Local Server Configuration:**
   - Host: `localhost`
   - Port: `3025`
   - Automatically detected for local development URLs

2. **Setting Up:**
   ```bash
   # Start local server
   cd /Users/yarlis/Downloads/rapidtriageME
   ./start-server.sh
   ```

3. **Load Extension:**
   - Open Chrome: `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select: `/Users/yarlis/Downloads/rapidtriageME/rapidtriage-extension`

### Production Setup
1. **Remote Server Configuration:**
   - Host: `rapidtriage.me`
   - Port: `443`
   - Protocol: `https`
   - Automatically used for production URLs

2. **API Authentication:**
   - Open extension options (gear icon in popup)
   - Enter your API token
   - Token is securely stored in Chrome sync storage

## Configuration Values

### Server URLs
- **Local**: `http://localhost:3025` (development)
- **Remote**: `https://rapidtriage.me` (production)
- **Auto-detection**: Based on current tab URL

### API Endpoints
- `/.identity` - Server identification
- `/health` - Health check
- `/screenshot` - Local screenshot (dev)
- `/api/screenshot` - Remote screenshot (prod)
- `/api/lighthouse` - Lighthouse audits
- `/api/console-logs` - Console log collection
- `/api/console-errors` - Console error collection
- `/api/network-logs` - Network request logs
- `/api/network-errors` - Network error logs

### Extension Defaults
```javascript
{
  logLimit: 50,
  queryLimit: 30000,
  stringSizeLimit: 500,
  maxLogSize: 20000,
  allowAutoPaste: false,
  showRequestHeaders: false,
  showResponseHeaders: false
}
```

## Security Best Practices

### ✅ DO:
- Store API tokens in Chrome storage only
- Use environment-specific server URLs
- Keep sensitive data out of source code
- Validate tokens before use
- Use HTTPS for production

### ❌ DON'T:
- Hardcode API tokens in source files
- Commit `.env` files with sensitive data
- Share API tokens publicly
- Use weak or default tokens

## Updating Configuration

### Modify Server Settings
Edit `/rapidtriage-extension/config.js`:
```javascript
const RAPIDTRIAGE_CONFIG = {
  server: {
    defaultHost: 'localhost',  // Change this
    defaultPort: 3025,          // Change this
    remoteHost: 'rapidtriage.me',
    // ...
  }
}
```

### Update API Endpoints
Edit `/rapidtriage-extension/config.js`:
```javascript
endpoints: {
  screenshot: '/screenshot',  // Change paths here
  lighthouse: '/api/lighthouse',
  // ...
}
```

### Enable/Disable Features
Edit `/rapidtriage-extension/config.js`:
```javascript
features: {
  autoDiscovery: true,        // Toggle features
  remoteScreenshot: true,
  performanceMetrics: true,
  networkAnalysis: true
}
```

## Troubleshooting

### Extension Not Connecting
1. Verify server is running:
   ```bash
   curl http://localhost:3025/.identity
   ```

2. Check extension console:
   - Open extension popup
   - Press F12 to open DevTools
   - Look for `[RapidTriage]` messages

3. Verify API token:
   ```javascript
   chrome.storage.sync.get(['apiToken'], (items) => {
     console.log('Token:', items.apiToken);
   });
   ```

### Configuration Not Loading
1. Reload extension:
   - Go to `chrome://extensions/`
   - Click reload button on RapidTriage extension

2. Clear storage (if needed):
   ```javascript
   chrome.storage.sync.clear();
   ```

3. Check config file is loaded:
   - Open popup
   - Check console for `CONFIG` object
   ```javascript
   console.log(CONFIG);
   ```

## Version Information
- Extension Version: 3.2.1
- Configuration Version: 2.0.0
- Last Updated: 2025-11-02

## Additional Resources
- Documentation: https://docs.rapidtriage.me/
- API Reference: https://docs.rapidtriage.me/api/
- Support: https://github.com/YarlisAISolutions/rapidtriageME/issues

