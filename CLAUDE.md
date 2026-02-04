# RapidTriageME Project Instructions
> Project-specific guidelines and context for AI-assisted development

## Project Overview

**RapidTriageME** is YarlisAISolutions' comprehensive browser debugging and monitoring platform that provides real-time browser triage capabilities through multiple integrated components.

### Core Components
1. **Chrome Extension** (`/rapidtriage-extension`) - DevTools integration for browser monitoring
2. **MCP Server** (`/rapidtriage-mcp`) - Model Context Protocol server for IDE integration
3. **Browser Connector** (`/rapidtriage-server`) - Local Node.js middleware server
4. **Firebase Functions** (`/functions`) - Production serverless backend
5. **Mobile App** (`/RapidTriageMobile`) - React Native mobile application

### Technology Stack
- **Runtime**: Firebase Functions (Node.js 20), Node.js 18+
- **Languages**: TypeScript 5.3+
- **Protocols**: Model Context Protocol (MCP), Server-Sent Events (SSE)
- **Cloud**: Firebase (Functions, Firestore, Storage, Hosting, Authentication)
- **Mobile**: React Native, Expo
- **Testing**: Jest, Puppeteer, Playwright
- **Build**: Firebase CLI, TypeScript Compiler

## Development Environment

### Required Tools
```bash
# Global dependencies
node >= 18.0.0
npm >= 9.0.0
firebase-tools >= 13.0.0
typescript >= 5.3.3
java >= 21  # Required for Firebase emulators

# Install Java 21 on macOS
brew install openjdk@21
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
```

### Environment Configuration
The project uses multiple configuration files:
- `.env` - Production configuration (DO NOT commit sensitive data)
- `firebase.json` - Firebase project configuration
- `.firebaserc` - Firebase project aliases
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `firestore.indexes.json` - Firestore index definitions

### Key Environment Variables
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=rapidtriage-me
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=rapidtriage-me.firebaseapp.com
FIREBASE_STORAGE_BUCKET=rapidtriage-me.firebasestorage.app
FIREBASE_APP_ID=1:568288241317:web:28829514f6badd3719cf4c

# Application Configuration
ENVIRONMENT=production|staging|development
API_BASE_URL=https://rapidtriage-me.web.app
BROWSER_TOOLS_PORT=3025

# Emulator Ports
FIRESTORE_EMULATOR_PORT=8080
AUTH_EMULATOR_PORT=9099
STORAGE_EMULATOR_PORT=9199
FUNCTIONS_EMULATOR_PORT=5001
HOSTING_EMULATOR_PORT=5050
UI_EMULATOR_PORT=4000
```

## Project Structure

### Directory Organization
```
/rapidtriageME
├── /rapidtriage-extension       # Chrome Extension (v3.0.0)
│   ├── manifest.json            # Extension manifest
│   ├── background.js            # Service worker
│   ├── content.js               # Content script
│   ├── devtools.js/html         # DevTools panel
│   ├── panel.js/html            # Custom panel UI
│   ├── popup.js/html            # Extension popup
│   └── options.js/html          # Settings page
│
├── /rapidtriage-mcp             # MCP Server (@yarlis/rapidtriage-mcp)
│   ├── mcp-server.ts            # Main MCP server
│   └── src/stdio-transport.js   # Transport layer
│
├── /rapidtriage-server          # Browser Connector
│   ├── browser-connector.ts     # WebSocket server
│   ├── puppeteer-service.ts     # Browser automation
│   └── lighthouse/              # Audit modules
│
├── /functions                   # Firebase Functions
│   ├── src/
│   │   ├── index.ts             # Main entry point
│   │   ├── http/                # HTTP triggers
│   │   │   ├── api/             # API endpoints
│   │   │   ├── auth/            # Authentication
│   │   │   ├── docs/            # API documentation
│   │   │   ├── mcp/             # MCP/SSE endpoints
│   │   │   ├── health.ts        # Health check
│   │   │   ├── status.ts        # Status endpoint
│   │   │   └── metrics.ts       # Metrics endpoint
│   │   ├── callable/            # Callable functions
│   │   ├── scheduled/           # Scheduled tasks
│   │   ├── background/          # Background triggers
│   │   ├── middleware/          # Auth, rate limiting
│   │   ├── services/            # Business logic
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utilities
│   │   └── config/              # Configuration
│   ├── package.json             # Functions dependencies
│   └── tsconfig.json            # TypeScript config
│
├── /RapidTriageMobile           # React Native App
│   ├── App.tsx                  # App entry point
│   ├── src/services/            # Service layer
│   └── src/ui/                  # UI components
│
├── /docs                        # Project documentation
├── /test-suite                  # Testing infrastructure
├── /scripts                     # Deployment scripts
├── /.cloudflare-backup          # Legacy Cloudflare config backup
│
├── firebase.json                # Firebase configuration
├── .firebaserc                  # Firebase project aliases
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore indexes
└── storage.rules                # Storage security rules
```

## Development Workflows

### Local Development
```bash
# Start Firebase emulators (all services)
firebase emulators:start

