# RapidTriageME Setup Guide

Complete end-to-end setup guide for the RapidTriageME browser extension and local server.

## 🚀 Quick Start

### 1. Start the Local Server

The extension requires a local server running on port 3025 to function.

```bash
# Option A: Use the startup script
./start-server.sh

# Option B: Start manually
cd rapidtriage-server
npm start

# Option C: Use npm from root
npm run server
```

The server should display:
```
============================================================
🚀 RapidTriageME Browser Tools Server
📍 Running on http://localhost:3025
🔧 Health check: http://localhost:3025/health
📷 Screenshots: ~/RapidTriage_Screenshots
🌍 Environment: development
📦 Version: 2.0.0
============================================================
```

### 2. Install/Reload the Chrome Extension

**If extension is not installed:**
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `rapidtriage-extension` folder
5. Note the extension ID that appears

**If extension is already installed (your case):**
1. Open `chrome://extensions/?id=apmgcakokbocmcnioakggmjhjaiablci`
2. Click the reload icon (🔄) on the extension card
3. Close all DevTools panels
4. Refresh any pages you want to debug

### 3. Open the Extension Panel

1. Navigate to any webpage
2. Open Chrome DevTools (F12 or Cmd+Option+I on Mac)
3. Click on the "RapidTriage" tab in DevTools
4. The panel should display connection status at the top

### 4. Verify Connection

You should see:
- **Green indicator**: "Connected to RapidTriageME Browser Tools Server v2.0.0 at localhost:3025"
- If you see red/disconnected, click the "Reconnect" button

## 🔧 Configuration

### Configuration Files

The project now uses centralized configuration instead of hardcoded values:

1. **Root `config.json`** - Main configuration file
   ```json
   {
     "server": {
       "host": "localhost",
       "port": 3025
     },
     "extension": {
       "logLimit": 50
     }
   }
   ```

2. **Extension `config.js`** - Browser extension config
   - Located in `rapidtriage-extension/config.js`
   - Contains default settings and feature flags

3. **Server `config.js`** - Server-side configuration loader
   - Located in `rapidtriage-server/config.js`
   - Loads from environment variables and config.json

### Environment Variables

Create a `.env` file in the `rapidtriage-server` directory (optional):

```bash
# Server Configuration
PORT=3025
SERVER_NAME=RapidTriageME Browser Tools Server
SERVER_VERSION=2.0.0

# Browser Configuration
BROWSER_HEADLESS=true
PUPPETEER_EXECUTABLE_PATH=

# Environment
NODE_ENV=development
```

## 🎯 Features

### Core Functions
- **Test Server**: Verify connection to local server
- **Screenshot**: Capture current page (saves to ~/RapidTriage_Screenshots)
- **Clear**: Wipe all captured logs
- **DevTools**: Open Chrome DevTools programmatically

### Audit Tools
- **Accessibility**: WCAG compliance check
- **Performance**: Load time and metrics analysis
- **SEO**: Search engine optimization audit
- **Best Practices**: Code quality and security
- **Lighthouse (All)**: Comprehensive audit

### Debug Tools
- **Console Logs**: View all console output
- **Console Errors**: Filter error messages only
- **Network Logs**: Monitor network requests
- **Network Errors**: Failed requests only
- **Inspect**: Element inspector
- **Wipe Logs**: Clear all debug data

### Modes
- **Debug Mode**: Enhanced logging and inspection
- **Audit Mode**: Performance and quality testing

## 🐛 Troubleshooting

### Extension Not Initializing

**Symptom**: DevTools panel shows "Initializing..." indefinitely

**Solution**:
1. Verify server is running: `curl http://localhost:3025/.identity`
2. Check for port conflicts: `lsof -i :3025`
3. Restart the server: `./stop-server.sh && ./start-server.sh`
4. Reload the extension: `./restart-extension.sh`

### Connection Status Shows "Not connected"

**Check List**:
- [ ] Server is running (check terminal)
- [ ] No firewall blocking localhost:3025
- [ ] Extension version matches (v3.2.0+)
- [ ] Chrome is up to date

**Fix Steps**:
```bash
# 1. Stop any existing servers
./stop-server.sh

# 2. Kill any processes on port 3025
lsof -ti:3025 | xargs kill -9

# 3. Start fresh
./start-server.sh

# 4. Reload extension
./restart-extension.sh
```

