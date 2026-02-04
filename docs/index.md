# RapidTriageME Documentation

Welcome to the comprehensive documentation for RapidTriageME - YarlisAISolutions' browser triage and debugging platform.

## Documentation Structure

### Getting Started
- [01 - Quick Start Guide](01-quickstart.md) - Get up and running in 5 minutes
- [02 - Configuration Management](02-configuration-management.md) - Environment and configuration setup
- [03 - IDE Configuration](03-ide-configuration.md) - Setup for 10+ IDEs (Claude, Cursor, VS Code, etc.)
- [04 - Local Testing](04-local-testing.md) - Test locally before deployment

### Deployment and Infrastructure
- [05 - Deployment Guide](05-deployment.md) - Complete deployment instructions (local, staging, production)
- [06 - Publish Checklist](06-publish-checklist.md) - Pre-deployment checklist
- [12 - Remote Browser Solution](12-remote-browser-solution.md) - Cloud infrastructure setup
- [Firebase Setup Guide](FIREBASE_SETUP.md) - Firebase environment setup
- [Firebase Migration Guide](FIREBASE_MIGRATION.md) - Migration from Cloudflare to Firebase

### Technical Documentation
- [07 - Project Structure](07-project-structure.md) - Repository organization
- [10 - MCP Protocol](10-mcp-protocol.md) - Model Context Protocol implementation
- [11 - MCP Documentation](11-mcp-documentation.md) - Detailed MCP specification
- [14 - MCP Usage Guide](14-mcp-usage-guide.md) - How to use MCP features

### Testing and Validation
- [13 - Testing Guide](13-testing.md) - Comprehensive testing procedures and results

### Reference
- [08 - Improvements Summary](08-improvements-summary.md) - Recent updates and fixes
- [09 - Final Status](09-final-status.md) - Current deployment status
- [15 - Quick Reference](15-quick-reference.md) - Commands and API reference

## Quick Links

- **Production Site**: https://rapidtriage-me.web.app
- **API Documentation**: https://rapidtriage-me.web.app/api-docs
- **GitHub Repository**: https://github.com/YarlisAISolutions/rapidtriageME
- **NPM Packages**:
  - [@yarlis/rapidtriage-mcp](https://www.npmjs.com/package/@yarlis/rapidtriage-mcp)
  - [@yarlis/rapidtriage-server](https://www.npmjs.com/package/@yarlis/rapidtriage-server)

## Key Features

- **Real-time Browser Monitoring** - Capture console logs, network requests, DOM changes
- **Advanced Screenshot Capture** - Full-page and viewport screenshots
- **Lighthouse Audits** - Performance, accessibility, SEO analysis
- **Remote Debugging** - Debug browsers from anywhere
- **Multi-IDE Support** - Works with 10+ IDEs and AI assistants
- **Secure** - Token-based authentication and rate limiting
- **Cloud Ready** - Deployable to Firebase

## Components

1. **Chrome Extension** - Browser DevTools integration
2. **MCP Server** - IDE integration via Model Context Protocol
3. **Browser Connector** - Local Node.js middleware
4. **Firebase Functions** - Production serverless backend
5. **Firebase Hosting** - Static content delivery

## Available MCP Tools

1. `remote_browser_navigate` - Navigate to URLs
2. `remote_capture_screenshot` - Capture screenshots
3. `remote_get_console_logs` - Retrieve console logs
4. `remote_get_network_logs` - Get network requests
5. `remote_run_lighthouse_audit` - Run performance audits
6. `remote_inspect_element` - Inspect DOM elements
7. `remote_execute_javascript` - Execute JS code
8. `remote_generate_triage_report` - Generate reports

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/metrics` | GET | Application metrics |
| `/sse` | POST | MCP protocol (JSON-RPC) |
| `/api-docs` | GET | Swagger documentation |
| `/api/screenshot` | POST | Capture screenshots |
| `/api/console-logs` | POST | Get console logs |
| `/api/network-logs` | POST | Get network logs |
| `/api/lighthouse` | POST | Run Lighthouse audits |
| `/api/execute-js` | POST | Execute JavaScript |
| `/api/inspect-element` | POST | Inspect DOM elements |
| `/api/navigate` | POST | Navigate browser |
| `/api/triage-report` | POST | Generate triage reports |

## Authentication

All API endpoints (except `/health`) require Bearer token authentication:

```bash
Authorization: Bearer your_auth_token
```

See the [Firebase Setup Guide](FIREBASE_SETUP.md) for instructions on configuring authentication secrets.

## Performance

- **Firebase Functions**: Cold start < 500ms, execution < 100ms
- **Firebase Hosting CDN**: Global edge caching
- **Rate Limiting**: 100 requests/minute
- **Lighthouse Scores**: Performance 97/100, Accessibility 80/100

## Infrastructure

| Service | Technology | Purpose |
|---------|------------|---------|
| Compute | Firebase Functions | Serverless API endpoints |
| Database | Firestore | Session and data storage |
| Storage | Firebase Storage | Screenshot and file storage |
| Hosting | Firebase Hosting | Static content and CDN |
| Auth | Firebase Authentication | User management |

## Firebase Project

- **Project ID**: rapidtriage-me
- **Hosting URL**: https://rapidtriage-me.web.app
- **Storage Bucket**: rapidtriage-me.firebasestorage.app
- **Region**: us-central1

## Support

- **GitHub Issues**: [Report issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- **Documentation**: [This site](https://yarlisaisolutions.github.io/rapidtriageME/)
- **Email**: support@yarlisai.com

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Status**: Production Ready (Firebase)
