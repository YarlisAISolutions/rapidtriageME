# RapidTriageME Compatibility Matrix

This document provides compatibility information for all RapidTriageME components after the Firebase migration.

## Firebase SDK Versions

| Package | Version | Purpose |
|---------|---------|---------|
| firebase-admin | ^12.0.0 | Server-side Firebase Admin SDK |
| firebase-functions | ^5.0.0 | Firebase Cloud Functions runtime |
| @firebase/app | ^0.10.0 | Client-side Firebase App |
| @firebase/auth | ^1.5.0 | Client-side Authentication |
| @firebase/firestore | ^4.4.0 | Client-side Firestore |
| @firebase/storage | ^0.12.0 | Client-side Storage |

### Firebase CLI

- **Minimum Version**: 13.0.0
- **Recommended Version**: 13.24.0 or later
- **Installation**: `npm install -g firebase-tools`

## Node.js Version Requirements

| Component | Minimum | Recommended | Maximum Tested |
|-----------|---------|-------------|----------------|
| Firebase Functions | 18.0.0 | 20.x | 20.x |
| MCP Server | 18.0.0 | 20.x | 21.x |
| Browser Server | 18.0.0 | 20.x | 21.x |
| Build Tools | 16.0.0 | 20.x | 21.x |

### Why Node.js 20?

- Firebase Functions Gen 2 supports Node.js 20
- LTS release with long-term support until April 2026
- Required for ES2021+ features used in codebase
- Improved performance over Node.js 18

## TypeScript Version Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| All Components | 5.0.0 | 5.3.3+ |

### TypeScript Configuration

The project uses the following TypeScript settings:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## Chrome Extension Compatibility

### Browser Support

| Browser | Minimum Version | Tested Version | Status |
|---------|-----------------|----------------|--------|
| Google Chrome | 120 | 131 | Fully Supported |
| Microsoft Edge | 120 | 131 | Fully Supported |
| Brave | Latest | Latest | Fully Supported |
| Opera | 106 | Latest | Supported |
| Vivaldi | Latest | Latest | Supported |

### Extension Manifest

- **Manifest Version**: V3
- **Required Permissions**:
  - `devtools`
  - `activeTab`
  - `storage`
  - `scripting`

### Backend Communication Changes

The Chrome extension communicates with the backend via:

| Endpoint | Old (Cloudflare) | New (Firebase) |
|----------|------------------|----------------|
| API Base | `https://rapidtriage.me` | `https://rapidtriage-me.web.app` |
| SSE | `wss://rapidtriage.me/sse` | `https://rapidtriage-me.web.app/sse` |
| Health | `https://rapidtriage.me/health` | `https://rapidtriage-me.web.app/health` |

**Note**: The custom domain `rapidtriage.me` can be configured to point to Firebase Hosting if desired.

### Extension Configuration

Update extension configuration to use Firebase endpoints:

```javascript
// config.js
const API_CONFIG = {
  // Production
  production: {
    apiUrl: 'https://rapidtriage-me.web.app',
    sseUrl: 'https://rapidtriage-me.web.app/sse',
  },
  // Development (with emulators)
  development: {
    apiUrl: 'http://localhost:5001/rapidtriage-me/us-central1',
    sseUrl: 'http://localhost:5001/rapidtriage-me/us-central1/sse',
  },
};
```

## MCP Server Compatibility

### Supported IDEs

| IDE | Version | MCP Support | Status |
|-----|---------|-------------|--------|
| Cursor | 0.40+ | Native | Fully Supported |
| VS Code + Continue | 1.85+ | Via Extension | Fully Supported |
| Claude Desktop | Latest | Native | Fully Supported |
| Windsurf | Latest | Native | Fully Supported |
| Zed | Latest | Native | Supported |
| JetBrains IDEs | 2023.3+ | Via Plugin | Supported |
| Neovim | 0.9+ | Via Plugin | Supported |

### MCP Protocol Version

- **Protocol Version**: 0.5.0
- **SDK**: `@modelcontextprotocol/sdk@^0.5.0`

### MCP Configuration Changes