### Screenshots Not Saving

**Solution**:
1. Check screenshots directory exists: `~/RapidTriage_Screenshots`
2. Verify disk permissions
3. Check server logs for errors
4. Ensure local server is running (remote server can't capture screenshots)

### Server Won't Start

**Common Issues**:

1. **Port already in use**:
   ```bash
   # Kill existing process
   lsof -ti:3025 | xargs kill -9
   ```

2. **Missing dependencies**:
   ```bash
   cd rapidtriage-server
   npm install
   ```

3. **Node.js version**:
   ```bash
   # Requires Node.js 18+
   node --version
   ```

## 📁 Project Structure

```
rapidtriageME/
├── config.json                    # Main configuration
├── start-server.sh               # Server startup script
├── stop-server.sh                # Server stop script  
├── restart-extension.sh          # Extension reload helper
│
├── rapidtriage-extension/        # Chrome Extension
│   ├── manifest.json             # Extension manifest (v3.2.0)
│   ├── config.js                 # Extension configuration
│   ├── background.js             # Service worker
│   ├── devtools.js               # DevTools integration
│   ├── panel.js                  # Main UI logic
│   └── panel.html                # UI layout
│
├── rapidtriage-server/           # Local Server
│   ├── server.js                 # Express server
│   ├── config.js                 # Config loader
│   ├── package.json              # Dependencies
│   └── README.md
│
└── functions/                    # Firebase Cloud Functions
    └── src/
        └── index.ts              # Cloud functions entry
```

## 🔄 Development Workflow

### Starting Development

```bash
# Terminal 1: Start the local server
./start-server.sh

# Terminal 2: Watch extension changes (if needed)
cd rapidtriage-extension
# (Extension auto-reloads on panel open)
```

### Making Changes

**To the Extension**:
1. Edit files in `rapidtriage-extension/`
2. Save changes
3. Go to `chrome://extensions/`
4. Click reload (🔄) on the extension
5. Close and reopen DevTools

**To the Server**:
1. Edit files in `rapidtriage-server/`
2. Save changes
3. Restart server: `./stop-server.sh && ./start-server.sh`
4. Extension will auto-reconnect

**To Configuration**:
1. Edit `config.json` in root
2. Restart server (it loads config on startup)
3. Reload extension (it uses default config with overrides)

## 🌐 Remote Deployment

The project supports Firebase deployment:

```bash
# Deploy to Firebase
npm run deploy

# Deploy to specific environment
npm run deploy:production
npm run deploy:staging

# Test with emulators
npm run dev
```

## 📝 Useful Commands

```bash
# Start server
./start-server.sh
npm run server

# Stop server
./stop-server.sh

# Check server status
curl http://localhost:3025/health

# View server identity
curl http://localhost:3025/.identity

# Reload extension
./restart-extension.sh

# Check what's using port 3025
lsof -i :3025

# Kill process on port 3025
lsof -ti:3025 | xargs kill -9

# View screenshot directory
open ~/RapidTriage_Screenshots
```

## 🔗 Useful Links

- Extension Page: `chrome://extensions/?id=apmgcakokbocmcnioakggmjhjaiablci`
- Server Identity: http://localhost:3025/.identity
- Server Health: http://localhost:3025/health
- Documentation: https://docs.rapidtriage.me/

## ⚙️ Advanced Configuration

### Custom Server Port

Edit `config.json`:
```json
{
  "server": {
    "port": 3026  // Change from 3025
  }
}
```

Then restart server and extension will auto-discover the new port.

### Screenshot Directory

Edit `config.json`:
```json
{
  "screenshots": {
    "directory": "~/Documents/Screenshots"
  }
}
```

### CORS Origins

Edit `config.json` to allow additional origins:
```json
{
  "cors": {
    "origins": [
      "http://localhost:3000",
      "https://yourdomain.com"
    ]
  }
}
```

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs in terminal
3. Check Chrome DevTools console for errors
4. Verify all configuration files are correct

---

**Version**: 3.2.0  
**Last Updated**: 2025-11-02  
**Maintained by**: YarlisAISolutions

