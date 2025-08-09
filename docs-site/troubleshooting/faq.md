# Frequently Asked Questions

## General Questions

### What is RapidTriageME?

RapidTriageME is an AI-powered browser debugging platform that captures browser data (console logs, network requests, errors, screenshots) and makes it available to AI assistants like Claude and ChatGPT through the Model Context Protocol (MCP). This enables intelligent debugging assistance and automated problem analysis.

### How does RapidTriageME work?

The system consists of three main components:

1. **Chrome Extension** - Captures browser data using DevTools API
2. **Browser Connector** - Local server that aggregates and serves data
3. **MCP Server** - Bridges browser data to AI assistants

Data flows from web pages → extension → connector → MCP → AI assistant, enabling real-time debugging analysis.

### Is RapidTriageME free to use?

Yes, RapidTriageME is open source software released under the MIT License. You can use, modify, and distribute it freely. The core functionality is completely free.

### What browsers are supported?

Currently supported:
- ✅ **Chrome** (primary support)
- ✅ **Chromium-based browsers** (Edge, Brave, etc.)
- ⚠️ **Firefox** (experimental support)
- ❌ **Safari** (not supported due to extension API limitations)

### What AI assistants work with RapidTriageME?

Any AI assistant that supports the Model Context Protocol (MCP):
- ✅ **Claude Desktop** (native support)
- ✅ **Claude API** (via MCP client)
- ✅ **Custom MCP clients**
- 🔄 **ChatGPT** (via MCP integration - coming soon)

## Installation & Setup

### How do I install RapidTriageME?

Choose your preferred installation method:

=== "Quick Install (Recommended)"
    ```bash
    # Install browser connector
    npm install -g @yarlisai/rapidtriage-server
    
    # Install MCP server  
    npm install -g @yarlisai/rapidtriage-mcp
    
    # Start the system
    rapidtriage-server
    ```

=== "From Source"
    ```bash
    # Clone repository
    git clone https://github.com/yarlisai/rapidtriage.git
    cd rapidtriage
    
    # Run setup script
    ./run.sh all
    ```

=== "Docker"
    ```bash
    # Pull and run container
    docker run -p 1421:1421 yarlisai/rapidtriage:latest
    ```

### How do I load the Chrome extension?

1. Download the extension from releases or build from source
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension directory
5. Verify the extension appears in your extensions list

### How do I configure Claude Desktop?

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "rapidtriage-mcp",
      "args": ["--config", "/path/to/mcp-config.json"]
    }
  }
}
```

**Config file locations:**
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Usage & Features

### What types of browser data can be captured?

RapidTriageME captures comprehensive browser debugging information:

- **Console Logs**: `console.log()`, `console.warn()`, `console.error()`, etc.
- **JavaScript Errors**: Uncaught exceptions, syntax errors, runtime errors
- **Network Requests**: XHR, Fetch API, resource loading (with headers & responses)
- **Screenshots**: Full page or viewport screenshots on demand
- **DOM Elements**: Selected element details, attributes, styling
- **Performance Metrics**: Load times, resource timing, Lighthouse audits
- **Page Information**: URL, title, metadata, viewport dimensions

### How do I capture a screenshot?

Multiple ways to capture screenshots:

1. **Through AI Assistant**: "Take a screenshot of the current page"
2. **DevTools Panel**: Click "Capture Screenshot" button
3. **API Call**: `POST http://localhost:1421/capture-screenshot`
4. **Command Line**: `curl -X POST http://localhost:1421/capture-screenshot`

### Can I access browser data remotely?

Yes! RapidTriageME supports remote access through Cloudflare Workers:

1. Deploy the Cloudflare Worker component
2. Configure custom domain (e.g., `rapidtriage.me`)
3. Generate JWT authentication tokens
4. Access browser data from anywhere securely

### How do I clear captured data?

Several methods to clear data:

1. **Through AI**: "Clear all logs and data"
2. **DevTools Panel**: Click "Wipe Logs" button  
3. **API Call**: `POST http://localhost:1421/wipelogs`
4. **Restart Server**: Data clears on server restart

### What's the difference between local and remote access?

| Feature | Local Access | Remote Access |
|---------|--------------|---------------|
| **Performance** | Fastest (localhost) | Slower (network latency) |
| **Security** | Most secure | Requires authentication |
| **Accessibility** | Same machine only | Available anywhere |
| **Setup** | Simple | Requires Cloudflare setup |
| **Cost** | Free | May incur Cloudflare costs |

## Troubleshooting

### The extension shows "Failed to connect"

Common solutions:

1. **Check server status**:
   ```bash
   curl http://localhost:1421/.identity
   ```

2. **Verify server is running**:
   ```bash
   ps aux | grep rapidtriage-server
   ```

3. **Check port availability**:
   ```bash
   lsof -i :1421
   ```

4. **Restart server**:
   ```bash
   pkill -f rapidtriage-server
   rapidtriage-server
   ```

### Console logs aren't appearing

Check these common issues:

