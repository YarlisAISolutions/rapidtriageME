# Firebase Migration Guide

## Overview

This document describes the comprehensive migration from Cloudflare to Firebase, implementing a provider-agnostic architecture that enables seamless switching between cloud providers.

## Architecture

### Provider-Agnostic Design

The migration implements a clean separation between business logic and infrastructure through provider interfaces:

```typescript
import { ProviderFactory } from '@/providers/factory';

// Easy provider switching
const provider = ProviderFactory.create('firebase'); // or 'cloudflare', 'aws', 'azure'

// Use provider services
await provider.auth.login(email, password);
await provider.database.create('users', userData);
await provider.storage.upload('screenshots', file);
```

### Directory Structure

```
/src/providers/
├── interfaces/          # Common interfaces for all providers
│   └── index.ts        # IProvider, IAuthProvider, IDatabaseProvider, etc.
├── firebase/           # Firebase implementation
│   ├── index.ts       # Main Firebase provider
│   ├── auth.provider.ts
│   ├── database.provider.ts
│   ├── storage.provider.ts
│   ├── realtime.provider.ts
│   ├── functions.provider.ts
│   ├── analytics.provider.ts
│   ├── messaging.provider.ts
│   └── config.provider.ts
├── cloudflare/        # Existing Cloudflare implementation
├── aws/              # AWS implementation (future)
├── azure/            # Azure implementation (future)
└── factory.ts        # Provider factory for instantiation
```

## Firebase Services Configuration

### 1. Authentication (Firebase Auth)

**Features:**
- Email/password authentication
- OAuth providers (Google, GitHub, Microsoft, Keycloak)
- Multi-factor authentication (SMS, TOTP, Email)
- Custom claims and role-based access control
- API key management

**Migration from Cloudflare:**
- Users stored in KV → Firestore users collection
- Custom JWT → Firebase ID tokens
- API keys in KV → Firestore apiKeys collection

### 2. Database (Firestore)

**Collections Structure:**

```javascript
// Users Collection
users/{userId}
  - profile: { email, name, role, subscription }
  - apiKeys/{keyId}
  - sessions/{sessionId}
  - metrics/{metricId}

// Organizations Collection
organizations/{orgId}
  - settings: { name, plan, features }
  - members/{memberId}
  - workspaces/{workspaceId}
  - billing/{document}

// Projects Collection
projects/{projectId}
  - metadata: { name, owner, members, status }
  - sessions/{sessionId}
  - screenshots/{screenshotId}
  - reports/{reportId}

// Real-time Sessions
sessions/{sessionId}
  - browserData: { url, title, userAgent }
  - consoleLogs/{logId}
  - networkLogs/{logId}
  - events/{eventId}
```

**Security Rules:**
- User-based access control
- Organization-based permissions
- Role-based authorization (owner, admin, developer, analyst, viewer, billing)
- Project membership validation

### 3. Storage (Cloud Storage)

**Bucket Structure:**
```
/screenshots/{tenantId}/{projectId}/{timestamp}/
/reports/{userId}/{reportId}/
/exports/{exportId}/
/temp/{sessionId}/
/users/{userId}/profile/
/organizations/{orgId}/assets/
/public/
/backups/
```

**Features:**
- Signed URLs for secure access
- Automatic cleanup with lifecycle rules
- Size limits per file type
- Content type validation

### 4. Real-time Features (Realtime Database)

**Structure:**
```javascript
/sessions
  /{sessionId}
    /status: "active" | "inactive"
    /browser: { url, title, userAgent }
    /consoleLogs: []
    /networkRequests: []
    /screenshots: []
    /events: []
```

**Migration from WebSockets:**
- Durable Objects → Firebase Realtime Database
- WebSocket connections → Firebase listeners
- Manual broadcasting → Automatic sync

### 5. Cloud Functions

**Function Types:**
- HTTP endpoints for API routes
- Firestore triggers for data processing
- Storage triggers for file processing
- Authentication triggers for user management
- Scheduled functions for maintenance

**Key Functions:**
```typescript
// API endpoints
exports.api = functions.https.onRequest(app);
exports.screenshot = functions.https.onCall(screenshotHandler);
exports.consoleLogs = functions.https.onCall(consoleLogsHandler);

// Triggers
exports.onUserCreate = functions.auth.user().onCreate(userHandler);
exports.onProjectUpdate = functions.firestore.document('projects/{id}').onUpdate(projectHandler);
```

