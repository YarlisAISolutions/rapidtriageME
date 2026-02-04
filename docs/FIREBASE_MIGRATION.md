# Firebase Migration Guide

> Migration documentation for RapidTriageME: Cloudflare to Firebase

## Executive Summary

RapidTriageME has been migrated from Cloudflare Workers to Firebase, providing a more integrated serverless platform with enhanced database, authentication, and storage capabilities. This migration consolidates the backend infrastructure under Google Cloud Platform while maintaining full API compatibility.

### Key Benefits of Migration

- **Unified Platform**: All backend services (functions, database, storage, auth) under one platform
- **Native Database**: Firestore provides real-time database with offline support
- **Enhanced Auth**: Firebase Authentication with multiple providers
- **Better Local Development**: Firebase Emulator Suite for complete local testing
- **Improved Monitoring**: Integrated logging and monitoring via Google Cloud
- **Cost Efficiency**: Pay-per-use model with generous free tier

### Migration Date
**January 2025**

### Migration Status
**Complete**

---

## What Changed

### Infrastructure Mapping

| Cloudflare | Firebase | Notes |
|------------|----------|-------|
| Workers | Cloud Functions | Serverless compute |
| KV | Firestore | Key-value/document storage |
| R2 | Cloud Storage | File/blob storage |
| Durable Objects | Firestore + Realtime DB | Stateful storage |
| Workers Sites | Firebase Hosting | Static hosting with CDN |
| Secrets | Secret Manager | Environment secrets |
| Analytics | Firebase Analytics | Usage tracking |

### Configuration Files

| Old (Cloudflare) | New (Firebase) | Purpose |
|------------------|----------------|---------|
| `wrangler.toml` | `firebase.json` | Project configuration |
| `wrangler-rapidtriage.toml` | `.firebaserc` | Environment/project aliases |
| N/A | `firestore.rules` | Database security rules |
| N/A | `firestore.indexes.json` | Database indexes |
| N/A | `storage.rules` | Storage security rules |

### Directory Structure Changes

**Before (Cloudflare)**
```
/rapidtriageME
├── /src                    # Cloudflare Worker code
│   ├── worker.ts           # Main entry point
│   ├── handlers/           # Request handlers
│   ├── middleware/         # Auth, rate limiting
│   └── services/           # Business logic
├── wrangler.toml           # Cloudflare config
└── wrangler-rapidtriage.toml
```

**After (Firebase)**
```
/rapidtriageME
├── /functions              # Firebase Functions
│   ├── src/
│   │   ├── index.ts        # Main entry point
│   │   ├── http/           # HTTP triggers
│   │   ├── callable/       # Callable functions
│   │   ├── scheduled/      # Scheduled functions
│   │   ├── background/     # Background triggers
│   │   ├── middleware/     # Auth, rate limiting
│   │   └── services/       # Business logic
│   ├── package.json
│   └── tsconfig.json
├── /src                    # Legacy (backup in .cloudflare-backup)
├── firebase.json           # Firebase config
├── .firebaserc             # Project aliases
├── firestore.rules         # Database rules
├── firestore.indexes.json  # Database indexes
├── storage.rules           # Storage rules
└── /.cloudflare-backup     # Backup of old config
```

---

## New Project Structure

### Firebase Functions Directory (`/functions`)

```
/functions
├── src/
│   ├── index.ts                    # Main entry - exports all functions
│   │
│   ├── http/                       # HTTP-triggered functions
│   │   ├── api/                    # REST API endpoints
│   │   │   └── index.ts            # API router
│   │   ├── auth/                   # Authentication endpoints
│   │   │   └── index.ts            # Auth router
│   │   ├── docs/                   # API documentation
│   │   │   └── index.ts            # Swagger/OpenAPI
│   │   ├── mcp/                    # MCP protocol
│   │   │   └── sse.ts              # Server-Sent Events
│   │   ├── health.ts               # Health check endpoint
│   │   ├── status.ts               # Status endpoint
│   │   └── metrics.ts              # Metrics endpoint
│   │
│   ├── callable/                   # Callable functions (client SDK)
│   │   ├── createApiKey.ts
│   │   ├── revokeApiKey.ts
│   │   └── captureScreenshot.ts
│   │
│   ├── scheduled/                  # Scheduled (cron) functions
│   │   ├── cleanupExpiredScreenshots.ts
│   │   ├── cleanupExpiredSessions.ts
│   │   └── aggregateMetrics.ts
│   │
│   ├── background/                 # Background triggers
│   │   ├── onScreenshotCreated.ts
│   │   └── onUserCreated.ts
│   │
│   ├── middleware/                 # Shared middleware
│   ├── services/                   # Business logic
│   ├── types/                      # TypeScript types
│   ├── utils/                      # Utility functions
│   └── config/                     # Configuration
│
├── package.json                    # Dependencies
└── tsconfig.json                   # TypeScript config
```