Update your IDE's MCP configuration for Firebase:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "command": "npx",
      "args": ["@yarlis/rapidtriage-mcp"],
      "env": {
        "RAPIDTRIAGE_API_URL": "https://rapidtriage-me.web.app",
        "RAPIDTRIAGE_AUTH_TOKEN": "your-token-here"
      }
    }
  }
}
```

### MCP Tools Compatibility

All MCP tools remain compatible with the Firebase backend:

| Tool | Status | Notes |
|------|--------|-------|
| getConsoleLogs | Compatible | No changes required |
| getConsoleErrors | Compatible | No changes required |
| getNetworkLogs | Compatible | No changes required |
| getNetworkErrors | Compatible | No changes required |
| takeScreenshot | Compatible | Storage now uses Firebase Storage |
| getSelectedElement | Compatible | No changes required |
| wipeLogs | Compatible | No changes required |
| runAccessibilityAudit | Compatible | No changes required |
| runPerformanceAudit | Compatible | No changes required |
| runSEOAudit | Compatible | No changes required |
| runBestPracticesAudit | Compatible | No changes required |
| runDebuggerMode | Compatible | No changes required |
| runAuditMode | Compatible | No changes required |

## Browser Connector (Local Server)

### System Requirements

| OS | Minimum | Tested |
|----|---------|--------|
| macOS | 12.0 (Monterey) | 14.0 (Sonoma) |
| Windows | 10 (1903) | 11 |
| Linux | Ubuntu 20.04 | Ubuntu 22.04 |

### Port Configuration

| Port | Service | Configurable |
|------|---------|--------------|
| 3025 | Browser Connector | Yes, via BROWSER_TOOLS_PORT |

### Puppeteer Compatibility

| Puppeteer Version | Chrome Version | Status |
|-------------------|----------------|--------|
| 21.0+ | 115+ | Supported |
| 22.0+ | 121+ | Recommended |

## Mobile App Compatibility

### React Native

| Package | Version |
|---------|---------|
| react-native | 0.73+ |
| expo | 50+ |

### Platform Support

| Platform | Minimum OS | Status |
|----------|------------|--------|
| iOS | 14.0 | Supported |
| Android | 8.0 (API 26) | Supported |

### Firebase SDK for Mobile

```json
{
  "@react-native-firebase/app": "^18.0.0",
  "@react-native-firebase/auth": "^18.0.0",
  "@react-native-firebase/firestore": "^18.0.0",
  "@react-native-firebase/storage": "^18.0.0"
}
```

## API Compatibility

### REST API Endpoints

All API endpoints maintain backward compatibility:

| Endpoint | Method | Status |
|----------|--------|--------|
| /health | GET | Compatible |
| /metrics | GET | Compatible |
| /api/screenshot | POST | Compatible |
| /api/console-logs | POST | Compatible |
| /api/network-logs | POST | Compatible |
| /api/lighthouse | POST | Compatible |
| /api/execute-js | POST | Compatible |
| /api/inspect-element | POST | Compatible |
| /api/navigate | POST | Compatible |
| /api/triage-report | POST | Compatible |

### Authentication Changes

| Method | Old (Cloudflare) | New (Firebase) |
|--------|------------------|----------------|
| Bearer Token | Supported | Supported |
| API Key | Supported | Supported |
| Firebase Auth | N/A | Supported |

## Emulator Support

### Firebase Emulator Ports

| Service | Port | Purpose |
|---------|------|---------|
| Auth | 9099 | Authentication emulator |
| Firestore | 8080 | Database emulator |
| Storage | 9199 | Storage emulator |
| Functions | 5001 | Functions emulator |
| Hosting | 5000 | Hosting emulator |
| UI | 4000 | Emulator UI dashboard |

### Starting Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only functions,firestore

# Start with data import
firebase emulators:start --import=./emulator-data
```

## Testing Compatibility

### Test Frameworks

| Framework | Version | Purpose |
|-----------|---------|---------|
| Jest | ^29.7.0 | Unit/Integration testing |
| firebase-functions-test | ^3.1.0 | Functions testing |
| Puppeteer | ^22.0.0 | E2E testing |
| Playwright | ^1.40.0 | E2E testing |

### Running Tests

```bash
# Unit tests
cd functions && npm test

# With emulators
firebase emulators:exec "cd functions && npm test"

# E2E tests
npm run test:e2e
```

## Migration Notes

### Breaking Changes

1. **API Base URL**: Default URL changed from `rapidtriage.me` to `rapidtriage-me.web.app`
2. **WebSocket to SSE**: SSE now served via Firebase Functions
3. **Storage**: Screenshots stored in Firebase Storage instead of Cloudflare R2

### Environment Variables

| Variable | Old | New | Required |
|----------|-----|-----|----------|
| CLOUDFLARE_ACCOUNT_ID | Used | Removed | No |
| CLOUDFLARE_API_TOKEN | Used | Removed | No |
| FIREBASE_PROJECT_ID | N/A | Used | Yes |
| FIREBASE_API_KEY | N/A | Used | Yes |

### Data Migration

If migrating existing data:

1. Export from Cloudflare KV
2. Transform to Firestore format
3. Import using Firebase Admin SDK

See `/scripts/migrate-data.js` for migration utilities.

## Support Matrix Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Firebase Functions | Production Ready | Node.js 20 |
| Firestore | Production Ready | All indexes configured |
| Firebase Storage | Production Ready | Rules configured |
| Firebase Auth | Production Ready | Email/Password, Google |
| Chrome Extension | Compatible | Update API URLs |
| MCP Server | Compatible | Update environment |
| Mobile App | Compatible | Update Firebase config |

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01 | 1.0.0 | Initial Firebase migration |

---

**Last Updated**: January 2025
**Maintained By**: YarlisAISolutions
