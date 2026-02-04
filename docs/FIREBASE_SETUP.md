# Firebase Setup Guide

> Complete setup instructions for RapidTriageME Firebase development environment

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   # Check version
   node --version

   # Install via nvm (recommended)
   nvm install 18
   nvm use 18
   ```

2. **Firebase CLI**
   ```bash
   # Install globally
   npm install -g firebase-tools

   # Verify installation
   firebase --version
   ```

3. **Google Cloud CLI** (optional, for advanced operations)
   ```bash
   # macOS
   brew install google-cloud-sdk

   # Verify installation
   gcloud --version
   ```

4. **Java Runtime** (required for Firestore emulator)
   ```bash
   # Check if installed
   java --version

   # macOS installation
   brew install openjdk@17
   ```

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME
```

### 2. Firebase Login

```bash
# Login to Firebase (opens browser)
firebase login

# Verify login
firebase projects:list
```

### 3. Select Firebase Project

```bash
# Use existing project
firebase use rapidtriage-me

# Or switch between environments
firebase use production  # Uses rapidtriage-me
firebase use default     # Uses rapidtriage-me
```

### 4. Install Dependencies

```bash
# Install root dependencies
npm install

# Install functions dependencies
cd functions && npm install && cd ..
```

---

## Firebase Project Details

| Property | Value |
|----------|-------|
| Project ID | `rapidtriage-me` |
| Project Number | `568288241317` |
| Web App ID | `1:568288241317:web:28829514f6badd3719cf4c` |
| Hosting URL | `https://rapidtriage-me.web.app` |
| Storage Bucket | `rapidtriage-me.firebasestorage.app` |
| Auth Domain | `rapidtriage-me.firebaseapp.com` |
| Default Region | `us-central1` |

---

## Environment Configuration

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
# Copy example file
cp .env.example .env

# Or create manually with these contents:
cat > .env << 'EOF'
# Firebase Configuration
FIREBASE_PROJECT_ID=rapidtriage-me
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=rapidtriage-me.firebaseapp.com
FIREBASE_STORAGE_BUCKET=rapidtriage-me.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=568288241317
FIREBASE_APP_ID=1:568288241317:web:28829514f6badd3719cf4c

# Application Configuration
ENVIRONMENT=development
NODE_ENV=development
API_BASE_URL=http://localhost:5001/rapidtriage-me/us-central1
BROWSER_TOOLS_PORT=3025

# Emulator Ports
FIRESTORE_EMULATOR_PORT=8080
AUTH_EMULATOR_PORT=9099
STORAGE_EMULATOR_PORT=9199
FUNCTIONS_EMULATOR_PORT=5001
HOSTING_EMULATOR_PORT=5000
UI_EMULATOR_PORT=4000
EOF
```

### 2. Set Production Secrets

For production deployment, set secrets using Firebase CLI:

```bash
# Set authentication token
firebase functions:secrets:set AUTH_TOKEN

# Set JWT secret
firebase functions:secrets:set JWT_SECRET

# Set API token
firebase functions:secrets:set RAPIDTRIAGE_API_TOKEN

# Verify secrets are set
firebase functions:secrets:list
```

### 3. Access Secrets in Functions

```typescript
import { defineSecret } from 'firebase-functions/params';

const authToken = defineSecret('AUTH_TOKEN');
const jwtSecret = defineSecret('JWT_SECRET');

export const api = onRequest(
  { secrets: [authToken, jwtSecret] },
  async (req, res) => {
    const token = authToken.value();
    // Use token...
  }
);
```

---

## Running Emulators Locally

### Start All Emulators

```bash
firebase emulators:start
```

### Start Specific Emulators

```bash
# Functions and Firestore only
firebase emulators:start --only functions,firestore

# All except auth
firebase emulators:start --only functions,firestore,hosting,storage
```

### Persist Emulator Data

```bash
# Start with data import and export on exit
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
```

### Emulator UI Access

After starting emulators, access the UI at: **http://localhost:4000**

The UI provides:
- **Functions**: Logs, invocation history, error tracking
- **Firestore**: Document browser, query testing, rules playground
- **Auth**: User management, provider testing
- **Storage**: File browser, upload testing

### Testing Endpoints

```bash
# Health check
curl http://localhost:5001/rapidtriage-me/us-central1/health

# API endpoint (with auth)
curl -X POST http://localhost:5001/rapidtriage-me/us-central1/api/console-logs \
  -H "Authorization: Bearer local-dev-token" \
  -H "Content-Type: application/json" \
  -d '{}'

