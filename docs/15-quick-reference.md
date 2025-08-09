# RapidTriageME Quick Reference

## 🎯 Most Common Commands

### Local Development (Stdio)
```bash
# Start MCP server
cd rapidtriage-mcp && node dist/mcp-server.js stdio

# Test with JSON-RPC
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | node dist/mcp-server.js stdio
```

### Local Development (HTTP)
```bash
# Terminal 1: Start backend
cd rapidtriage-server && npm start

# Terminal 2: Start Worker
cd .. && npm run dev

# Terminal 3: Test
curl http://localhost:8787/health
```

### Production (HTTP)
```bash
# Health check
curl https://rapidtriage.me/health

# Take screenshot
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"screenshot","arguments":{"url":"https://example.com"}},"id":1}'
```

## 📝 Claude Code Settings

### Minimal Configuration
```json
{
  "mcpServers": {
    "rapidtriage": {
      "url": "https://rapidtriage.me/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8"
      }
    }
  }
}
```

### Full Configuration
```json
{
  "mcpServers": {
    "rapidtriage-local": {
      "command": "node",
      "args": ["/path/to/rapidtriage-mcp/dist/mcp-server.js", "stdio"]
    },
    "rapidtriage-remote": {
      "url": "https://rapidtriage.me/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8"
      }
    }
  }
}
```

## 🔧 Available Tools

| Tool | Description | Example |
|------|-------------|---------|
| `screenshot` | Capture webpage screenshot | `{"url": "https://example.com", "fullPage": true}` |
| `console_logs` | Get browser console logs | `{"url": "https://example.com", "level": "error"}` |
| `lighthouse` | Run performance audit | `{"url": "https://example.com", "categories": ["performance"]}` |
| `inspect_element` | Inspect DOM element | `{"url": "https://example.com", "selector": "#id"}` |
| `execute_js` | Execute JavaScript | `{"url": "https://example.com", "code": "document.title"}` |

## 🚀 Quick Tests

### Test Everything Works
```bash
# 1. Check health
curl https://rapidtriage.me/health

# 2. List tools
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'

# 3. Take screenshot
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"screenshot","arguments":{"url":"https://google.com"}},"id":2}'
```

## 📍 Endpoints

| Environment | URL | Auth Token |
|------------|-----|------------|
| **Production** | https://rapidtriage.me/mcp | `KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8` |
| **Local HTTP** | http://localhost:8787/mcp | `test-token` |
| **Local Stdio** | Direct pipe | N/A |

## 🐛 Troubleshooting

```bash
# Check backend is running
curl http://localhost:3025/health

# View Worker logs
npm run tail

# Test auth token
curl -H "Authorization: Bearer YOUR_TOKEN" https://rapidtriage.me/health

# Debug mode
DEBUG=* node dist/mcp-server.js stdio
```

## 📦 Installation

```bash
# Clone repo
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME

# Install everything
npm install
cd rapidtriage-mcp && npm install && cd ..
cd rapidtriage-server && npm install && cd ..

# Build
cd rapidtriage-mcp && npm run build
```

## 🎮 Claude Code Usage

```bash
# After configuring ~/.claude/settings.json

# Use with Claude
claude-code chat "Take a screenshot of example.com"
claude-code chat "Get console errors from github.com"
claude-code chat "Run Lighthouse audit on google.com"
claude-code chat "Inspect the main heading on wikipedia.org"
```

---
*Production Token*: `KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8`
*Production URL*: `https://rapidtriage.me/mcp`