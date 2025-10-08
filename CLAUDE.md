# RapidTriageME Project Instructions
> Project-specific guidelines and context for AI-assisted development

## 🎯 Project Overview

**RapidTriageME** is YarlisAISolutions' comprehensive browser debugging and monitoring platform that provides real-time browser triage capabilities through multiple integrated components.

### Core Components
1. **Chrome Extension** (`/rapidtriage-extension`) - DevTools integration for browser monitoring
2. **MCP Server** (`/rapidtriage-mcp`) - Model Context Protocol server for IDE integration
3. **Browser Connector** (`/rapidtriage-server`) - Local Node.js middleware server
4. **Cloudflare Worker** (`/src`) - Production edge deployment
5. **Mobile App** (`/RapidTriageMobile`) - React Native mobile application

### Technology Stack
- **Runtime**: Cloudflare Workers, Node.js 18+
- **Languages**: TypeScript 5.3+
- **Protocols**: Model Context Protocol (MCP), Server-Sent Events (SSE)
- **Cloud**: Cloudflare (Workers, KV, R2), Google Cloud Run
- **Mobile**: React Native, Expo
- **Testing**: Jest, Puppeteer, Playwright
- **Build**: Wrangler, TypeScript Compiler

## 🔧 Development Environment

### Required Tools
```bash
# Global dependencies
node >= 18.0.0
npm >= 9.0.0
wrangler >= 4.28.1
typescript >= 5.3.3
```

### Environment Configuration
The project uses multiple environment files:
- `.env` - Production configuration (DO NOT commit sensitive data)
- `wrangler.toml` - Cloudflare Workers configuration
- `wrangler-rapidtriage.toml` - Alternative deployment configuration

### Key Environment Variables
```bash
ENVIRONMENT=production|staging|development
API_BASE_URL=https://rapidtriage.me
BROWSER_TOOLS_PORT=3025
CLOUDFLARE_ACCOUNT_ID=ed3fbe9532564f2f06ae772da689431a
ZONE_ID=dba0cbc72f7f0b7727fbdb6f4d6d7901
```

## 📁 Project Structure

### Directory Organization
```
/rapidtriageME
├── 📦 /rapidtriage-extension    # Chrome Extension (v3.0.0)
│   ├── manifest.json            # Extension manifest
│   ├── background.js            # Service worker
│   ├── content.js               # Content script
│   ├── devtools.js/html         # DevTools panel
│   ├── panel.js/html            # Custom panel UI
│   ├── popup.js/html            # Extension popup
│   └── options.js/html          # Settings page
│
├── 🔌 /rapidtriage-mcp          # MCP Server (@yarlis/rapidtriage-mcp)
│   ├── mcp-server.ts            # Main MCP server
│   └── src/stdio-transport.js   # Transport layer
│
├── 🖥️ /rapidtriage-server       # Browser Connector
│   ├── browser-connector.ts     # WebSocket server
│   ├── puppeteer-service.ts    # Browser automation
│   └── lighthouse/              # Audit modules
│
├── ☁️ /src                      # Cloudflare Worker
│   ├── worker.ts                # Main worker entry
│   ├── handlers/                # Request handlers
│   ├── middleware/              # Auth, rate limiting
│   └── services/                # Business logic
│
├── 📱 /RapidTriageMobile        # React Native App
│   ├── App.tsx                  # App entry point
│   ├── src/services/            # Service layer
│   └── src/ui/                  # UI components
│
├── 📚 /docs                     # Project documentation
├── 🧪 /test-suite              # Testing infrastructure
└── 🛠️ /scripts                 # Deployment scripts
```

## 🚀 Development Workflows

### Local Development
```bash
# Start local development server
npm run dev

# Start browser connector (separate terminal)
cd rapidtriage-server && npm start

# Test MCP server locally
cd rapidtriage-mcp && npm run inspect
```

### Testing Commands
```bash
# Run all tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Test production APIs
node test-production-api.js

# Test browser automation
node test-browser-automation.js
```

### Deployment Commands
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Deploy all components
./deploy-all.sh

# Deploy with scripts
cd scripts && ./04-deploy.sh
```

## 🔌 MCP Integration

### Available MCP Tools
The project provides these MCP tools for IDE integration:

1. **getConsoleLogs** - Retrieve browser console logs
2. **getConsoleErrors** - Get console errors only
3. **getNetworkLogs** - Get all network requests
4. **getNetworkErrors** - Get failed network requests
5. **takeScreenshot** - Capture browser screenshot
6. **getSelectedElement** - Get inspected DOM element
7. **wipeLogs** - Clear captured logs
8. **runAccessibilityAudit** - Run accessibility checks
9. **runPerformanceAudit** - Run performance analysis
10. **runSEOAudit** - Run SEO analysis
11. **runBestPracticesAudit** - Check best practices
12. **runDebuggerMode** - Start debug session
13. **runAuditMode** - Run comprehensive audits

### IDE Configuration
Configure your IDE's MCP settings:
```json
{
  "mcpServers": {
    "rapidtriage-local": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp"],
      "env": {
        "RAPIDTRIAGE_API_URL": "http://localhost:3025",
        "RAPIDTRIAGE_AUTH_TOKEN": "local-dev-token"
      }
    }
  }
}
```

## 🔐 Authentication & Security

### API Authentication
All API endpoints require Bearer token authentication:
```javascript
headers: {
  'Authorization': 'Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8'
}
```

### Security Measures
- Token-based authentication for all APIs
- Rate limiting (100 requests/minute)
- CORS configuration for cross-origin requests
- Secure WebSocket connections
- Environment-specific secrets management

## 📊 API Endpoints

### Production Endpoints
- **Base URL**: `https://rapidtriage.me`
- **API Docs**: `https://rapidtriage.me/api-docs`
- **Health Check**: `https://rapidtriage.me/health`
- **MCP Endpoint**: `https://rapidtriage.me/sse`