# SSE endpoint
curl -N http://localhost:5001/rapidtriage-me/us-central1/sse
```

---

## Deploying to Production

### Pre-deployment Checklist

1. [ ] All tests passing: `npm test`
2. [ ] TypeScript compiles: `cd functions && npm run build`
3. [ ] Secrets configured: `firebase functions:secrets:list`
4. [ ] Security rules reviewed
5. [ ] Indexes defined in `firestore.indexes.json`

### Full Deployment

```bash
# Deploy everything
firebase deploy

# This deploys:
# - Cloud Functions
# - Hosting
# - Firestore rules and indexes
# - Storage rules
```

### Selective Deployment

```bash
# Deploy only functions
firebase deploy --only functions

# Deploy a specific function
firebase deploy --only functions:api
firebase deploy --only functions:health,functions:metrics

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Firestore indexes
firebase deploy --only firestore:indexes

# Deploy only Storage rules
firebase deploy --only storage:rules
```

### Verify Deployment

```bash
# Check hosting
curl https://rapidtriage-me.web.app/health

# View function logs
firebase functions:log

# View logs for specific function
firebase functions:log --only api

# View recent logs
firebase functions:log --limit 50
```

---

## Project Configuration Files

### firebase.json

Main Firebase configuration:

```json
{
  "hosting": {
    "public": "dist/public",
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "/health", "function": "health" }
    ]
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "nodejs20"
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

### .firebaserc

Project aliases:

```json
{
  "projects": {
    "default": "rapidtriage-me",
    "production": "rapidtriage-me"
  }
}
```

### firestore.rules

Database security rules (see `firestore.rules` in project root).

### storage.rules

Storage security rules (see `storage.rules` in project root).

---

## Functions Development

### Building Functions

```bash
cd functions

# Build once
npm run build

# Watch mode (auto-rebuild)
npm run build:watch
```

### Adding New Functions

1. Create function file in appropriate directory:
   ```
   functions/src/http/myEndpoint.ts
   functions/src/callable/myFunction.ts
   functions/src/scheduled/myTask.ts
   ```

2. Export from `functions/src/index.ts`:
   ```typescript
   export { myEndpoint } from './http/myEndpoint.js';
   ```

3. Add routing in `firebase.json` if HTTP function:
   ```json
   {
     "source": "/my-endpoint",
     "function": "myEndpoint"
   }
   ```

### Function Types

**HTTP Functions**
```typescript
import { onRequest } from 'firebase-functions/v2/https';

export const myEndpoint = onRequest(async (req, res) => {
  res.json({ status: 'ok' });
});
```

**Callable Functions**
```typescript
import { onCall } from 'firebase-functions/v2/https';

export const myFunction = onCall(async (request) => {
  return { result: 'success' };
});
```

**Scheduled Functions**
```typescript
import { onSchedule } from 'firebase-functions/v2/scheduler';

export const myTask = onSchedule('every 24 hours', async (event) => {
  // Cleanup task
});
```

**Background Triggers**
```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  // Handle new user
});
```

---

## Common Commands Reference

### Firebase CLI

```bash
# Login/logout
firebase login
firebase logout

# Project management
firebase projects:list
firebase use <project-id>

# Deployment
firebase deploy
firebase deploy --only functions
firebase deploy --only hosting

# Emulators
firebase emulators:start
firebase emulators:start --only functions,firestore

# Logs
firebase functions:log
firebase functions:log --only api

# Secrets
firebase functions:secrets:set SECRET_NAME
firebase functions:secrets:list
firebase functions:secrets:access SECRET_NAME

# Delete functions
firebase functions:delete functionName
```

### Google Cloud CLI (optional)

```bash
# Login
gcloud auth login

# Set project
gcloud config set project rapidtriage-me

# View logs in Cloud Console
gcloud logs read

# View function details
gcloud functions list
gcloud functions describe functionName
```

---

## Troubleshooting

### Common Issues

**1. Java not found for emulators**
```bash
# Install Java
brew install openjdk@17

# Add to PATH
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
```

**2. Port already in use**
```bash
# Find process using port
lsof -i :5001

# Kill process
kill -9 <PID>

# Or use different port
firebase emulators:start --config firebase-alt.json
```

**3. Functions build errors**
```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
```

**4. Permission denied on deploy**
```bash
# Re-authenticate
firebase login --reauth

# Check project permissions
firebase projects:list
```

**5. Emulator data not persisting**
```bash
# Always use export flag
firebase emulators:start --export-on-exit=./emulator-data

# Import on next start
firebase emulators:start --import=./emulator-data
```

---

## Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Cloud Functions Guide**: https://firebase.google.com/docs/functions
- **Firestore Documentation**: https://firebase.google.com/docs/firestore
- **Firebase CLI Reference**: https://firebase.google.com/docs/cli
- **Project Issues**: https://github.com/YarlisAISolutions/rapidtriageME/issues

---

**Last Updated**: January 2025
**Firebase CLI Version**: 13.x+
**Node.js Version**: 18+
