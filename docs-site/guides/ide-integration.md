# IDE Integration Guide

## 🚀 Set up RapidTriageME with your favorite IDE or AI assistant

RapidTriageME integrates seamlessly with modern IDEs and AI coding assistants through the Model Context Protocol (MCP).

## Supported IDEs and Assistants

### AI-First IDEs
- **Cursor** - Native MCP support with full tool integration
- **Claude Desktop** - Direct integration with Anthropic's AI
- **Windsurf** - Modern IDE with AI capabilities
- **Zed** - High-performance collaborative editor

### Traditional IDEs with Extensions
- **VS Code** - Via Continue, Codeium, or GitHub Copilot
- **JetBrains IDEs** - IntelliJ, WebStorm, PyCharm via AI Assistant
- **Sublime Text** - With LSP and AI plugins
- **Neovim** - Through CoC or native LSP

## Quick Setup

### 1. Prerequisites

```bash
# Install Node.js (required)
node --version  # Should be >= 18.0.0

# Install RapidTriageME
npm install -g @rapidtriage/mcp-server @rapidtriage/browser-server

# Verify installation
rapidtriage-server --version
rapidtriage-mcp --version
```

### 2. Start the Browser Server

```bash
# Start the server (runs on port 1421 by default)
npx @rapidtriage/browser-server

# Or with custom port
RAPIDTRIAGE_PORT=3000 npx @rapidtriage/browser-server
```

### 3. Configure Your IDE

## IDE-Specific Configuration

### Cursor IDE

Edit `~/.cursor/mcp_settings.json`:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@rapidtriage/mcp-server"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "BROWSER_TOOLS_HOST": "localhost",
        "NODE_ENV": "development",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Features in Cursor:**
- ✅ Automatic screenshot capture
- ✅ Console log retrieval
- ✅ Network request monitoring
- ✅ Performance audits
- ✅ Auto-paste screenshots

### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/config.json`  
**Windows:** `%APPDATA%\Claude\config.json`  
**Linux:** `~/.config/Claude/config.json`

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@rapidtriage/mcp-server"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "DEBUG": "true"
      }
    }
  }
}
```

### VS Code with Continue

Edit `~/.continue/config.json`:

```json
{
  "models": [
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-api-key"
    }
  ],
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@rapidtriage/mcp-server"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421"
      }
    }
  },
  "customCommands": [
    {
      "name": "screenshot",
      "description": "Capture browser screenshot",
      "prompt": "Use RapidTriage to capture a screenshot"
    }
  ]
}
```

### Windsurf

Edit `~/.windsurf/config.json`:

```json
{
  "ai": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet"
  },
  "extensions": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@rapidtriage/mcp-server"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "AUTO_RECONNECT": "true"
      }
    }
  }
}
```

### JetBrains IDEs (IntelliJ, WebStorm, PyCharm)

1. Install the AI Assistant plugin
2. Go to **Settings → Tools → AI Assistant → MCP Servers**
3. Add new server:

```yaml
name: RapidTriageME
command: npx
args:
  - "@rapidtriage/mcp-server"
environment:
  BROWSER_TOOLS_PORT: "1421"
  BROWSER_TOOLS_HOST: "localhost"
```

### Zed Editor

Edit `~/.config/zed/settings.json`:

```json
{
  "language_servers": {
    "rapidtriage-mcp": {
      "command": "npx",
      "args": ["@rapidtriage/mcp-server"],
      "env": {
        "BROWSER_TOOLS_PORT": "1421",
        "NODE_ENV": "development"
      }
    }
  },
  "assistant": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet"
  }
}
```

## Advanced Configuration

### Environment Variables

All IDEs support these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `BROWSER_TOOLS_PORT` | Server port | `1421` |
| `BROWSER_TOOLS_HOST` | Server host | `localhost` |
| `LOG_LEVEL` | Logging level | `info` |
| `DEBUG` | Enable debug mode | `false` |
| `AUTO_RECONNECT` | Auto-reconnect on disconnect | `true` |
| `MAX_RECONNECT_ATTEMPTS` | Max reconnection attempts | `10` |
| `RECONNECT_DELAY` | Delay between reconnects (ms) | `5000` |

### Custom Configuration File

Create `~/.rapidtriage/config.json`:

```json
{
  "server": {
    "port": 1421,
    "host": "localhost",
    "ssl": false
  },
  "browser": {
    "headless": false,
    "devtools": true,
    "viewport": {
      "width": 1920,
      "height": 1080
    }
  },
  "features": {
    "autoScreenshot": true,
    "networkCapture": true,
    "consoleCapture": true,
    "performanceAudit": true
  },
  "ai": {
    "autoSummarize": true,
    "contextWindow": 128000
  }
}
```

## Testing Your Setup

### 1. Verify MCP Connection

```bash
# Test MCP server directly
npx @rapidtriage/mcp-server --test

