# 🚀 RapidTriageME

> **YarlisAISolutions** - Make your AI tools 10x more aware and capable of interacting with your browser

RapidTriageME is a powerful browser triage and debugging platform by YarlisAISolutions that enables AI-powered applications via Anthropic's Model Context Protocol (MCP) to capture and analyze browser data through a Chrome extension for remote debugging and comprehensive browser analysis.

## 📚 Documentation

Read our comprehensive [documentation](https://rapidtriage.me/docs) for installation, quickstart, and contribution guides.

## 🎯 Key Features

- 🔍 **Real-time Browser Monitoring** - Capture console logs, network requests, and DOM changes
- 📸 **Advanced Screenshot Capture** - Full-page and viewport screenshots with annotations
- 🔬 **Lighthouse Audits** - Performance, accessibility, SEO, and best practices analysis
- 🌐 **Remote Debugging** - Debug browsers from anywhere with SSE transport
- 🤖 **Multi-IDE Support** - Works with 10+ IDEs and AI coding assistants
- 🔒 **Secure** - Token-based authentication and rate limiting
- ☁️ **Cloud Ready** - Deployable to Cloudflare Workers at rapidtriage.me

## 📦 Project Structure

```
rapidtriageME/
├── rapidtriage-mcp/        # MCP server (@yarlisai/rapidtriage-mcp)
├── rapidtriage-server/     # Browser server (@yarlisai/rapidtriage-server)
├── rapidtriage-extension/  # Browser extension
├── src/                   # Cloudflare Worker source
└── docs/                  # Documentation
```

## 🏁 Roadmap

Check out our project roadmap here: [Github Roadmap / Project Board](https://github.com/orgs/YarlisAISolutions/projects/1/views/1)

## 🆕 Updates

### v1.0.0 - Complete Rebranding & Multi-IDE Support
- 🎨 **Rebranded** to YarlisAISolutions RapidTriageME
- 🔧 **Multi-IDE Support** - Now works with 10+ IDEs, not just Cursor
- 📦 **New Package Names** - `@yarlisai/rapidtriage-mcp` and `@yarlisai/rapidtriage-server`
- 🚀 **Cloud Deployment** - Ready for Cloudflare Workers at rapidtriage.me
- 🔄 **Auto-Paste** - Screenshots auto-paste into Cursor (with focus)
- 🎯 **Lighthouse Integration** - SEO, performance, accessibility, and best practice audits
- 🔍 **Debugger Mode** - Execute all debugging tools in sequence
- 📊 **Audit Mode** - Run all auditing tools systematically
- 🌐 **Cross-Platform** - Windows, macOS, and Linux support
- 🔗 **Improved Networking** - Auto-discovery, auto-reconnect, graceful shutdown

## 🚀 Quickstart Guide

### Three Components to Install:

### 1. **Install Chrome Extension**
Download and install the RapidTriage Chrome Extension:
[v1.0.0 RapidTriage Chrome Extension](https://github.com/YarlisAISolutions/rapidtriage-extension/releases/download/v1.0.0/RapidTriage-1.0.0-extension.zip)

### 2. **Install MCP Server** (in your IDE)
```bash
npx @yarlisai/rapidtriage-mcp@latest
```

### 3. **Start Browser Server** (in terminal)
```bash
npx @yarlisai/rapidtriage-server@latest
```

### Important Notes:
- **Two servers needed**:
  - `rapidtriage-server` - Local Node.js middleware for gathering logs
  - `rapidtriage-mcp` - MCP server for IDE integration
- **Configuration**: See [IDE_CONFIGURATION.md](./IDE_CONFIGURATION.md) for your specific IDE
- **Chrome DevTools**: Open DevTools and navigate to the RapidTriage panel

### Troubleshooting:
- Quit and restart Chrome completely (not just the window)
- Restart the rapidtriage-server
- Ensure only ONE Chrome DevTools panel is open
- Check that both servers are running

## 🔄 MCP Transport Modes

RapidTriageME supports both official MCP transport protocols, allowing flexible deployment scenarios from local development to cloud-based production environments.

### 📡 Transport Mode Overview

| Transport | Use Case | Communication | Best For |
|-----------|----------|---------------|----------|
| **stdio** | Local Development | stdin/stdout | IDEs, CLI tools, desktop apps |
| **Streamable HTTP/SSE** | Remote/Cloud | HTTP + Server-Sent Events | Web clients, cloud deployment, remote access |

### 🖥️ Mode 1: stdio Transport (Default for Local Development)

The **stdio transport** is the primary mode for local IDE integrations. The MCP server runs as a subprocess of your IDE, communicating via standard input/output streams.

#### How stdio Works:
```
┌─────────────┐     stdio      ┌──────────────┐
│   Your IDE  │ ◄────────────► │  MCP Server  │
│  (Client)   │  stdin/stdout  │  (Subprocess)│
└─────────────┘                └──────────────┘
```

#### Configuration Examples:

**Cursor IDE Configuration** (`~/.cursor/config.json`):
```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlisai/rapidtriage-mcp"],
      "env": {
        "BROWSER_TOOLS_PORT": "3025",
        "BROWSER_TOOLS_HOST": "localhost"
      }
    }
  }
}
```

**VS Code with Continue** (`.continue/config.json`):
```json
{
  "models": [...],
  "mcpServers": {
    "rapidtriage": {
      "command": "node",
      "args": ["/path/to/rapidtriage-mcp/dist/mcp-server.js"],
      "env": {
        "NODE_ENV": "development",
        "BROWSER_TOOLS_PORT": "3025"
      }
    }
  }
}
```

**Claude Desktop** (`~/Library/Application Support/Claude/config.json` on macOS):
```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlisai/rapidtriage-mcp"],
      "env": {
        "BROWSER_TOOLS_PORT": "3025",
        "DEBUG": "true"
      }
    }
  }
}
```

#### Using stdio Transport:

1. **Start the browser server** (required for browser communication):
```bash
npx @yarlisai/rapidtriage-server
# Server starts on port 3025 by default
```

2. **Configure your IDE** with the above configuration

3. **The IDE automatically launches** the MCP server as a subprocess

4. **Communication flow**:
   - IDE sends JSON-RPC messages via stdin
   - MCP server processes and responds via stdout
   - Errors and logs go to stderr

#### Environment Variables for stdio:
```bash
# Optional: Configure custom port
export BROWSER_TOOLS_PORT=3030

# Optional: Configure custom host
export BROWSER_TOOLS_HOST=127.0.0.1

# Optional: Enable debug logging
export DEBUG=true

# Start your IDE (example: Cursor)
cursor .
```

#### Advanced stdio Configuration:

**Custom Installation Path**:
```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "/usr/local/bin/node",
      "args": ["/opt/rapidtriage/mcp-server.js"],
      "cwd": "/opt/rapidtriage",
      "env": {
        "BROWSER_TOOLS_PORT": "3025",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### 🌐 Mode 2: Streamable HTTP with SSE Transport (Cloud/Remote)

The **Streamable HTTP/SSE transport** enables remote access and cloud deployment. It uses HTTP POST for client-to-server messages and Server-Sent Events (SSE) for server-to-client streaming.

#### How Streamable HTTP/SSE Works:
```
┌─────────────┐    HTTP POST    ┌──────────────┐
│  Web Client │ ───────────────► │  MCP Server  │
│     or      │                  │   (Remote)   │
│  Remote IDE │ ◄─────────────── │              │
└─────────────┘    SSE Stream    └──────────────┘
```

#### Deployment to Cloudflare Workers:

**1. Configure `wrangler.toml`**:
```toml
name = "rapidtriage-mcp"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

account_id = "your-account-id"
workers_dev = false

routes = [
  { pattern = "rapidtriage.me/mcp/*", zone_name = "rapidtriage.me" }
]

[vars]
ENVIRONMENT = "production"
SSE_ENDPOINT = "/mcp/sse"

# KV namespace for session storage
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-namespace-id"
```

**2. Deploy to Cloudflare**:
```bash
# Install dependencies
npm install

# Deploy to Cloudflare Workers
wrangler deploy

# Your MCP server is now available at:
# https://rapidtriage.me/mcp
```

#### Client Configuration for HTTP/SSE:

**Web Application Integration**:
```javascript
import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';

// Initialize transport
const transport = new StreamableHTTPClientTransport(
  new URL('https://rapidtriage.me/mcp'),
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'X-Client-Id': 'web-app-v1'
    },
    // Optional: Enable session management
    sessionId: localStorage.getItem('mcp-session-id')
  }
);

// Create MCP client
const client = new Client({
  name: 'RapidTriage Web Client',
  version: '1.0.0'
});

// Connect to remote server
await client.connect(transport);

// Use the client
const response = await client.callTool(
  'screenshot_capture',
  { url: 'https://example.com' }
);
```

**Remote IDE Configuration**:
```json
{
  "mcpServers": {
    "rapidtriage-remote": {
      "transport": "http",
      "url": "https://rapidtriage.me/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      },
      "sessionManagement": true
    }
  }
}
```

#### Server Implementation for HTTP/SSE:

**Basic HTTP/SSE Server**:
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { SseServerTransport } from '@modelcontextprotocol/sdk/server/sse';

const server = new McpServer({
  name: 'RapidTriage Remote',
  version: '1.0.0'
});

// Configure SSE transport
const transport = new SseServerTransport({
  endpoint: '/mcp',
  
  // Handle authentication
  authenticate: async (request) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }
    return validateApiKey(auth.slice(7));
  },
  
  // Session management
  sessionStore: {
    create: async () => generateSessionId(),
    get: async (id) => sessions.get(id),
    update: async (id, data) => sessions.set(id, data),
    delete: async (id) => sessions.delete(id)
  }
});

await server.connect(transport);
```

#### Advanced HTTP/SSE Features:

**1. Session Management**:
```javascript
// Client-side session handling
const transport = new StreamableHTTPClientTransport(url, {
  // Automatically manage sessions
  sessionManagement: {
    storage: 'localStorage',
    key: 'mcp-session',
    ttl: 3600000 // 1 hour
  }
});

// Server returns session ID in response headers
// Mcp-Session-Id: abc123-def456-ghi789
```

**2. Resumable Connections**:
```javascript
// Client automatically resumes after disconnect
transport.on('disconnect', () => {
  console.log('Connection lost, will auto-reconnect...');
});

transport.on('reconnect', (lastEventId) => {
  console.log(`Reconnected, resuming from event ${lastEventId}`);
});
```

**3. Rate Limiting & Security**:
```typescript
// Server-side configuration
const transport = new SseServerTransport({
  // Rate limiting
  rateLimiting: {
    windowMs: 60000,     // 1 minute
    maxRequests: 100,    // 100 requests per minute
    keyGenerator: (req) => req.headers.get('X-Client-Id')
  },
  
  // CORS configuration
  cors: {
    origin: ['https://app.example.com'],
    credentials: true
  },
  
  // Security headers
  security: {
    validateOrigin: true,
    requireHttps: true,
    maxPayloadSize: '10mb'
  }
});
```

### 🔀 Choosing the Right Transport Mode

#### Use **stdio Transport** when:
- ✅ Developing locally with an IDE
- ✅ Running on the same machine as the client
- ✅ Need minimal latency
- ✅ Want simple subprocess management
- ✅ Security is handled by the OS

#### Use **HTTP/SSE Transport** when:
- ✅ Deploying to the cloud
- ✅ Building web applications
- ✅ Need remote access
- ✅ Require session management
- ✅ Want horizontal scaling
- ✅ Need authentication/authorization

### 🔄 Transport Mode Comparison

| Feature | stdio | HTTP/SSE |
|---------|-------|----------|
| **Latency** | Minimal (~1ms) | Network dependent (10-100ms) |
| **Scalability** | Single process | Horizontally scalable |
| **Security** | OS-level | Token/OAuth/mTLS |
| **Session Management** | Not needed | Built-in support |
| **Deployment** | Local only | Anywhere |
| **Connection Recovery** | Process restart | Automatic reconnection |
| **Streaming** | Bidirectional | SSE (server→client) |
| **Message Format** | Line-delimited JSON | HTTP + SSE events |

### 📝 Transport Mode Examples

#### Example 1: Local Development with stdio
```bash
# Terminal 1: Start browser server
npx @yarlisai/rapidtriage-server

# Terminal 2: Your IDE automatically starts MCP server
# Just open your project in Cursor/VS Code/etc.

# The flow:
# 1. IDE launches MCP server as subprocess
# 2. MCP server connects to browser server on port 3025
# 3. Browser extension connects to browser server
# 4. You can now use browser tools in your IDE
```

#### Example 2: Cloud Deployment with HTTP/SSE
```bash
# Deploy to Cloudflare
wrangler deploy

# Access from anywhere:
curl -X POST https://rapidtriage.me/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"jsonrpc":"2.0","method":"screenshot_capture","params":{"url":"https://example.com"},"id":1}'

# Response streams back via SSE:
# event: message
# data: {"jsonrpc":"2.0","result":{"screenshot":"base64..."},"id":1}
```

#### Example 3: Hybrid Setup (Local IDE → Remote Server)
```json
{
  "mcpServers": {
    "rapidtriage-local": {
      "command": "npx",
      "args": ["@yarlisai/rapidtriage-mcp"],
      "env": { "BROWSER_TOOLS_PORT": "3025" }
    },
    "rapidtriage-cloud": {
      "transport": "http",
      "url": "https://rapidtriage.me/mcp",
      "headers": { "Authorization": "Bearer YOUR_KEY" }
    }
  }
}
```

### 🔐 Security Considerations

#### stdio Transport Security:
- Runs with user's permissions
- No network exposure
- Secure by default for local use

#### HTTP/SSE Transport Security:
- **Always use HTTPS** in production
- **Implement authentication** (API keys, OAuth, JWT)
- **Validate Origin headers** to prevent DNS rebinding
- **Rate limit** to prevent abuse
- **Use CORS** appropriately
- **Sanitize** all inputs

## 🔧 IDE Compatibility

RapidTriageME works with **ALL** MCP-compatible IDEs and AI coding assistants:

- **Cursor** - AI-first code editor with deep MCP integration
- **Visual Studio Code** - With Continue extension for AI assistance
- **Zed** - High-performance multiplayer code editor
- **Cline** - Autonomous coding agent for VS Code
- **Claude Desktop** - Anthropic's official desktop app
- **Windsurf** - IDE that writes code with you
- **JetBrains IDEs** - IntelliJ, WebStorm, PyCharm with AI Assistant
- **Neovim** - Terminal-based development with AI plugins
- **Sublime Text** - Lightweight editor with LSP-AI
- **Any MCP-compatible client** - Generic configuration available

See [IDE_CONFIGURATION.md](./IDE_CONFIGURATION.md) for detailed setup instructions for each IDE.

## 💬 Example Prompts

### Debugging & Analysis
- "Take a screenshot of the current browser tab"
- "Show me all console errors on this page"
- "What network requests are failing?"
- "Analyze the performance of this page"
- "Check accessibility issues on this page"

### Advanced Operations
- "Run a complete Lighthouse audit"
- "Enter debugger mode and analyze all issues"
- "Generate a comprehensive triage report"
- "Monitor network traffic for 30 seconds"
- "Inspect the element with class 'error-container'"

## 📊 Audit Capabilities

### Accessibility Audit
- WCAG compliance checking
- Color contrast analysis
- Keyboard navigation testing
- ARIA attribute validation
- Screen reader compatibility

### Performance Audit
- Core Web Vitals (LCP, FCP, CLS, TBT)
- Resource optimization suggestions
- Render-blocking resource identification
- Main thread blocking analysis
- Network performance metrics

### SEO Audit
- Meta tag validation
- Heading structure analysis
- Mobile-friendliness checking
- Crawlability assessment
- Structured data validation

### Best Practices Audit
- Security vulnerability detection
- Console error tracking
- Deprecated API usage
- Browser compatibility checks
- Trust and safety validation

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  MCP Client │ ──► │  MCP Server  │ ──► │  Node Server  │ ──► │   Chrome    │
│  (e.g.      │ ◄── │  (Protocol   │ ◄── │ (Middleware)  │ ◄── │  Extension  │
│   Cursor)   │     │   Handler)   │     │               │     │             │
└─────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
```

### Components:

#### Chrome Extension
- Monitors XHR requests/responses and console logs
- Tracks selected DOM elements
- Sends all logs and current element to the RapidTriage Server
- Connects to WebSocket server for screenshots
- Configurable token/truncation limits

#### RapidTriage Server (`rapidtriage-server`)
- Middleware between Chrome extension and MCP server
- Processes requests from MCP server
- Manages WebSocket connections for screenshots
- Intelligent log truncation for token optimization
- Privacy-focused: removes cookies and sensitive headers

#### MCP Server (`rapidtriage-mcp`)
- Implements Model Context Protocol
- Provides standardized tools for AI clients
- Compatible with all major IDEs and AI assistants
- Handles browser interaction commands

## 📦 Installation Options

### NPM Global Installation
```bash
npm install -g @yarlisai/rapidtriage-mcp @yarlisai/rapidtriage-server
```

### Docker Installation
```bash
docker pull yarlisai/rapidtriage:latest
docker run -p 3025:3025 yarlisai/rapidtriage
```

### From Source
```bash
git clone https://github.com/YarlisAISolutions/rapidtriage.git
cd rapidtriage
npm install
npm run build
```

## 🚀 Deployment

### Local Development
1. Start the server: `npx @yarlisai/rapidtriage-server`
2. Configure your IDE (see [IDE_CONFIGURATION.md](./IDE_CONFIGURATION.md))
3. Install Chrome extension
4. Open Chrome DevTools → RapidTriage panel

### Cloud Deployment (Cloudflare Workers)
```bash
# Configure and deploy
./deploy.sh

# Your app will be available at:
# https://rapidtriage.me
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🛠️ Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/YarlisAISolutions/rapidtriage.git
cd rapidtriage

# Install dependencies
cd rapidtriage-mcp && npm install && cd ..
cd rapidtriage-server && npm install && cd ..

# Build packages
cd rapidtriage-mcp && npm run build && cd ..
cd rapidtriage-server && npm run build && cd ..
```

### Running Tests
```bash
npm test
```

### Publishing Packages
```bash
./publish-packages.sh
```

## 📄 License

MIT - See [LICENSE](./LICENSE) file

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/YarlisAISolutions/rapidtriage/blob/main/CONTRIBUTING.md) for details.

## 💬 Support & Community

- **Documentation**: [https://rapidtriage.me/docs](https://rapidtriage.me/docs)
- **GitHub Issues**: [Report bugs or request features](https://github.com/YarlisAISolutions/rapidtriage/issues)
- **Discord**: [Join our community](https://discord.gg/rapidtriage)
- **Twitter**: [@YarlisAI](https://twitter.com/yarlisai)

## 🙏 Credits

Built with ❤️ by **YarlisAISolutions**

Special thanks to:
- Anthropic for the Model Context Protocol
- The open-source community
- All our contributors and users

---

**YarlisAISolutions** - Empowering AI-driven browser automation and debugging