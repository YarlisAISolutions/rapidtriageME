# ⚡ RapidTriageME Quick Start Guide

Get up and running with RapidTriageME in under 5 minutes!

## 🎯 Prerequisites

- **Node.js** 14+ installed
- **Chrome** or Chromium browser
- An **IDE** with MCP support (Cursor, VS Code, Zed, etc.)

## 🚀 Three-Step Installation

### Step 1: Install Chrome Extension
Download and install the RapidTriage Chrome Extension:
```bash
# Download from GitHub
https://github.com/YarlisAISolutions/rapidtriage-extension/releases/latest

# Or direct link
https://github.com/YarlisAISolutions/rapidtriage-extension/releases/download/v1.0.0/RapidTriage-1.0.0.zip
```

**Installation:**
1. Download the `.zip` file
2. Extract to a folder
3. Open Chrome → Extensions → Enable Developer Mode
4. Click "Load unpacked" → Select extracted folder

### Step 2: Start the Browser Server
Open a terminal and run:
```bash
npx @yarlis/rapidtriage-server@latest
```

You should see:
```
🚀 RapidTriage Server running on port 1421
✅ Ready for connections
```

### Step 3: Configure Your IDE

#### For Cursor
Edit `~/.cursor/mcp_settings.json`:
```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"]
    }
  }
}
```

#### For VS Code (with Continue)
Edit `~/.continue/config.json`:
```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"]
    }
  }
}
```

#### For Other IDEs
See [IDE_CONFIGURATION.md](./IDE_CONFIGURATION.md) for your specific IDE.

## ✅ Verify Installation

1. **Open Chrome DevTools** (F12)
2. Navigate to **RapidTriage** panel
3. You should see "Connected" status

## 🎮 Test It Out

In your AI assistant, try these commands:

### Basic Commands
```
"Take a screenshot of the current page"
"Show me all console errors"
"What network requests are failing?"
```

### Advanced Commands
```
"Run a performance audit on this page"
"Check accessibility issues"
"Monitor network traffic for 30 seconds"
```

## 🔧 Troubleshooting

### Extension Not Showing in DevTools
- Restart Chrome completely (not just the window)
- Ensure extension is enabled in Chrome Extensions page
- Only open ONE DevTools window

### Server Connection Failed
```bash
# Check if port 1421 is in use
lsof -i :1421

# Kill existing process if needed
kill -9 <PID>

# Restart the server
npx @yarlis/rapidtriage-server@latest
```

### IDE Not Finding MCP Server
1. Restart your IDE after configuration
2. Check Node.js is in PATH: `node --version`
3. Try absolute path to npx:
   ```json
   {
     "command": "/usr/local/bin/npx",
     "args": ["@yarlis/rapidtriage-mcp@latest"]
   }
   ```

## 📦 Package Structure

You're using two npm packages:

| Package | Purpose | Command |
|---------|---------|---------|
| `@yarlis/rapidtriage-server` | Browser middleware server | Run in terminal |
| `@yarlis/rapidtriage-mcp` | MCP protocol handler | Configure in IDE |

## 🌐 Remote Usage (Optional)

For remote debugging, deploy to Cloudflare:
```bash
# Clone the repo
git clone https://github.com/YarlisAISolutions/rapidtriage.git
cd rapidtriage

# Deploy to Cloudflare
./deploy.sh
```

Then configure your IDE with:
```json
{
  "mcpServers": {
    "rapidtriage": {
      "transport": "sse",
      "url": "https://rapidtriage.me/sse",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

## 📊 Available Tools

Once connected, you have access to:

### Browser Control
- `mcp_navigate` - Navigate to URLs
- `mcp_screenshot` - Capture screenshots
- `mcp_executeJS` - Run JavaScript

### Debugging
- `mcp_getConsoleLogs` - Get console output
- `mcp_getNetworkLogs` - Monitor network
- `mcp_getSelectedElement` - Inspect DOM

### Auditing
- `mcp_runAccessibilityAudit` - WCAG compliance
- `mcp_runPerformanceAudit` - Core Web Vitals
- `mcp_runSEOAudit` - SEO analysis
- `mcp_runBestPracticesAudit` - Security & practices

## 🎉 Success!

You're now ready to use RapidTriageME! Your AI assistant can now:
- 🔍 Debug any website
- 📸 Capture screenshots
- 📊 Run performance audits
- 🔬 Analyze accessibility
- 🌐 Monitor network traffic

## 📚 Next Steps

- Read [full documentation](https://rapidtriage.me/docs)
- Join our [Discord community](https://discord.gg/rapidtriage)
- Star us on [GitHub](https://github.com/YarlisAISolutions/rapidtriage)

---

**Need help?** Open an issue on [GitHub](https://github.com/YarlisAISolutions/rapidtriage/issues) or join our Discord!

**YarlisAISolutions** - Making browser debugging simple and powerful