# Expected output:
# ✅ MCP Server running
# ✅ Connected to browser server at localhost:1421
# ✅ Available tools: 15
```

### 2. Test in Your IDE

Ask your AI assistant:

```
"Can you check what browser debugging tools are available?"
```

Expected response should list RapidTriageME tools:
- screenshot_capture
- get_console_logs
- get_network_requests
- run_lighthouse_audit
- etc.

### 3. Test Screenshot Capture

```
"Take a screenshot of google.com"
```

The AI should:
1. Use the screenshot_capture tool
2. Navigate to google.com
3. Capture and return the screenshot
4. (In Cursor) Auto-paste the image

## Troubleshooting

### Connection Issues

```bash
# Check if server is running
lsof -i :1421

# Check Node.js path
which node
which npx

# Test with absolute paths
/usr/local/bin/npx @rapidtriage/mcp-server
```

### IDE Not Finding Tools

1. **Restart IDE** after configuration changes
2. **Check logs**:
   ```bash
   # View MCP logs
   tail -f ~/.rapidtriage/logs/mcp.log
   
   # Enable debug mode
   DEBUG=rapidtriage:* npx @rapidtriage/mcp-server
   ```

3. **Verify configuration path**:
   - Cursor: `~/.cursor/mcp_settings.json`
   - VS Code: `~/.continue/config.json`
   - Claude: Platform-specific (see above)

### Permission Errors

```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Reinstall
npm install -g @rapidtriage/mcp-server
```

## Features by IDE

| Feature | Cursor | Claude | VS Code | JetBrains | Zed |
|---------|--------|--------|---------|-----------|-----|
| **Auto Screenshot Paste** | ✅ | ❌ | ✅* | ❌ | ❌ |
| **Tool Discovery** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Streaming Responses** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom Commands** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Multi-Model Support** | ✅ | ❌ | ✅ | ✅ | ✅ |

*With Continue extension

## Best Practices

### 1. Development Workflow

```javascript
// .rapidtriage/workflows/debug.js
module.exports = {
  name: "Debug React App",
  steps: [
    { tool: "screenshot_capture", params: { url: "http://localhost:3000" } },
    { tool: "get_console_logs", params: { level: "error" } },
    { tool: "get_network_requests", params: { failed: true } },
    { tool: "run_lighthouse_audit", params: { categories: ["performance"] } }
  ]
};
```

### 2. IDE Shortcuts

**Cursor:**
- `Cmd+K` → "screenshot" - Quick screenshot
- `Cmd+K` → "debug" - Run debug workflow

**VS Code:**
- Create tasks in `.vscode/tasks.json`
- Use Continue slash commands

### 3. Team Configuration

Share configuration via Git:

```bash
# .rapidtriage/team-config.json
{
  "server": {
    "port": "${TEAM_PORT:-1421}",
    "host": "${TEAM_HOST:-localhost}"
  }
}

# .env.example
TEAM_PORT=1421
TEAM_HOST=localhost
```

## Integration Examples

### React Debugging

```typescript
// Ask AI: "Debug why my React component isn't rendering"
// AI will automatically:
// 1. Take screenshot
// 2. Check console errors
// 3. Analyze component tree
// 4. Suggest fixes
```

### API Testing

```typescript
// Ask AI: "Test my API endpoints and check for failures"
// AI will:
// 1. Monitor network requests
// 2. Identify failed requests
// 3. Analyze response codes
// 4. Suggest improvements
```

### Performance Optimization

```typescript
// Ask AI: "Run performance audit on my site"
// AI will:
// 1. Run Lighthouse audit
// 2. Analyze metrics
// 3. Provide optimization suggestions
// 4. Generate performance report
```

## Next Steps

- 🔍 [Debugging Techniques](debugging.md) - Master browser debugging
- ⚡ [Performance Guide](performance.md) - Optimize your applications
- 🔒 [Security Guide](security.md) - Secure your debugging setup
- 📊 [API Reference](/api) - Complete tool documentation

## Support

Need help with IDE integration?

- 📖 [Documentation](https://docs.rapidtriage.me)
- 💬 [Discord Community](https://discord.gg/rapidtriage)
- 🐛 [Report Issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- 📧 [Email Support](mailto:support@rapidtriage.me)