---

## Running Locally with Firebase Emulators

### Prerequisites

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify installation
firebase --version
```

### Starting Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators only
firebase emulators:start --only functions,firestore,hosting

# Start with import/export for data persistence
firebase emulators:start --import=./emulator-data --export-on-exit
```

### Emulator Ports

| Service | Port | URL |
|---------|------|-----|
| Emulator UI | 4000 | http://localhost:4000 |
| Functions | 5001 | http://localhost:5001 |
| Hosting | 5000 | http://localhost:5000 |
| Firestore | 8080 | http://localhost:8080 |
| Auth | 9099 | http://localhost:9099 |
| Storage | 9199 | http://localhost:9199 |

### Accessing the Emulator UI

Open http://localhost:4000 in your browser to access:
- Functions logs and invocation history
- Firestore data explorer
- Authentication user management
- Storage file browser

### Testing API Endpoints Locally

```bash
# Health check
curl http://localhost:5001/rapidtriage-me/us-central1/health

# API endpoint
curl -X POST http://localhost:5001/rapidtriage-me/us-central1/api/console-logs \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"

# SSE endpoint
curl http://localhost:5001/rapidtriage-me/us-central1/sse
```

---

## Deploying to Firebase

### Full Deployment

```bash
# Deploy everything (functions, hosting, firestore rules, storage rules)
firebase deploy
```

### Selective Deployment

```bash
# Deploy only functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:api
firebase deploy --only functions:health

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules

# Deploy functions and hosting
firebase deploy --only functions,hosting
```

### Deployment Verification

```bash
# Check deployment status
firebase projects:list

# View function logs
firebase functions:log

# Test production endpoint
curl https://rapidtriage-me.web.app/health
```

---

## Environment Variable Changes

### Removed Variables (Cloudflare-specific)

```bash
# No longer needed
CLOUDFLARE_ACCOUNT_ID=ed3fbe9532564f2f06ae772da689431a
ZONE_ID=dba0cbc72f7f0b7727fbdb6f4d6d7901
```

### New Variables (Firebase-specific)

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=rapidtriage-me
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=rapidtriage-me.firebaseapp.com
FIREBASE_STORAGE_BUCKET=rapidtriage-me.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=568288241317
FIREBASE_APP_ID=1:568288241317:web:28829514f6badd3719cf4c

# Google Cloud
GCLOUD_PROJECT=rapidtriage-me
GOOGLE_CLOUD_PROJECT=rapidtriage-me

# Emulator Ports
FIRESTORE_EMULATOR_PORT=8080
AUTH_EMULATOR_PORT=9099
STORAGE_EMULATOR_PORT=9199
FUNCTIONS_EMULATOR_PORT=5001
HOSTING_EMULATOR_PORT=5000
UI_EMULATOR_PORT=4000
```

### Setting Secrets

```bash
# Set secrets using Firebase CLI
firebase functions:secrets:set AUTH_TOKEN
firebase functions:secrets:set JWT_SECRET
firebase functions:secrets:set RAPIDTRIAGE_API_TOKEN

# List configured secrets
firebase functions:secrets:list

# Access secrets in Cloud Console
# https://console.cloud.google.com/security/secret-manager
```

### Unchanged Variables

```bash
# These remain the same
ENVIRONMENT=production|staging|development
API_BASE_URL=https://rapidtriage-me.web.app
BROWSER_TOOLS_PORT=3025
SSE_ENDPOINT=/sse
HEALTH_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

---

## Breaking Changes and Migration Steps

### 1. URL Changes

