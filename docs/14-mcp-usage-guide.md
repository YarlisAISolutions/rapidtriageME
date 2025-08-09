# RapidTriageME MCP Usage Guide

Complete guide for using RapidTriageME with Claude Code via stdio and HTTP modes, both locally and remotely.

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Local Stdio Mode](#local-stdio-mode)
- [Local HTTP Mode](#local-http-mode)
- [Remote HTTP Mode (Production)](#remote-http-mode-production)
- [Claude Code Configuration](#claude-code-configuration)
- [Testing Commands](#testing-commands)

---

## 🚀 Quick Start

### Prerequisites
1. Install Claude Code CLI: `npm install -g @anthropic/claude-code`
2. Clone RapidTriageME: `git clone https://github.com/YarlisAISolutions/rapidtriageME.git`
3. Install dependencies: `cd rapidtriageME && npm install`

---

## 📝 Local Stdio Mode

### 1. Start the MCP Server in Stdio Mode

```bash
# Navigate to the MCP server directory
cd rapidtriage-mcp

# Install dependencies
npm install

# Start in stdio mode
node dist/mcp-server.js stdio
```

### 2. Configure Claude Code Settings

Create or update `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "rapidtriage-local-stdio": {
      "command": "node",
      "args": ["/Users/yarlis/Downloads/rapidtriageME/rapidtriage-mcp/dist/mcp-server.js", "stdio"],
      "env": {
        "BROWSER_TOOLS_PORT": "3025",
        "BROWSER_TOOLS_HOST": "127.0.0.1"
      }
    }
  }
}
```

### 3. Test Stdio Mode Locally

```bash
# In a new terminal, start the browser backend
cd rapidtriage-server
npm start

# Test with Claude Code
claude-code chat "Take a screenshot of example.com using the local stdio MCP server"
```

### 4. Direct Stdio Testing

```bash
# Send JSON-RPC commands directly
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"1.0.0"},"id":1}' | \
  node rapidtriage-mcp/dist/mcp-server.js stdio

# List available tools
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' | \
  node rapidtriage-mcp/dist/mcp-server.js stdio

# Take a screenshot
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"take_screenshot","arguments":{"url":"https://example.com"}},"id":3}' | \
  node rapidtriage-mcp/dist/mcp-server.js stdio
```

---

## 🌐 Local HTTP Mode

### 1. Start Local HTTP Server

```bash
# Start the browser backend server
cd rapidtriage-server
npm start  # Runs on port 3025

# In another terminal, start the Cloudflare Worker locally
cd ..
npm run dev  # Runs on port 8787
```

### 2. Configure Claude Code for Local HTTP

Update `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "rapidtriage-local-http": {
      "url": "http://localhost:8787/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer test-token"
      },
      "env": {
        "BACKEND_URL": "http://localhost:3025"
      }
    }
  }
}
```

### 3. Test Local HTTP Mode

```bash
# Test health endpoint
curl http://localhost:8787/health

# Test with Claude Code
claude-code chat "Using the local HTTP server, analyze the console logs from https://example.com"

# Direct API calls
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "screenshot",
      "arguments": {
        "url": "https://example.com",
        "fullPage": true
      }
    },
    "id": 1
  }'
```

### 4. Test SSE Streaming Locally

```bash
# Connect to Server-Sent Events stream
curl -N http://localhost:8787/sse \
  -H "Authorization: Bearer test-token"
```

---

## 🌍 Remote HTTP Mode (Production)

### 1. Production Configuration

Update `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "rapidtriage-production": {
      "url": "https://rapidtriage.me/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8"
      },
      "description": "RapidTriageME production browser automation"
    }
  }
}
```

### 2. Test Production Endpoints

```bash
# Health check
curl https://rapidtriage.me/health

# Initialize MCP connection
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {}
    },
    "id": 1
  }'

# List available tools
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }'
```

### 3. Use with Claude Code (Production)

```bash
# After configuring settings.json
claude-code chat "Connect to rapidtriage-production and take a screenshot of https://google.com"

# Run Lighthouse audit
claude-code chat "Using rapidtriage-production, run a Lighthouse audit on https://example.com"

# Get console logs
claude-code chat "Through rapidtriage-production, get the console logs from https://github.com"
```

---

## ⚙️ Claude Code Configuration

### Complete Settings Example

Create `~/.claude/settings.json` with all configurations:

```json
{
  "mcpServers": {
    "rapidtriage-local-stdio": {
      "command": "node",
      "args": ["/Users/yarlis/Downloads/rapidtriageME/rapidtriage-mcp/dist/mcp-server.js", "stdio"],
      "env": {
        "BROWSER_TOOLS_PORT": "3025",
        "BROWSER_TOOLS_HOST": "127.0.0.1"
      },
      "description": "Local stdio mode for development"
    },
    "rapidtriage-local-http": {
      "url": "http://localhost:8787/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer test-token"
      },
      "env": {
        "BACKEND_URL": "http://localhost:3025"
      },
      "description": "Local HTTP mode for testing"
    },
    "rapidtriage-production": {
      "url": "https://rapidtriage.me/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8",
        "X-API-Key": "your-api-key-if-needed"
      },
      "description": "Production RapidTriageME service"
    }
  },
  "defaultMcpServer": "rapidtriage-production"
}
```

### Environment Variables

For sensitive data, use environment variables:

```bash
# Set environment variables
export RAPIDTRIAGE_AUTH_TOKEN="KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8"
export RAPIDTRIAGE_BACKEND_URL="https://your-backend.com"

# Reference in settings.json
{
  "mcpServers": {
    "rapidtriage-production": {
      "url": "https://rapidtriage.me/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer ${RAPIDTRIAGE_AUTH_TOKEN}"
      }
    }
  }
}
```

---

## 🧪 Testing Commands

### Complete Test Suite

```bash
# 1. Test stdio mode
cd rapidtriage-mcp
npm test

# 2. Test HTTP endpoints
node test-production-api.js

# 3. Test with example client
node test-both-modes.js

# 4. Browser-based testing
open test-http-streaming-client.html
```

### Tool-Specific Examples

#### Screenshot Tool
```bash
# Stdio mode
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"take_screenshot","arguments":{"url":"https://example.com","fullPage":true}},"id":1}' | node rapidtriage-mcp/dist/mcp-server.js stdio

# HTTP mode (local)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"screenshot","arguments":{"url":"https://example.com"}},"id":1}'

# HTTP mode (production)
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"screenshot","arguments":{"url":"https://example.com"}},"id":1}'
```

#### Console Logs Tool
```bash
# Get console logs from a webpage
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "console_logs",
      "arguments": {
        "url": "https://example.com",
        "level": "error"
      }
    },
    "id": 2
  }'
```

#### Lighthouse Audit Tool
```bash
# Run performance audit
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "lighthouse",
      "arguments": {
        "url": "https://example.com",
        "categories": ["performance", "accessibility", "seo"]
      }
    },
    "id": 3
  }'
```

#### Element Inspection Tool
```bash
# Inspect DOM element
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "inspect_element",
      "arguments": {
        "url": "https://example.com",
        "selector": "#main-content"
      }
    },
    "id": 4
  }'
```

#### JavaScript Execution Tool
```bash
# Execute JavaScript in browser context
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_js",
      "arguments": {
        "url": "https://example.com",
        "code": "document.title"
      }
    },
    "id": 5
  }'
```

---

## 🔍 Debugging

### Enable Debug Logging

```bash
# For stdio mode
DEBUG=* node rapidtriage-mcp/dist/mcp-server.js stdio

# For HTTP mode
LOG_LEVEL=debug npm run dev

# View Cloudflare Worker logs
npm run tail
```

### Common Issues and Solutions

#### Issue: "Connection refused"
```bash
# Check if backend is running
curl http://localhost:3025/health

# Start backend if needed
cd rapidtriage-server && npm start
```

#### Issue: "Authentication failed"
```bash
# Verify token is correct
echo $RAPIDTRIAGE_AUTH_TOKEN

# Test with correct token
curl -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  https://rapidtriage.me/health
```

#### Issue: "Rate limit exceeded"
```bash
# Wait for rate limit reset or use different IP
# Check rate limit headers in response
curl -I https://rapidtriage.me/mcp
```

---

## 📊 Monitoring

### Health Checks

```bash
# Local health check
watch -n 5 'curl -s http://localhost:3025/health | jq .'

# Production health check
watch -n 10 'curl -s https://rapidtriage.me/health | jq .'
```

### Performance Testing

```bash
# Load test with Apache Bench
ab -n 100 -c 10 -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
  https://rapidtriage.me/health

# Concurrent request testing
for i in {1..10}; do
  curl -X POST https://rapidtriage.me/mcp \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
    -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":'$i'}' &
done
wait
```

---

## 🚢 Deployment Scripts

### Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh - Deploy RapidTriageME

# Deploy backend
cd rapidtriage-server
docker build -t rapidtriage-backend .
docker run -d -p 3025:3025 --name rapidtriage rapidtriage-backend

# Deploy Worker
cd ..
npm run deploy:production

# Test deployment
curl https://rapidtriage.me/health
```

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./rapidtriage-server
    ports:
      - "3025:3025"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3025/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 📚 Additional Resources

- [MCP Protocol Documentation](https://modelcontextprotocol.org)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers)
- [Puppeteer Documentation](https://pptr.dev)

---

## 🆘 Support

For issues or questions:
- GitHub Issues: [https://github.com/YarlisAISolutions/rapidtriageME/issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- Documentation: [https://rapidtriage.me/docs](https://rapidtriage.me/docs)

---

*Last Updated: August 9, 2025*
*Version: 2.0.0*