## Migration Steps

### Phase 1: Setup (Week 1)

1. **Create Firebase Project**
   ```bash
   firebase init
   firebase use --add rapidtriage-prod
   ```

2. **Install Dependencies**
   ```bash
   npm install firebase firebase-admin firebase-functions
   ```

3. **Configure Services**
   - Enable Authentication
   - Create Firestore database
   - Set up Cloud Storage buckets
   - Deploy security rules

### Phase 2: Authentication Migration (Week 2)

1. **Export existing users from Cloudflare KV**
2. **Import users to Firebase Auth using Admin SDK**
3. **Update authentication flows in application**
4. **Migrate API keys to Firestore**

### Phase 3: Database Migration (Week 2-3)

1. **Create Firestore collections**
2. **Deploy indexes**
3. **Migrate data from Cloudflare KV**
4. **Update database queries in application**

### Phase 4: Storage Migration (Week 3)

1. **Create Cloud Storage buckets**
2. **Migrate screenshots from R2**
3. **Update storage URLs in application**
4. **Configure lifecycle rules**

### Phase 5: Functions Deployment (Week 4)

1. **Convert Cloudflare Workers to Cloud Functions**
2. **Deploy HTTP endpoints**
3. **Set up triggers**
4. **Configure environment variables**

### Phase 6: Testing & Optimization (Week 5)

1. **End-to-end testing**
2. **Performance optimization**
3. **Security audit**
4. **Load testing**

## Environment Configuration

### Development (.env.development)
```env
CLOUD_PROVIDER=firebase
FIREBASE_PROJECT_ID=rapidtriage-dev
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=rapidtriage-dev.firebaseapp.com
FIREBASE_STORAGE_BUCKET=rapidtriage-dev.appspot.com
USE_FIREBASE_EMULATORS=true
```

### Production (.env.production)
```env
CLOUD_PROVIDER=firebase
FIREBASE_PROJECT_ID=rapidtriage-prod
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=rapidtriage-prod.firebaseapp.com
FIREBASE_STORAGE_BUCKET=rapidtriage-prod.appspot.com
```

## Deployment

### Local Development
```bash
# Start emulators
firebase emulators:start

# Run development server
npm run dev
```

### Staging Deployment
```bash
firebase use staging
firebase deploy --only hosting,functions,firestore,storage
```

### Production Deployment
```bash
firebase use production
firebase deploy --only hosting,functions,firestore,storage
```

## Provider Switching

To switch between providers, simply change the environment variable:

```typescript
// .env
CLOUD_PROVIDER=firebase  // or 'cloudflare', 'aws', 'azure'

// Application code remains the same
const provider = ProviderFactory.create();
```

## Rollback Strategy

If issues arise, rollback is straightforward:

1. **Switch provider in environment**
   ```env
   CLOUD_PROVIDER=cloudflare
   ```

2. **Deploy previous version**
   ```bash
   git checkout main
   wrangler deploy
   ```

3. **Data sync (if needed)**
   - Run data sync scripts to ensure consistency

## Benefits

1. **Provider Independence** - No vendor lock-in
2. **Scalability** - Firebase auto-scales
3. **Real-time Updates** - Native real-time capabilities
4. **Cost Optimization** - Pay-as-you-go pricing
5. **Mobile Integration** - Seamless mobile SDK support
6. **Analytics** - Built-in analytics and monitoring
7. **Security** - Advanced security rules and authentication

## Monitoring

### Key Metrics
- Authentication success rate
- Firestore read/write operations
- Storage bandwidth usage
- Function invocations
- Real-time connections

### Dashboards
- Firebase Console
- Google Cloud Console
- Custom monitoring dashboards

## Support

For questions or issues:
- Firebase Documentation: https://firebase.google.com/docs
- Project Documentation: /docs
- GitHub Issues: https://github.com/YarlisAISolutions/rapidtriageME/issues

## Conclusion

This migration provides a robust, scalable, and flexible architecture that supports the growth of RapidTriageME while maintaining the ability to switch providers as needed.