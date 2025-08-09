# Quick Start Guide

Get RapidTriageME up and running in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Chrome or Edge browser
- Terminal/Command line access

## 🚀 5-Minute Setup

### Step 1: Install the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `rapidtriage-extension` folder
5. The extension icon should appear in your toolbar

### Step 2: Start the Local Server

```bash
# Using npm (recommended)
npx @yarlisai/rapidtriage-server

# Or clone and run locally
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME
./run.sh test
```

You should see:
```
🚀 RapidTriage Server running on port 1421
Available at: http://localhost:1421
```

### Step 3: Configure Your AI Assistant

=== "Claude (via MCP)"

    Add to your Claude configuration:
    
    ```json
    {
      "mcpServers": {
        "rapidtriage": {
          "command": "npx",
          "args": ["@yarlisai/rapidtriage-mcp"],
          "env": {
            "BROWSER_TOOLS_PORT": "1421"
          }
        }
      }
    }
    ```

=== "Cursor IDE"

    Add to `.cursor/mcp_settings.json`:
    
    ```json
    {
      "mcpServers": {
        "rapidtriage": {
          "command": "node",
          "args": ["/path/to/rapidtriage-mcp/dist/mcp-server.js"],
          "env": {
            "BROWSER_TOOLS_PORT": "1421"
          }
        }
      }
    }
    ```

### Step 4: Test the Connection

1. Open any website in Chrome
2. Open DevTools (F12)
3. Click on the "BrowserToolsMCP" tab
4. You should see "Connected" status

### Step 5: Start Debugging!

Ask your AI assistant:
- "Check the console logs"
- "Show me network errors"
- "Take a screenshot"
- "Run an accessibility audit"

## ✅ Verification Checklist

- [ ] Chrome extension loaded and visible
- [ ] Server running on port 1421
- [ ] DevTools panel shows "Connected"
- [ ] AI assistant can retrieve browser data

## 🎉 Success!

You're now ready to use RapidTriageME for AI-powered browser debugging.

## Next Steps

- [Learn about the architecture](../architecture/overview.md)
- [Explore advanced features](../guides/debugging.md)
- [Deploy to production](../deployment/cloudflare.md)

## Common Issues

??? question "Server not starting?"
    Make sure port 1421 is not in use:
    ```bash
    lsof -i :1421
    # Kill any process using the port
    kill -9 <PID>
    ```

??? question "Extension not connecting?"
    1. Check the server is running
    2. Reload the extension
    3. Refresh the browser tab
    4. Check DevTools console for errors

??? question "AI not receiving data?"
    Verify MCP configuration:
    ```bash
    # Test MCP server directly
    npx @yarlisai/rapidtriage-mcp
    ```

Need help? Check our [troubleshooting guide](../troubleshooting/common-issues.md) or [open an issue](https://github.com/YarlisAISolutions/rapidtriageME/issues).