**Old URLs (Cloudflare)**
```
https://rapidtriage.me/api/...
https://rapidtriage.me/sse
https://rapidtriage.me/health
```

**New URLs (Firebase)**
```
https://rapidtriage-me.web.app/api/...
https://rapidtriage-me.web.app/sse
https://rapidtriage-me.web.app/health
```

**Migration**: Update client configurations to use new base URL, or configure custom domain `rapidtriage.me` to point to Firebase Hosting.

### 2. Storage API Changes

**Old (Cloudflare R2)**
```typescript
// Cloudflare R2
const object = await env.SCREENSHOTS.get(key);
await env.SCREENSHOTS.put(key, data);
```

**New (Firebase Storage)**
```typescript
// Firebase Storage
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const storage = getStorage();
const storageRef = ref(storage, `screenshots/${key}`);
await uploadBytes(storageRef, data);
const url = await getDownloadURL(storageRef);
```

### 3. Session Storage Changes

**Old (Cloudflare KV)**
```typescript
// Cloudflare KV
const session = await env.SESSIONS.get(sessionId);
await env.SESSIONS.put(sessionId, data, { expirationTtl: 3600 });
```

**New (Firestore)**
```typescript
// Firestore
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
const db = getFirestore();
const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
await setDoc(doc(db, 'sessions', sessionId), {
  ...data,
  expiresAt: new Date(Date.now() + 3600000)
});
```

### 4. WebSocket/Durable Objects

**Old (Durable Objects)**
```typescript
// Cloudflare Durable Objects
const id = env.BROWSER_SESSIONS.idFromName(sessionId);
const stub = env.BROWSER_SESSIONS.get(id);
```

**New (Firestore + Cloud Functions)**
```typescript
// Firestore for state, Functions for compute
const sessionRef = doc(db, 'browserSessions', sessionId);
await updateDoc(sessionRef, { lastActivity: new Date() });
```

### 5. CLI Command Changes

**Old (Wrangler)**
```bash
wrangler dev                    # Local development
wrangler deploy                 # Deploy to production
wrangler tail                   # View logs
wrangler secret put SECRET_NAME # Set secret
```

**New (Firebase CLI)**
```bash
firebase emulators:start        # Local development
firebase deploy                 # Deploy to production
firebase functions:log          # View logs
firebase functions:secrets:set  # Set secret
```

---

## Rollback Instructions

If you need to rollback to the Cloudflare configuration:

### 1. Restore Configuration Files

```bash
# Restore wrangler.toml
cp .cloudflare-backup/wrangler.toml ./wrangler.toml
cp .cloudflare-backup/wrangler-rapidtriage.toml ./wrangler-rapidtriage.toml
```

### 2. Reinstall Wrangler

```bash
npm install -g wrangler
```

### 3. Deploy to Cloudflare

```bash
wrangler deploy --env production
```

### 4. Update DNS

Point `rapidtriage.me` back to Cloudflare Workers if custom domain was migrated.

### 5. Verify Cloudflare Deployment

```bash
curl https://rapidtriage.me/health
wrangler tail
```

### Backup Location

All original Cloudflare configuration files are preserved in:
```
/.cloudflare-backup/
├── wrangler.toml
└── wrangler-rapidtriage.toml
```

---

## Verification Checklist

After migration, verify the following:

- [ ] Health endpoint responds: `curl https://rapidtriage-me.web.app/health`
- [ ] API documentation accessible: `https://rapidtriage-me.web.app/api-docs`
- [ ] SSE endpoint works: `curl https://rapidtriage-me.web.app/sse`
- [ ] Screenshot uploads work to Firebase Storage
- [ ] Session data persists in Firestore
- [ ] Authentication endpoints functional
- [ ] Chrome Extension connects successfully
- [ ] MCP server connects via SSE
- [ ] Scheduled functions running (check Cloud Scheduler)
- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed

---

## Support

For migration issues:
- **GitHub Issues**: https://github.com/YarlisAISolutions/rapidtriageME/issues
- **Firebase Documentation**: https://firebase.google.com/docs
- **Firebase Support**: https://firebase.google.com/support

---

**Migration Version**: 2.0.0
**Migration Date**: January 2025
**Author**: YarlisAISolutions
