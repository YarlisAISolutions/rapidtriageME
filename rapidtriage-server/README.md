# 🌐 RapidTriage Server

> **High-performance browser debugging server with Lighthouse integration**

[![npm version](https://img.shields.io/npm/v/@yarlis/rapidtriage-server.svg)](https://www.npmjs.com/package/@yarlis/rapidtriage-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@yarlis/rapidtriage-server.svg)](https://nodejs.org)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Chrome Extension](#-chrome-extension)
- [Architecture](#-architecture)
- [Performance](#-performance)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## 🎯 Overview

RapidTriage Server is a powerful Node.js middleware that bridges Chrome extensions with AI-powered debugging tools. It provides real-time browser data collection, screenshot capture, and comprehensive auditing capabilities through Lighthouse integration.

### How It Works

```
┌─────────────────┐     WebSocket     ┌──────────────────┐     HTTP/WS     ┌─────────────┐
│ Chrome Extension│ ◄────────────────► │ RapidTriage      │ ◄────────────► │ MCP Server  │
│   (DevTools)    │                    │    Server        │                │ (AI Tools)  │
└─────────────────┘                    └──────────────────┘                └─────────────┘
        ↓                                       ↓                                  ↓
   Collect Data                            Process & Store                    AI Analysis
```

## ✨ Features

### Core Capabilities
- 🔄 **Real-time Data Streaming** - WebSocket-based communication
- 📸 **Screenshot Capture** - Full-page and viewport screenshots
- 📊 **Console Logging** - Capture all browser console output
- 🌐 **Network Monitoring** - Track all HTTP requests and responses
- 🎯 **DOM Inspection** - Element selection and analysis

### Lighthouse Integration
- ⚡ **Performance Audits** - Core Web Vitals, speed metrics
- ♿ **Accessibility Testing** - WCAG 2.1 compliance checks
- 🔍 **SEO Analysis** - Meta tags, structured data validation
- ✅ **Best Practices** - Security headers, HTTPS, modern standards
- 📱 **PWA Audits** - Progressive Web App compliance

### Advanced Features
- 🔒 **Token Authentication** - Secure client connections
- 📈 **Rate Limiting** - Prevent abuse and overload
- 🔄 **Auto-reconnection** - Resilient connection handling
- 📝 **Request Logging** - Comprehensive debugging logs
- 🚀 **High Performance** - Optimized for low latency

## 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Chrome/Chromium** browser (for Lighthouse audits)
- **RapidTriage Chrome Extension** installed

## 🚀 Quick Start

```bash
# Start the server with npx (no installation needed)
npx @yarlis/rapidtriage-server@latest

# Server will start on port 1421
# 🚀 RapidTriage Server running on http://localhost:1421
```

### Verify Installation

```bash
# Check server health
curl http://localhost:1421/health

# Response:
# {"status":"ok","version":"1.0.0","uptime":123}
```

## 📦 Installation

### Using npx (Recommended)

```bash
# Run without installation
npx @yarlis/rapidtriage-server@latest

# Run with custom port
PORT=3000 npx @yarlis/rapidtriage-server@latest
```

### Global Installation

```bash
# Install globally
npm install -g @yarlis/rapidtriage-server

# Run from anywhere
rapidtriage-server
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME/rapidtriage-server

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Docker Installation

```dockerfile
FROM node:18-alpine
RUN npm install -g @yarlis/rapidtriage-server
EXPOSE 1421
CMD ["rapidtriage-server"]
```

```bash
# Build and run
docker build -t rapidtriage-server .
docker run -p 1421:1421 rapidtriage-server
```

## ⚙️ Configuration

### Environment Variables

```bash
# Server Configuration
PORT=1421                         # Server port (default: 1421)
HOST=0.0.0.0                      # Server host (default: localhost)
NODE_ENV=production               # Environment (development/production)

# Security
AUTH_TOKEN=your-secret-token     # Authentication token for clients
CORS_ORIGIN=http://localhost:3000 # Allowed CORS origins

# Performance
MAX_PAYLOAD_SIZE=50mb            # Maximum request payload size
TIMEOUT=30000                     # Request timeout in milliseconds
RATE_LIMIT=100                   # Requests per minute per IP

# Lighthouse Configuration
CHROME_PATH=/path/to/chrome      # Custom Chrome executable path
LIGHTHOUSE_PORT=9222              # Chrome debugging port

# Logging
LOG_LEVEL=info                    # Log level (error/warn/info/debug)
LOG_FILE=/var/log/rapidtriage.log # Log file path
```

### Configuration File

Create a `.rapidtriagerc` file:

```json
{
  "server": {
    "port": 1421,
    "host": "localhost",
    "cors": {
      "origin": "*",
      "credentials": true
    }
  },
  "security": {
    "authToken": "your-secret-token",
    "rateLimit": {
      "windowMs": 60000,
      "max": 100
    }
  },
  "lighthouse": {
    "chromePath": null,
    "port": 9222,
    "logLevel": "error"
  },
  "logging": {
    "level": "info",
    "file": "./logs/server.log"
  }
}
```

## 🔌 API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "connections": 2
}
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:1421');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-auth-token'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

### REST API

#### Get Console Logs

```http
GET /api/console
Authorization: Bearer your-token
```

#### Get Network Logs

```http
GET /api/network
Authorization: Bearer your-token
```

#### Capture Screenshot

```http
POST /api/screenshot
Authorization: Bearer your-token
Content-Type: application/json

{
  "fullPage": true,
  "quality": 90
}
```

#### Run Lighthouse Audit

```http
POST /api/audit
Authorization: Bearer your-token
Content-Type: application/json

{
  "url": "https://example.com",
  "categories": ["performance", "accessibility", "seo"]
}
```

## 🧩 Chrome Extension

The RapidTriage Chrome Extension is required for browser data collection.

### Installation

1. Download the extension:
   ```bash
   wget https://github.com/YarlisAISolutions/rapidtriage-extension/releases/latest/download/rapidtriage-extension.zip
   ```

2. Extract and load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extracted folder

3. Open Chrome DevTools (F12)
4. Navigate to the "RapidTriage" panel
5. The extension will auto-connect to the server

### Extension Features

- **Auto-connect** - Automatically connects to local server
- **Data Collection** - Captures console, network, and DOM data
- **Screenshot Tool** - Built-in screenshot capture
- **Element Inspector** - Select and inspect DOM elements
- **Export Data** - Export collected data as JSON/HAR

## 🏗️ Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│                 RapidTriage Server              │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Express │  │ WebSocket│  │Lighthouse│     │
│  │   Server │  │  Server  │  │  Runner  │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   CORS   │  │   Auth   │  │   Rate   │     │
│  │Middleware│  │Middleware│  │  Limiter │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
```

### Data Flow

1. **Chrome Extension** collects browser data
2. **WebSocket** transmits data to server
3. **Server** processes and stores data
4. **MCP Server** queries data via HTTP API
5. **AI Assistant** analyzes and provides insights

## ⚡ Performance

### Benchmarks

| Metric | Value | Notes |
|--------|-------|-------|
| **Startup Time** | < 2s | Cold start |
| **Memory Usage** | ~50MB | Idle state |
| **Request Latency** | < 10ms | Local network |
| **WebSocket Throughput** | 10K msg/s | Per connection |
| **Concurrent Connections** | 1000+ | With 4GB RAM |

### Optimization Tips

1. **Use connection pooling** for database connections
2. **Enable gzip compression** for large payloads
3. **Implement caching** for frequently accessed data
4. **Use PM2** for production deployment
5. **Configure nginx** as reverse proxy

## 🔒 Security

### Best Practices

- ✅ **Token Authentication** - Always use auth tokens in production
- ✅ **HTTPS Only** - Use TLS certificates for production
- ✅ **Rate Limiting** - Prevent abuse and DDoS attacks
- ✅ **CORS Configuration** - Restrict origins in production
- ✅ **Input Validation** - Sanitize all user inputs
- ✅ **Security Headers** - Implement CSP, HSTS, etc.

### Production Setup

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.rapidtriage.me;

    ssl_certificate /etc/ssl/certs/rapidtriage.crt;
    ssl_certificate_key /etc/ssl/private/rapidtriage.key;

    location / {
        proxy_pass http://localhost:1421;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 1421
lsof -i :1421

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3000 npx @yarlis/rapidtriage-server@latest
```

#### Chrome Not Found

```bash
# Install Chrome
# macOS
brew install --cask google-chrome

# Ubuntu/Debian
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
apt-get update
apt-get install google-chrome-stable

# Set Chrome path
export CHROME_PATH="/usr/bin/google-chrome"
```

#### WebSocket Connection Failed

1. Check firewall settings
2. Verify CORS configuration
3. Ensure server is running
4. Check browser console for errors

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npx @yarlis/rapidtriage-server@latest

# Or set log level
LOG_LEVEL=debug npx @yarlis/rapidtriage-server@latest
```

### Logs Location

- **macOS/Linux**: `~/.rapidtriage/logs/`
- **Windows**: `%APPDATA%\rapidtriage\logs\`
- **Docker**: `/var/log/rapidtriage/`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/YarlisAISolutions/rapidtriageME/blob/main/CONTRIBUTING.md).

### Development Workflow

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/rapidtriageME.git
cd rapidtriageME/rapidtriage-server

# Create a feature branch
git checkout -b feature/amazing-feature

# Install dependencies
npm install

# Make your changes
# ...

# Run tests
npm test

# Build
npm run build

# Submit a pull request
```

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation

## 💬 Support

- 📧 **Email**: support@rapidtriage.me
- 💬 **Discord**: [Join our community](https://discord.gg/rapidtriage)
- 🐛 **Issues**: [GitHub Issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- 📖 **Docs**: [rapidtriage.me/docs](https://rapidtriage.me/docs)
- 🎥 **YouTube**: [Video Tutorials](https://youtube.com/@rapidtriage)

## 📄 License

MIT © [YarlisAISolutions](https://github.com/YarlisAISolutions)

---

**Built with ❤️ by YarlisAISolutions** | [Website](https://rapidtriage.me) | [GitHub](https://github.com/YarlisAISolutions/rapidtriageME)