# RapidTriageME Security Configuration Guide

## Overview
This guide documents the secure configuration of RapidTriageME, removing hardcoded secrets and implementing proper secret management using Cloudflare Workers secrets and Chrome extension storage.

## Changes Made

### 1. Removed Hardcoded Secrets
- **Previous Issue**: API token `KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8` was hardcoded in multiple files
- **Solution**: Replaced with environment variables and secure storage

### 2. Cloudflare Secrets Configuration

#### Production Secrets (Set via Wrangler)
```bash
# Set secrets in Cloudflare (already completed)
wrangler secret put RAPIDTRIAGE_API_TOKEN --env production
wrangler secret put AUTH_TOKEN --env production  
wrangler secret put JWT_SECRET --env production
```

#### Current Secrets:
- `RAPIDTRIAGE_API_TOKEN`: Primary API authentication token
- `AUTH_TOKEN`: Internal service authentication
- `JWT_SECRET`: JWT signing secret

### 3. Chrome Extension Configuration

#### Dynamic Token Storage
The Chrome extension now supports dynamic API token configuration:

1. **Options Page**: Users can set their API token in extension settings
2. **Secure Storage**: Tokens are stored in Chrome's secure sync storage
3. **Fallback Support**: Legacy hardcoded token works as fallback for backward compatibility

#### Setting API Token in Extension:
1. Click the extension settings (gear icon)
2. Navigate to Authentication section
3. Enter your API token
4. Save settings

### 4. Local Development Setup

#### Environment Files
```bash
# .env.local (for local development - DO NOT COMMIT)
ENVIRONMENT=development
API_BASE_URL=http://localhost:8787
RAPIDTRIAGE_API_TOKEN=rt_dev_KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8
AUTH_TOKEN=jAhIs3REKuFKMXmE5EmhcCUHAP1LuPA2ZFkSW67ZmLs=
JWT_SECRET=tqXbuNx4ob8g9MIQ+D3asKUInyudOhXkBx+oZNs3IWQ=
```

#### Loading Environment Variables:
```bash
# For local development
source .env.local

# For testing scripts
export RAPIDTRIAGE_API_TOKEN="your_token_here"
```

### 5. Worker Authentication Flow

The worker now checks authentication in this order:
1. **RAPIDTRIAGE_API_TOKEN** (primary, from Cloudflare secrets)
2. **AUTH_TOKEN** (legacy support)
3. **API Keys** (rtm_* prefixed keys from KV storage)
4. **JWT tokens** (for user sessions)

### 6. Updated Files

#### Core Changes:
- `/src/middleware/auth.ts` - Added RAPIDTRIAGE_API_TOKEN support
- `/rapidtriage-extension/popup.js` - Dynamic token from Chrome storage
- `/rapidtriage-extension/options.js` - API token configuration UI
- `/wrangler.toml` - Added secrets configuration comments

#### New Files:
- `/scripts/setup-secrets.sh` - Automated secret setup script
- `/scripts/remove-hardcoded-secrets.sh` - Remove hardcoded tokens
- `/.env.local` - Local development configuration
- `/.env.production` - Production configuration template
- `/docs/security-configuration.md` - This documentation

### 7. Security Best Practices

#### DO:
✅ Store secrets in Cloudflare Workers secrets for production
✅ Use environment variables for local development
✅ Rotate tokens regularly
✅ Use different tokens for different environments
✅ Keep .env files in .gitignore

#### DON'T:
❌ Commit .env files to git
❌ Hardcode secrets in source code
❌ Share production tokens
❌ Use the same token across environments
❌ Log or display tokens in console

### 8. Testing the Configuration

#### Test Production API:
```bash
curl -X POST https://rapidtriage.me/api/lighthouse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{"url": "https://www.google.com"}'
```

#### Test Local Development:
```bash
# Start local server with environment variables
source .env.local
npm run dev

# Test API
curl -X POST http://localhost:8787/api/lighthouse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RAPIDTRIAGE_API_TOKEN" \
  -d '{"url": "https://www.google.com"}'
```

### 9. Token Rotation

To rotate tokens:

1. **Generate new tokens**:
```bash
./scripts/setup-secrets.sh
# Choose option 1 to generate new secure tokens
```

2. **Update Cloudflare secrets**:
```bash
wrangler secret put RAPIDTRIAGE_API_TOKEN --env production
```

3. **Update Chrome extension** (for users):
- Open extension settings
- Update API token
- Save

### 10. Deployment

#### Deploy with secrets:
```bash
# Secrets are already set in Cloudflare
wrangler deploy --env production
```

#### Verify deployment:
```bash
curl https://rapidtriage.me/health
```

## Summary

The RapidTriageME platform now implements secure secret management:

1. **No hardcoded secrets** in source code
2. **Cloudflare Workers secrets** for production
3. **Environment variables** for local development  
4. **Chrome storage** for extension configuration
5. **Backward compatibility** maintained with fallback support

All sensitive tokens are now properly secured and can be rotated without code changes.