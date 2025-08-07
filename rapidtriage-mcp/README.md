# RapidTriage MCP Server

A Model Context Protocol (MCP) server by YarlisAISolutions that provides AI-powered browser triage and debugging capabilities. This server works in conjunction with the RapidTriage Server to provide comprehensive browser analysis and remote debugging.

## Features

- MCP protocol implementation
- Browser console log access
- Network request analysis
- Screenshot capture capabilities
- Element selection and inspection
- Real-time browser state monitoring
- Accessibility, performance, SEO, and best practices audits

## Prerequisites

- Node.js 14 or higher
- RapidTriage Server running
- Chrome or Chromium browser installed (required for audit functionality)

## Installation

```bash
npx @yarlisai/rapidtriage-mcp
```

Or install globally:

```bash
npm install -g @yarlisai/rapidtriage-mcp
```

## Usage

1. First, make sure the RapidTriage Server is running:

```bash
npx @yarlisai/rapidtriage-server
```

2. Then start the MCP server:

```bash
npx @yarlisai/rapidtriage-mcp
```

3. The MCP server will connect to the RapidTriage Server and provide the following capabilities:

- Console log retrieval
- Network request monitoring
- Screenshot capture
- Element selection
- Browser state analysis
- Accessibility and performance audits

## MCP Functions

The server provides the following MCP functions:

- `mcp_getConsoleLogs` - Retrieve browser console logs
- `mcp_getConsoleErrors` - Get browser console errors
- `mcp_getNetworkErrors` - Get network error logs
- `mcp_getNetworkSuccess` - Get successful network requests
- `mcp_getNetworkLogs` - Get all network logs
- `mcp_getSelectedElement` - Get the currently selected DOM element
- `mcp_runAccessibilityAudit` - Run a WCAG-compliant accessibility audit
- `mcp_runPerformanceAudit` - Run a performance audit
- `mcp_runSEOAudit` - Run an SEO audit
- `mcp_runBestPracticesAudit` - Run a best practices audit

## Integration

This server works with **ALL** MCP-compatible IDEs and AI platforms:

### Supported IDEs:
- **Cursor** - AI-first code editor
- **VS Code** - With Continue extension
- **Zed** - Multiplayer code editor
- **Cline** - Autonomous coding agent
- **Claude Desktop** - Official Anthropic app
- **Windsurf** - AI pair programming IDE
- **JetBrains** - IntelliJ, WebStorm, PyCharm
- **Neovim** - With AI plugins
- **Sublime Text** - With LSP-AI
- **Any MCP client** - Generic support

See [IDE_CONFIGURATION.md](../IDE_CONFIGURATION.md) for detailed setup instructions.

## License

MIT