1. **DevTools must be open** - Extension only captures when DevTools is active
2. **Refresh the page** - After loading extension, refresh target page
3. **Check debugger attachment**:
   ```javascript
   // In extension console
   chrome.debugger.getTargets(console.log);
   ```

### Screenshots fail to capture

Verify these conditions:

1. **Valid tab** - Must be `http://` or `https://` page (not `chrome://`)
2. **Active tab** - Tab must be currently active/visible
3. **Permissions** - Extension needs `activeTab` permission
4. **Downloads folder** - Must be writable for file saving

### MCP server not connecting to Claude

1. **Check config file path** - Must be absolute path
2. **Validate JSON syntax**:
   ```bash
   cat claude_desktop_config.json | jq .
   ```
3. **Restart Claude Desktop** - Close completely and reopen
4. **Check server logs**:
   ```bash
   rapidtriage-mcp --log-level debug
   ```

### High memory usage

Implement data limits to reduce memory consumption:

1. **Limit log entries**:
   ```javascript
   // In extension settings
   maxLogEntries: 1000,  // Default: 50
   maxNetworkEntries: 500  // Default: 50
   ```

2. **Enable auto-cleanup**:
   ```javascript
   // Clear data older than 5 minutes
   autoCleanupInterval: 300000
   ```

3. **Restart extension periodically** - Reload extension to clear memory

## Performance & Optimization

### How can I improve performance?

1. **Reduce data retention limits**:
   ```json
   {
     "maxLogEntries": 100,
     "maxNetworkEntries": 50,
     "stringLengthLimit": 1000
   }
   ```

2. **Enable request filtering**:
   ```javascript
   // Filter out noise (images, fonts, etc.)
   filterResourceTypes: ['image', 'font', 'stylesheet']
   ```

3. **Use caching**:
   ```bash
   # Enable response caching
   rapidtriage-server --enable-cache --cache-ttl=30
   ```

### What are the system requirements?

**Minimum Requirements:**
- **OS**: Windows 10, macOS 10.15, Ubuntu 18.04+
- **RAM**: 2GB available memory
- **Browser**: Chrome 88+, Edge 88+
- **Node.js**: v16+ (for local installation)

**Recommended:**
- **RAM**: 4GB+ available memory
- **Storage**: 1GB free space for logs/screenshots
- **Network**: Stable internet for remote features

### How much bandwidth does it use?

Bandwidth usage depends on data volume:

- **Local usage**: Minimal (localhost only)
- **Remote access**: 1-10MB per debugging session
- **Screenshots**: 100KB-2MB per image
- **Heavy debugging**: Up to 50MB/hour with full capture

## Security & Privacy

### Is my browser data secure?

Yes, RapidTriageME prioritizes security:

1. **Local by default** - Data stays on your machine
2. **No external tracking** - No analytics or telemetry
3. **Encrypted remote access** - HTTPS/WSS for remote connections
4. **JWT authentication** - Secure token-based access
5. **Data sanitization** - Automatic removal of sensitive patterns

### What data is collected?

RapidTriageME only collects debugging data you explicitly capture:

- **Console output** from web pages you debug
- **Network requests** from those pages
- **JavaScript errors** occurring on those pages
- **Screenshots** when you request them
- **Page metadata** (URL, title, etc.)

**Not collected:**
- Personal browsing history
- Data from other tabs/windows
- System information beyond browser context
- Credentials or sensitive form data

### Can I use RapidTriageME in production?

**Local development**: ✅ Yes, safe and recommended
**Production monitoring**: ⚠️ Use with caution
- Only capture non-sensitive applications
- Avoid pages with user data/credentials  
- Consider privacy implications
- Use data filtering and sanitization

### How do I redact sensitive data?

Configure automatic data sanitization:

```json
{
  "dataSanitization": {
    "enabled": true,
    "redactPatterns": [
      "password",
      "token",
      "api_key",
      "secret"
    ],
    "redactRegex": [
      "\\b\\d{4}-\\d{4}-\\d{4}-\\d{4}\\b",  // Credit cards
      "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"  // Emails
    ]
  }
}
```

## Development & Customization

### Can I customize RapidTriageME?

Yes! RapidTriageME is highly customizable:

1. **Configuration files** - Modify behavior through JSON config
2. **Custom filters** - Add filtering rules for data capture
3. **API extensions** - Add custom endpoints to browser connector
4. **MCP tools** - Create custom tools for AI integration
5. **Source code** - Full source available for modification

### How do I add custom data capture?

Extend the Chrome extension:

```javascript
// In content script
function captureCustomData() {
  const customData = {
    type: 'custom-event',
    data: {
      // Your custom data
    },
    timestamp: Date.now()
  };
  
  // Send to background script
  chrome.runtime.sendMessage(customData);
}
```

### Can I integrate with other AI services?

Yes, through the MCP protocol or custom integrations:

1. **MCP Integration**: Any MCP-compatible AI service
2. **Custom API**: Build adapters for specific AI APIs
3. **Webhook Integration**: Send data to external services
4. **SDK Development**: Create libraries for your preferred language