# Start emulators with specific services
firebase emulators:start --only functions,firestore,hosting

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

# Build functions
cd functions && npm run build

# Watch functions for changes
cd functions && npm run build:watch
```

### Deployment Commands

**One-Click Deploy (Recommended)**
Use the `/deploy` skill for streamlined deployment:
```bash
/deploy                      # Deploy all to production (default)
/deploy production           # Deploy all to production
/deploy production functions # Deploy only functions
/deploy production hosting   # Deploy only hosting
/deploy production rules     # Deploy all security rules
```

**Manual Firebase Commands**
```bash
# Deploy all Firebase services
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules

# Deploy specific function
firebase deploy --only functions:api

# View function logs
firebase functions:log

# View logs with filter
firebase functions:log --only api
```

**Using Deployment Script**
```bash
./scripts/deploy-firebase.sh all       # Deploy everything
./scripts/deploy-firebase.sh functions # Deploy only functions
./scripts/deploy-firebase.sh hosting   # Deploy only hosting
./scripts/deploy-firebase.sh rules     # Deploy security rules
```

## MCP Integration

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

## Authentication and Security

### API Authentication
All API endpoints require Bearer token authentication:
```javascript
headers: {
  'Authorization': 'Bearer your_auth_token'
}
```

### Security Measures
- Firebase Authentication for user management
- Token-based authentication for all APIs
- Firestore security rules for data access control
- Storage security rules for file access control
- Rate limiting (100 requests/minute)
- CORS configuration for cross-origin requests
- Environment-specific secrets management via Firebase

### Setting Secrets
```bash
# Set secrets for Firebase Functions
firebase functions:secrets:set AUTH_TOKEN
firebase functions:secrets:set JWT_SECRET
firebase functions:secrets:set RAPIDTRIAGE_API_TOKEN

# List secrets
firebase functions:secrets:list
```

## API Endpoints

### Production Endpoints
- **Base URL**: `https://rapidtriage-me.web.app`
- **API Docs**: `https://rapidtriage-me.web.app/api-docs`
- **Health Check**: `https://rapidtriage-me.web.app/health`
- **MCP Endpoint**: `https://rapidtriage-me.web.app/sse`

### Core API Routes
```
POST /api/screenshot       - Capture screenshots
POST /api/console-logs     - Get console logs
POST /api/network-logs     - Get network logs
POST /api/lighthouse       - Run Lighthouse audits
POST /api/execute-js       - Execute JavaScript
POST /api/inspect-element  - Inspect DOM elements
POST /api/navigate         - Navigate browser
POST /api/triage-report    - Generate reports
```

### Firebase-Specific Endpoints
```
GET  /health               - Health check
GET  /metrics              - Application metrics
GET  /status/*             - Service status
GET  /api-docs             - Swagger documentation
GET  /openapi.json         - OpenAPI specification
POST /auth/*               - Authentication endpoints
```

## Testing Strategy

### Test Suites
1. **Unit Tests** - Component-level testing with Jest
2. **Integration Tests** - API and service integration
3. **E2E Tests** - Full workflow testing with Puppeteer
4. **Browser Tests** - Extension and DevTools testing
5. **MCP Tests** - Protocol compliance testing
6. **Emulator Tests** - Firebase emulator-based testing

### Test Files
- `/test-suite/` - Main test infrastructure
- `/test/` - Additional test utilities
- `/examples/` - Test examples and demos
- `/functions/src/**/*.test.ts` - Functions unit tests

### Running Tests
```bash
# Run specific test suites
node test-suite/capture-test-screenshots.js
node test-lifecycle.js
node test-both-modes.js

# Run functions tests with emulators
cd functions && npm run test

# View test reports
node view-test-summary.js
open reports/standalone-report.html
```

## Code Standards

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

## Production Deployment

### Pre-deployment Checklist
1. Run all tests (`npm test`)
2. Check TypeScript (`npm run typecheck`)
3. Verify environment variables
4. Test locally with Firebase emulators
5. Update version numbers
6. Review security rules