### Core API Routes
```
POST /api/screenshot       - Capture screenshots
POST /api/console-logs    - Get console logs
POST /api/network-logs    - Get network logs
POST /api/lighthouse      - Run Lighthouse audits
POST /api/execute-js      - Execute JavaScript
POST /api/inspect-element - Inspect DOM elements
POST /api/navigate        - Navigate browser
POST /api/triage-report   - Generate reports
```

## 🧪 Testing Strategy

### Test Suites
1. **Unit Tests** - Component-level testing with Jest
2. **Integration Tests** - API and service integration
3. **E2E Tests** - Full workflow testing with Puppeteer
4. **Browser Tests** - Extension and DevTools testing
5. **MCP Tests** - Protocol compliance testing

### Test Files
- `/test-suite/` - Main test infrastructure
- `/test/` - Additional test utilities
- `/examples/` - Test examples and demos

### Running Tests
```bash
# Run specific test suites
node test-suite/capture-test-screenshots.js
node test-lifecycle.js
node test-both-modes.js

# View test reports
node view-test-summary.js
open reports/standalone-report.html
```

## 📝 Code Standards

### TypeScript Conventions
- Use strict type checking
- Define interfaces for all data structures
- Implement proper error types
- Use async/await over callbacks
- Document complex logic with JSDoc

### File Naming
- Components: `PascalCase.tsx`
- Services: `kebab-case.service.ts`
- Handlers: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Error Handling Pattern
```typescript
try {
  // Operation
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  console.error('[Component] Operation failed:', error);
  return { 
    success: false, 
    error: error.message || 'Operation failed' 
  };
}
```

## 🚢 Production Deployment

### Pre-deployment Checklist
1. ✅ Run all tests (`npm test`)
2. ✅ Check TypeScript (`npm run typecheck`)
3. ✅ Verify environment variables
4. ✅ Test locally with production config
5. ✅ Update version numbers
6. ✅ Review security configurations

### Deployment Process
```bash
# 1. Build the project
npm run build

# 2. Deploy to Cloudflare
wrangler deploy --env production

# 3. Verify deployment
curl https://rapidtriage.me/health

# 4. Test core functionality
node test-production-api.js
```

### Domains & Infrastructure
- **Primary**: rapidtriage.me
- **WWW**: www.rapidtriage.me
- **Test**: test.rapidtriage.me
- **Docs**: yarlisaisolutions.github.io/rapidtriageME
- **Backend**: rapidtriage-backend-*.run.app

## 🔄 Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Message Format
```
<type>: <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

### PR Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run linting and type checking
4. Create PR with detailed description
5. Request code review
6. Merge after approval

## 🐛 Debugging Tips

### Chrome Extension Debugging
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Inspect views: background page"
4. Use DevTools for debugging

### MCP Server Debugging
```bash
# Use MCP Inspector
cd rapidtriage-mcp
npm run inspect

# Enable debug logging
export DEBUG=mcp:*
npm start
```

### Cloudflare Worker Debugging
```bash
# Tail production logs
wrangler tail

# Local development with logs
wrangler dev --local
```

## 📈 Performance Optimization

### Key Metrics
- Worker response time: < 50ms
- Backend API response: < 100ms
- Lighthouse scores: > 90/100
- Bundle size: < 500KB

### Optimization Strategies
1. Use Cloudflare KV for caching
2. Implement request batching
3. Optimize image delivery with R2
4. Minimize JavaScript bundles
5. Use WebSocket for real-time data

## 🔍 Monitoring & Logging

### Log Levels
- `ERROR` - Critical errors requiring immediate attention
- `WARN` - Warning conditions
- `INFO` - Informational messages
- `DEBUG` - Debug-level messages (dev only)

### Monitoring Tools
- Cloudflare Analytics
- Custom metrics endpoint (`/metrics`)
- Health checks (`/health`)
- Error tracking in production logs

## 🤝 Support & Resources

### Documentation
- **Project Docs**: `/docs` folder
- **API Docs**: https://rapidtriage.me/api-docs
- **GitHub Docs**: https://yarlisaisolutions.github.io/rapidtriageME

### NPM Packages
- [@yarlis/rapidtriage-mcp](https://www.npmjs.com/package/@yarlis/rapidtriage-mcp)
- [@yarlis/rapidtriage-server](https://www.npmjs.com/package/@yarlis/rapidtriage-server)

### Contact
- **GitHub Issues**: [Report issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- **Author**: YarlisAISolutions

## ⚠️ Important Notes

### Security Reminders
- Never commit API keys or tokens
- Use environment variables for secrets
- Rotate tokens regularly
- Implement proper CORS policies
- Validate all user inputs

### Known Issues
- Chrome 138+ DevTools panel initialization requires delay
- Screenshot uploads require R2 bucket configuration
- MCP server requires Node.js stdio transport
- Extension requires explicit host permissions

### Future Improvements
- [ ] Implement WebRTC for real-time streaming
- [ ] Add support for Firefox extension
- [ ] Enhance mobile app features
- [ ] Implement advanced filtering for logs
- [ ] Add team collaboration features

---

**Project Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready

*This document provides comprehensive project context for AI-assisted development. Always prioritize security, performance, and code quality in all implementations.*