### How do I contribute to development?

We welcome contributions! Here's how to get started:

1. **Fork the repository** on GitHub
2. **Set up development environment**:
   ```bash
   git clone your-fork.git
   cd rapidtriage
   npm install
   npm run dev
   ```
3. **Make your changes** and test thoroughly
4. **Submit a pull request** with clear description
5. **Follow coding standards** and include tests

See our [Contributing Guide](../contributing.md) for detailed guidelines.

## Advanced Usage

### How do I set up load balancing?

For high-traffic scenarios, use multiple browser connector instances:

```bash
# Start multiple instances on different ports
rapidtriage-server --port 1421 &
rapidtriage-server --port 1422 &
rapidtriage-server --port 1423 &

# Configure load balancer (nginx example)
upstream rapidtriage {
    server localhost:1421;
    server localhost:1422;
    server localhost:1423;
}
```

### Can I use RapidTriageME in Docker?

Yes! Docker support is available:

```bash
# Pull official image
docker pull yarlisai/rapidtriage:latest

# Run with port mapping
docker run -p 1421:1421 -p 1422:1422 yarlisai/rapidtriage:latest

# Or build from source
docker build -t rapidtriage .
docker run -p 1421:1421 rapidtriage
```

### How do I monitor multiple browser instances?

Configure unique session IDs for each browser:

```javascript
// Extension configuration
const sessionConfig = {
  sessionId: `browser-${Math.random().toString(36).substr(2, 9)}`,
  browserInstance: window.navigator.userAgent
};
```

### Can I export debugging data?

Yes, multiple export options available:

```bash
# Export as JSON
curl http://localhost:1421/export/json > debug-session.json

# Export as CSV
curl http://localhost:1421/export/csv > debug-session.csv

# Export logs only
curl http://localhost:1421/console-logs > console-logs.json
```

## Deployment & Production

### How do I deploy to production?

Follow our deployment guides:

1. **[Local Production](../deployment/production.md)** - Self-hosted setup
2. **[Cloudflare Deployment](../deployment/cloudflare.md)** - Global edge deployment
3. **[Docker Installation](../getting-started/installation.md#method-3-docker-installation)** - Containerized deployment

### What's the recommended architecture?

**Small Team (1-5 developers):**
```
Browser Extension → Local Connector → MCP → Claude Desktop
```

**Medium Team (5-20 developers):**
```
Multiple Extensions → Shared Connector → MCP Server → Team AI Access
```

**Large Team/Enterprise:**
```
Extensions → Load Balanced Connectors → Cloudflare Worker → Global AI Access
```

### How do I monitor system health?

Use built-in health monitoring:

```bash
# Health check endpoints
curl http://localhost:1421/health
curl http://localhost:1422/health

# System metrics
curl http://localhost:1421/metrics

# Performance monitoring
curl http://localhost:1421/stats
```

Set up alerts for production use:

```bash
# Example monitoring script
#!/bin/bash
HEALTH=$(curl -s http://localhost:1421/health | jq -r '.status')
if [ "$HEALTH" != "healthy" ]; then
    echo "RapidTriage health check failed!" | mail -s "Alert" admin@company.com
fi
```

## Getting Help

### Where can I get support?

Multiple support channels available:

- **📖 Documentation**: [rapidtriage.me/docs](https://rapidtriage.me/docs)
- **🐛 GitHub Issues**: Bug reports and feature requests
- **💬 Discord**: Real-time community support
- **📧 Email**: support@yarlisai.com for enterprise support
- **🌟 Stack Overflow**: Tag questions with `rapidtriage`

### How do I report a bug?

When reporting bugs, include:

1. **System information** (OS, browser, versions)
2. **Steps to reproduce** the issue
3. **Expected vs actual behavior**
4. **Error messages** and console logs
5. **Screenshots** if relevant
6. **Configuration files** (redact sensitive data)

Use our bug report template on GitHub for best results.

### Is commercial support available?

Yes! Enterprise support options:

- **🏢 Enterprise License**: Priority support and SLA
- **🛠 Custom Development**: Feature development and integration
- **📋 Training**: Team training and best practices
- **☁️ Managed Hosting**: Fully managed cloud deployment

Contact enterprise@yarlisai.com for details.

### How can I stay updated?

Stay informed about updates:

- **⭐ Star the GitHub repo** for release notifications
- **📧 Join mailing list** for major announcements
- **🐦 Follow @YarlisAI** on Twitter for updates
- **📱 Join Discord** for real-time updates and discussions

---

## Still have questions?

If you didn't find your question here:

1. **Search the docs** - Use the search function above
2. **Check GitHub Issues** - Your question might already be answered
3. **Ask the community** - Join our Discord or Stack Overflow
4. **Contact support** - For urgent issues or enterprise questions

**Quick Links:**
- [Getting Started Guide](../getting-started/index.md)
- [Installation Instructions](../getting-started/installation.md)
- [Troubleshooting Guide](common-issues.md)
- [API Documentation](../api/index.md)