### Deployment Process
```bash
# 1. Build the functions
cd functions && npm run build

# 2. Run pre-deploy checks
npm run lint
npm run typecheck

# 3. Deploy to Firebase
firebase deploy

# 4. Verify deployment
curl https://rapidtriage-me.web.app/health

# 5. Check function logs
firebase functions:log

# 6. Test core functionality
node test-production-api.js
```

### Firebase Project Details
- **Project ID**: rapidtriage-me
- **Hosting URL**: https://rapidtriage-me.web.app
- **Storage Bucket**: rapidtriage-me.firebasestorage.app
- **Region**: us-central1 (default)

### Domains and Infrastructure
- **Primary**: rapidtriage-me.web.app
- **Custom Domain**: rapidtriage.me (if configured)
- **Docs**: yarlisaisolutions.github.io/rapidtriageME
- **Legacy Backup**: .cloudflare-backup/

## Git Workflow

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

## Debugging Tips

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

### Firebase Functions Debugging
```bash
# View real-time logs
firebase functions:log --only api

# Debug with emulators (recommended)
firebase emulators:start

# Access Emulator UI
open http://localhost:4000

# Debug specific function
firebase functions:log --only health

# Export emulator data for debugging
firebase emulators:export ./emulator-data
```

### Firestore Debugging
```bash
# Use Firestore emulator
firebase emulators:start --only firestore

# Access Firestore UI in Emulator Suite
open http://localhost:4000/firestore
```

## Performance Optimization

### Key Metrics
- Function cold start: < 500ms
- Function execution: < 100ms
- Lighthouse scores: > 90/100
- Bundle size: < 500KB

### Optimization Strategies
1. Use Firestore for caching and session storage
2. Implement request batching
3. Optimize image delivery with Firebase Storage
4. Minimize JavaScript bundles
5. Use Firebase Hosting CDN for static assets
6. Configure function memory and timeout appropriately

## Monitoring and Logging

### Log Levels
- `ERROR` - Critical errors requiring immediate attention
- `WARN` - Warning conditions
- `INFO` - Informational messages
- `DEBUG` - Debug-level messages (dev only)

### Monitoring Tools
- Firebase Console (functions, hosting, firestore)
- Cloud Logging (detailed function logs)
- Firebase Emulator UI (local development)
- Custom metrics endpoint (`/metrics`)
- Health checks (`/health`)

### Accessing Logs
```bash
# Firebase CLI
firebase functions:log

# Google Cloud Console
open https://console.cloud.google.com/logs

# Filter by severity
firebase functions:log --only api --severity ERROR
```

## Support and Resources

### Documentation
- **Project Docs**: `/docs` folder
- **API Docs**: https://rapidtriage-me.web.app/api-docs
- **GitHub Docs**: https://yarlisaisolutions.github.io/rapidtriageME
- **Firebase Docs**: https://firebase.google.com/docs

### NPM Packages
- [@yarlis/rapidtriage-mcp](https://www.npmjs.com/package/@yarlis/rapidtriage-mcp)
- [@yarlis/rapidtriage-server](https://www.npmjs.com/package/@yarlis/rapidtriage-server)

### Contact
- **GitHub Issues**: [Report issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- **Author**: YarlisAISolutions

## Important Notes

### Security Reminders
- Never commit API keys or tokens
- Use Firebase secrets for sensitive values
- Rotate tokens regularly
- Review Firestore and Storage security rules
- Validate all user inputs

### Known Issues
- Chrome 138+ DevTools panel initialization requires delay
- Screenshot uploads require Firebase Storage configuration
- MCP server requires Node.js stdio transport
- Extension requires explicit host permissions

### Migration Notes
- Cloudflare configuration backed up in `.cloudflare-backup/`
- Firebase replaces Cloudflare Workers, KV, R2, and Durable Objects
- Firestore replaces KV for session storage
- Firebase Storage replaces R2 for screenshots
- Firebase Hosting replaces Workers for static content

### Future Improvements
- [ ] Implement WebRTC for real-time streaming
- [ ] Add support for Firefox extension
- [ ] Enhance mobile app features
- [ ] Implement advanced filtering for logs
- [ ] Add team collaboration features

---

**Project Version**: 2.0.0
**Last Updated**: January 2025
**Status**: Production Ready (Firebase)
**Migration**: Cloudflare to Firebase Complete

*This document provides comprehensive project context for AI-assisted development. Always prioritize security, performance, and code quality in all implementations.*
