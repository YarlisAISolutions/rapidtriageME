# Security Policy - RapidTriageME

> Security standards and guidelines for the RapidTriageME platform

## Table of Contents
1. [Security Requirements](#security-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Code Security Standards](#code-security-standards)
4. [Secrets Management](#secrets-management)
5. [Dependency Management](#dependency-management)
6. [Authentication & Authorization](#authentication--authorization)
7. [Data Protection](#data-protection)
8. [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Security Requirements

### Mandatory Checks Before Deployment

All deployments MUST pass these security gates:

| Check | Requirement | Command |
|-------|-------------|---------|
| NPM Audit | 0 high/critical vulnerabilities | `npm audit` |
| Secrets Scan | No exposed credentials | See [Secrets Management](#secrets-management) |
| Dependencies | All packages up-to-date | `npm outdated` |
| Type Safety | No TypeScript errors | `npm run build` |
| Tests | All tests passing | `npm test` |
| Lint | No security-related lint errors | `npm run lint` |

### Vulnerability Severity Thresholds

| Severity | Deployment Allowed | Action Required |
|----------|-------------------|-----------------|
| Critical | NO | Immediate fix required |
| High | NO | Fix before deployment |
| Moderate | YES (with approval) | Fix within 7 days |
| Low | YES | Fix within 30 days |

---

## Pre-Deployment Checklist

```bash
#!/bin/bash
# Run this before every deployment

echo "=== RapidTriageME Security Check ==="

# 1. Check for secrets in code
echo "Checking for exposed secrets..."
grep -r "sk_live_\|sk_test_\|AIzaSy\|ghp_\|gho_" --include="*.ts" --include="*.js" src/ 2>/dev/null && echo "WARNING: Possible secrets found!" || echo "✓ No secrets in code"

# 2. Verify .env is gitignored
echo "Checking .gitignore..."
grep -q "^\.env$" .gitignore && echo "✓ .env is gitignored" || echo "WARNING: .env not in .gitignore!"

# 3. NPM Audit
echo "Running npm audit..."
npm audit --audit-level=high && echo "✓ No high vulnerabilities" || echo "FAIL: High vulnerabilities found!"

# 4. Run tests
echo "Running tests..."
npm test && echo "✓ All tests pass" || echo "FAIL: Tests failed!"

# 5. Build check
echo "Building..."
npm run build && echo "✓ Build successful" || echo "FAIL: Build failed!"

echo "=== Security Check Complete ==="
```

---

## Code Security Standards

### Prohibited Patterns

These patterns are **PROHIBITED** in production code:

```typescript
// ❌ NEVER use eval() with user input
eval(userInput);  // PROHIBITED

// ❌ NEVER use Function constructor with user input
new Function(userInput);  // PROHIBITED

// ❌ NEVER set innerHTML with untrusted data
element.innerHTML = userProvidedContent;  // PROHIBITED

// ❌ NEVER disable TypeScript strict checks
// @ts-ignore  // Avoid unless absolutely necessary

// ❌ NEVER hardcode secrets
const API_KEY = "sk_live_xxx";  // PROHIBITED
```

### Allowed Exceptions

Some patterns are allowed with proper justification:

```typescript
// ✓ eval() for debugger/developer tools ONLY (documented feature)
// File: src/worker.ts - JavaScript execution feature for debugging
if (isDebugMode && userIsAuthenticated) {
  const result = eval(code);  // Allowed: explicit debugger feature
}

// ✓ innerHTML with sanitized/controlled content
element.innerHTML = DOMPurify.sanitize(content);  // Allowed: sanitized

// ✓ innerHTML with template literals (no user input)
element.innerHTML = `<div class="status">${escapeHtml(status)}</div>`;  // Allowed: escaped
```

### Required Patterns

```typescript
// ✓ Always validate user input
function processInput(input: unknown): SafeInput {
  const schema = z.object({
    url: z.string().url(),
    action: z.enum(['capture', 'analyze']),
  });
  return schema.parse(input);
}

// ✓ Always use parameterized queries
const result = await db.collection('users')
  .where('email', '==', sanitizedEmail)
  .get();

// ✓ Always escape output
const safeHtml = escapeHtml(userContent);

// ✓ Always use HTTPS
const apiUrl = 'https://api.example.com';  // Never http://

// ✓ Always set security headers
response.set({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'",
});
```

---

## Secrets Management

### Secret Categories

| Category | Storage | Example |
|----------|---------|---------|
| API Keys | Firebase Secrets | `STRIPE_SECRET_KEY` |
| Auth Tokens | Firebase Secrets | `JWT_SECRET` |
| Database Credentials | Firebase Secrets | Never needed (uses ADC) |
| Client IDs | Environment Variables | `GOOGLE_CLIENT_ID` |

### Storage Rules

```
✓ Firebase Secrets Manager (Production)
  firebase functions:secrets:set SECRET_NAME

✓ Local .env file (Development)
  - Must be in .gitignore
  - Never commit to repository

✗ NEVER store in:
  - Source code
  - Configuration files
  - Git history
  - Log files
  - Error messages
```

### Setting Secrets

```bash
# Set production secrets
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set JWT_SECRET
firebase functions:secrets:set RAPIDTRIAGE_API_TOKEN

# List secrets
firebase functions:secrets:list

# Access in code
import { defineSecret } from 'firebase-functions/params';
const stripeKey = defineSecret('STRIPE_SECRET_KEY');
```

### Files That Must Be Gitignored

```gitignore
# Environment files
.env
.env.local
.env.*.local
*.env

# Credentials
credentials.json
service-account*.json
*-credentials.json
*.pem
*.key

# IDE/Editor secrets
.idea/
.vscode/settings.json

# Test credentials
.env.test
```

---

## Dependency Management

### Update Policy

| Dependency Type | Update Frequency | Approval Required |
|-----------------|-----------------|-------------------|
| Security patches | Immediate | No |
| Minor versions | Weekly | No |
| Major versions | Monthly | Yes (review breaking changes) |

### Audit Commands

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (safe fixes only)
npm audit fix

# Check outdated packages
npm outdated

# Update to latest (minor versions)
npx npm-check-updates -u --target minor
npm install

# Update to latest (all versions - review carefully)
npx npm-check-updates -u
npm install
```

### Override Vulnerable Transitive Dependencies

```json
{
  "overrides": {
    "vulnerable-package": "^fixed.version"
  }
}
```

---

## Authentication & Authorization

### Firebase Auth Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Always require authentication
    function isAuthenticated() {
      return request.auth != null;
    }

    // Verify resource ownership
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Admin check
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    // User documents
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);
      allow delete: if isAdmin();
    }
  }
}
```

### API Authentication

```typescript
// All API endpoints require authentication
app.use('/api/*', async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
```

### Rate Limiting

```typescript
// Implement rate limiting on all endpoints
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 100,      // 100 requests per minute
  keyGenerator: (req) => req.user?.uid || req.ip,
});
```

---

## Data Protection

### Sensitive Data Handling

| Data Type | Storage | Encryption | Retention |
|-----------|---------|------------|-----------|
| User credentials | Firebase Auth | At rest + transit | Until deletion |
| API keys | Hashed in Firestore | SHA-256 | Until revoked |
| Screenshots | Firebase Storage | At rest | 30 days default |
| Session data | Firestore | At rest | 24 hours |
| Logs | Cloud Logging | At rest | 30 days |

### Data Minimization

```typescript
// Only collect necessary data
interface UserProfile {
  uid: string;        // Required: identification
  email: string;      // Required: authentication
  plan: string;       // Required: feature access
  // ❌ Don't collect: phone, address, SSN, etc.
}

// Sanitize logs
logger.info('User action', {
  userId: user.uid,
  action: 'screenshot_captured',
  // ❌ Don't log: email, IP, user agent with PII
});
```

### CORS Policy

```typescript
const allowedOrigins = [
  'https://rapidtriage-me.web.app',
  'https://rapidtriage.me',
  'chrome-extension://*',  // Extension only
];

// Development only
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:*');
}
```

---

## Reporting Vulnerabilities

### Contact

Report security vulnerabilities to: **security@yarlis.com**

### Response Timeline

| Severity | Initial Response | Resolution Target |
|----------|-----------------|-------------------|
| Critical | 4 hours | 24 hours |
| High | 24 hours | 7 days |
| Moderate | 72 hours | 30 days |
| Low | 7 days | 90 days |

### Disclosure Policy

1. Report vulnerability privately
2. We acknowledge within response timeline
3. We investigate and develop fix
4. We release fix and notify reporter
5. Public disclosure after 90 days or when fix is deployed

---

## Security Audit Checklist

### Pre-Release Audit

- [ ] `npm audit` returns 0 high/critical vulnerabilities
- [ ] No secrets in source code (grep check)
- [ ] `.env` files are gitignored
- [ ] All tests pass
- [ ] TypeScript builds without errors
- [ ] Firestore rules reviewed
- [ ] Storage rules reviewed
- [ ] CORS configuration reviewed
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info

### Quarterly Review

- [ ] Rotate API keys and tokens
- [ ] Review Firebase Auth settings
- [ ] Audit Firestore access patterns
- [ ] Review Cloud Function permissions
- [ ] Check for unused dependencies
- [ ] Review error logs for security issues
- [ ] Update this security policy

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Owner:** YarlisAISolutions Security Team
