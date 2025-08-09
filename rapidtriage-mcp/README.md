# 🚀 RapidTriage MCP Server

> **Model Context Protocol server for AI-powered browser debugging and triage**

[![npm version](https://img.shields.io/npm/v/@yarlis/rapidtriage-mcp.svg)](https://www.npmjs.com/package/@yarlis/rapidtriage-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Available Tools](#-available-tools)
- [IDE Integration](#-ide-integration)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## 🎯 Overview

RapidTriage MCP Server is a Model Context Protocol implementation that enables AI assistants to interact with browsers for debugging, testing, and analysis. It provides comprehensive browser control and inspection capabilities through a standardized protocol that works with any MCP-compatible IDE or AI platform.

### What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI assistants to interact with external tools and services. RapidTriage MCP Server implements this protocol to provide browser debugging capabilities to AI coding assistants.

## ✨ Features

### Core Capabilities
- 🔍 **Browser Inspection** - Access console logs, network requests, and DOM elements
- 📸 **Screenshot Capture** - Full-page and viewport screenshots with annotations
- 🎯 **Element Selection** - Inspect and interact with specific DOM elements
- 📊 **Network Monitoring** - Track all network requests and responses
- 🔬 **Console Access** - Read console logs, errors, and warnings in real-time

### Advanced Auditing
- ♿ **Accessibility Audits** - WCAG 2.1 compliance checking
- ⚡ **Performance Analysis** - Core Web Vitals and performance metrics
- 🔍 **SEO Audits** - Search engine optimization analysis
- ✅ **Best Practices** - Security headers, HTTPS, and modern web standards

### Developer Experience
- 🔄 **Real-time Updates** - Live browser state monitoring
- 🤖 **AI-Optimized** - Structured outputs for LLM consumption
- 🔧 **Multi-IDE Support** - Works with 10+ popular IDEs
- 📦 **Zero Config** - Works out of the box with sensible defaults

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Chrome/Chromium** browser (for audit features)
- **RapidTriage Server** running (see Quick Start)

## 🚀 Quick Start

```bash
# Step 1: Start the browser server
npx @yarlis/rapidtriage-server@latest

# Step 2: In another terminal, start the MCP server
npx @yarlis/rapidtriage-mcp@latest

# Step 3: Configure your IDE (see IDE Integration section)
```

That's it! Your AI assistant can now interact with browsers.

## 📦 Installation

### Using npx (Recommended)

```bash
npx @yarlis/rapidtriage-mcp@latest
```

### Global Installation

```bash
npm install -g @yarlis/rapidtriage-mcp
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME/rapidtriage-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## ⚙️ Configuration

### Environment Variables

```bash
# Server connection
BROWSER_TOOLS_PORT=1421          # Port for browser server connection
BROWSER_TOOLS_HOST=localhost     # Host for browser server

# Debugging
DEBUG=true                        # Enable debug logging
LOG_LEVEL=info                    # Log level (error, warn, info, debug)

# Performance
TIMEOUT=30000                     # Request timeout in milliseconds
MAX_RETRIES=3                     # Maximum connection retry attempts
```

### Configuration File

Create a `.rapidtriagerc` file in your project root:

```json
{
  "browserServer": {
    "host": "localhost",
    "port": 1421,
    "secure": false
  },
  "mcp": {
    "name": "rapidtriage",
    "version": "1.0.0"
  },
  "features": {
    "screenshots": true,
    "audits": true,
    "console": true,
    "network": true
  }
}
```

## 🛠️ Available Tools

### Browser Control

| Tool | Description | Parameters |
|------|-------------|------------|
| `mcp_navigate` | Navigate to a URL | `url: string` |
| `mcp_screenshot` | Capture screenshot | `fullPage?: boolean, selector?: string` |
| `mcp_executeJS` | Execute JavaScript | `code: string` |
| `mcp_click` | Click an element | `selector: string` |
| `mcp_type` | Type text | `selector: string, text: string` |

### Debugging Tools

| Tool | Description | Returns |
|------|-------------|---------|
| `mcp_getConsoleLogs` | Get all console logs | Log entries array |
| `mcp_getConsoleErrors` | Get console errors only | Error entries array |
| `mcp_getNetworkLogs` | Get all network requests | Request/response array |
| `mcp_getNetworkErrors` | Get failed requests | Failed requests array |
| `mcp_getSelectedElement` | Get selected DOM element | Element details |

### Audit Tools

| Tool | Description | Metrics |
|------|-------------|---------|
| `mcp_runAccessibilityAudit` | WCAG compliance check | Violations, passes, incomplete |
| `mcp_runPerformanceAudit` | Performance metrics | LCP, FID, CLS, TTI, Speed Index |
| `mcp_runSEOAudit` | SEO analysis | Meta tags, structured data, crawlability |
| `mcp_runBestPracticesAudit` | Security & standards | HTTPS, headers, console errors |

### Utility Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `mcp_waitForSelector` | Wait for element | `selector: string, timeout?: number` |
| `mcp_getPageMetrics` | Get page metrics | None |
| `mcp_clearBrowserData` | Clear browser data | `cookies?: boolean, cache?: boolean` |

## 🔧 IDE Integration

### Cursor IDE

Edit `~/.cursor/config.json`:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421"
      }
    }
  }
}
```

### VS Code with Continue

Edit `~/.continue/config.json`:

```json
{
  "models": [...],
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp@latest"]
    }
  }
}
```

### Claude Desktop

Edit `~/Library/Application Support/Claude/config.json` (macOS):

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

### Other IDEs

See our [IDE Configuration Guide](https://rapidtriage.me/docs/ide-configuration) for:
- Windsurf
- Zed
- Cline
- JetBrains IDEs
- Neovim
- Sublime Text
- And more...

## 📖 API Reference

### Protocol

The MCP server communicates using JSON-RPC 2.0 over stdio (standard input/output).

### Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "mcp_screenshot",
    "arguments": {
      "fullPage": true
    }
  },
  "id": 1
}
```

### Response Format

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Screenshot captured successfully"
      },
      {
        "type": "image",
        "data": "base64_encoded_image_data"
      }
    ]
  },
  "id": 1
}
```

## 🔍 Troubleshooting

### Common Issues

#### Server Connection Failed

```bash
# Check if browser server is running
curl http://localhost:1421/health

# Restart the browser server
npx @yarlis/rapidtriage-server@latest
```

#### MCP Server Not Found in IDE

1. Restart your IDE after configuration
2. Check Node.js is in PATH: `node --version`
3. Try absolute path to npx:
   ```json
   {
     "command": "/usr/local/bin/npx",
     "args": ["@yarlis/rapidtriage-mcp@latest"]
   }
   ```

#### Chrome Not Found for Audits

```bash
# Install Chrome or Chromium
# macOS
brew install --cask google-chrome

# Linux
sudo apt-get install chromium-browser

# Set Chrome path explicitly
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
DEBUG=true npx @yarlis/rapidtriage-mcp@latest
```

Check logs at:
- macOS/Linux: `~/.rapidtriage/logs/`
- Windows: `%APPDATA%\rapidtriage\logs\`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/YarlisAISolutions/rapidtriageME/blob/main/CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repo
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME/rapidtriage-mcp

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run locally
npm start
```

## 💬 Support

- 📧 **Email**: support@rapidtriage.me
- 💬 **Discord**: [Join our community](https://discord.gg/rapidtriage)
- 🐛 **Issues**: [GitHub Issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- 📖 **Docs**: [rapidtriage.me/docs](https://rapidtriage.me/docs)

## 📄 License

MIT © [YarlisAISolutions](https://github.com/YarlisAISolutions)

---

**Built with ❤️ by YarlisAISolutions** | [Website](https://rapidtriage.me) | [GitHub](https://github.com/YarlisAISolutions/rapidtriageME)