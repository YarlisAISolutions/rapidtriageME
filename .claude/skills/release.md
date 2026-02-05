# Release Manager - CI/CD Pipeline

<command-name>release</command-name>

<description>
Comprehensive release engineering skill for RapidTriageME platform. Acts as a release manager with Q&A workflow, handles package upgrades, test verification, backups, builds, database migrations, documentation, API deployment, webhooks, and post-deployment validation.
</description>

<usage>
/release [environment] [options]

Environments:
  staging              Deploy to staging/preview environment
  production           Deploy to production (requires confirmation)

Options:
  --dry-run            Show what would be deployed without executing
  --skip-tests         Skip test execution (not recommended)
  --skip-backup        Skip backup stage
  --only=STAGE         Run only specific stage (packages|tests|backup|build|db|docs|static|api|webhooks|verify)
  --from=STAGE         Start from specific stage
  --version=X.X.X      Set release version explicitly
  --force              Skip confirmations (use with caution)
</usage>

<instructions>
## Release Manager Workflow

When the user invokes `/release`, act as a Release Manager and follow this comprehensive pipeline:

---

### STAGE 0: Release Interview (Q&A)

Ask the user these questions before proceeding:

**Question 1: Release Target**
- What environment are you deploying to? (staging/production)

**Question 2: Release Scope**
- What components are included in this release?
  - [ ] Functions/API
  - [ ] Database (Firestore rules/indexes)
  - [ ] Static Hosting
  - [ ] Documentation
  - [ ] Webhooks
  - [ ] Mobile App (RapidTriageMobile)
  - [ ] MCP Server (@yarlis/rapidtriage-mcp)
  - [ ] Chrome Extension
  - [ ] All of the above

**Question 3: Release Type**
- What type of release is this?
  - Patch (bug fixes) - e.g., 1.0.0 -> 1.0.1
  - Minor (new features) - e.g., 1.0.0 -> 1.1.0
  - Major (breaking changes) - e.g., 1.0.0 -> 2.0.0

**Question 4: Features Included**
- List the features/changes in this release (for changelog)

**Question 5: Database Changes**
- Are there any database schema changes or migrations needed?
  - New Firestore collections?
  - Index updates?
  - Security rule changes?

**Question 6: Breaking Changes**
- Are there any breaking changes that require user communication?

---

### STAGE 1: Pre-Flight Checks

```bash
# Verify CLI tools are authenticated
firebase login:list
gcloud auth list
gh auth status

# Check for uncommitted changes
git status

# Verify Node.js version
node --version  # Must be >= 18.0.0

# Verify current branch
git branch --show-current

# Check remote connection
git remote -v
```

**Report:**
- CLI Authentication Status
- Git Status (clean/dirty)
- Current Branch
- Node.js Version
- Any blockers identified

---

### STAGE 2: Package Upgrades

Run `npm outdated` and upgrade packages in order:

**2.1 Functions Directory**
```bash
cd /Users/yarlis/Continuum/rapidtriageME/functions
npm outdated
npx npm-check-updates -u
npm install
npm run build
```

**2.2 Root Directory**
```bash
cd /Users/yarlis/Continuum/rapidtriageME
npm outdated
npx npm-check-updates -u
npm install
```

**2.3 MCP Server**
```bash
cd /Users/yarlis/Continuum/rapidtriageME/rapidtriage-mcp
npm outdated
npx npm-check-updates -u
npm install
npm run build
```

**2.4 Browser Server**
```bash
cd /Users/yarlis/Continuum/rapidtriageME/rapidtriage-server
npm outdated
npx npm-check-updates -u
npm install
```

**2.5 Mobile App (use minor for Expo compatibility)**
```bash
cd /Users/yarlis/Continuum/rapidtriageME/RapidTriageMobile
npm outdated
npx npm-check-updates -u --target minor
npm install
```

**Report:**
- Packages upgraded (from -> to versions)
- Any breaking changes detected
- Dependency audit results

---

### STAGE 3: Test Execution & Coverage

**3.1 Run Functions Tests**
```bash
cd /Users/yarlis/Continuum/rapidtriageME/functions
npm run test:coverage
```

**3.2 Parse Coverage Report**
Extract from Jest output:
- Total Test Suites
- Total Tests Passed/Failed/Skipped
- Coverage Percentages (branches, functions, lines, statements)

**3.3 Coverage Requirements**
- Target: 90%+ coverage
- If below 90%, identify uncovered files and report

**3.4 Generate Test Summary Report**

```
============================================
         TEST EXECUTION SUMMARY
============================================

Test Suites:
  - auth.test.ts            [PASS] 20 tests
  - health.test.ts          [PASS] 12 tests
  - rateLimit.test.ts       [PASS] 19 tests
  - cors.test.ts            [PASS] 26 tests
  - session.service.test.ts [PASS] 25 tests
  - screenshot.service.test.ts [PASS] 21 tests
  - captureScreenshot.test.ts [PASS] 33 tests
  - aggregateMetrics.test.ts [PASS] 20 tests

Coverage:
  - Branches:   XX.XX%
  - Functions:  XX.XX%
  - Lines:      XX.XX%
  - Statements: XX.XX%

Result: [PASS/FAIL] (90% threshold)
============================================
```

---

### STAGE 4: Backup & Version Control

**4.1 GitHub Backup**
```bash
cd /Users/yarlis/Continuum/rapidtriageME
git add -A
git status
git commit -m "chore: pre-release backup v${VERSION}"
git push origin main
```

**4.2 Cloudflare Backup (Legacy Disaster Recovery)**
```bash
# Backup current wrangler configs
cp .cloudflare-backup/wrangler.toml .cloudflare-backup/wrangler.toml.bak.$(date +%Y%m%d)
```

**4.3 Firestore Data Export (Production Only)**
```bash
gcloud firestore export gs://rapidtriage-me.firebasestorage.app/backups/$(date +%Y%m%d_%H%M%S) \
  --project=rapidtriage-me
```

**4.4 Create Version Tag**
```bash
git tag -a v${VERSION} -m "Release v${VERSION}"
git push origin v${VERSION}
```

---

### STAGE 5: Build

**5.1 Build Functions**
```bash
cd /Users/yarlis/Continuum/rapidtriageME/functions
npm run clean
npm run build
```

**5.2 Type Checking**
```bash
cd /Users/yarlis/Continuum/rapidtriageME
npm run typecheck
```

**5.3 Lint**
```bash
npm run lint
```

**5.4 Build MCP Server**
```bash
cd /Users/yarlis/Continuum/rapidtriageME/rapidtriage-mcp
npm run build
```

**Report:**
- Build Status (success/failure)
- TypeScript Errors (if any)
- Lint Warnings/Errors

---

### STAGE 6: Database & Migrations

**6.1 Validate Firestore Rules**
```bash
firebase firestore:rules:validate --project rapidtriage-me
```

**6.2 Deploy Firestore Indexes**
```bash
firebase deploy --only firestore:indexes --project rapidtriage-me
```

**6.3 Deploy Firestore Rules**
```bash
firebase deploy --only firestore:rules --project rapidtriage-me
```

**6.4 Deploy Storage Rules**
```bash
firebase deploy --only storage:rules --project rapidtriage-me
```

**6.5 Run Migrations (if applicable)**
If user indicated migrations needed:
```bash
# Execute migration scripts from /scripts/migrations/
node scripts/migrations/migrate-${VERSION}.js
```

**Report:**
- Rules validation status
- Indexes deployed
- Migration execution results

---

### STAGE 7: Documentation

**7.1 Update API Documentation**
```bash
# Swagger/OpenAPI is auto-generated from code
# Verify endpoint: /api-docs
```

**7.2 Build MkDocs Documentation**
```bash
cd /Users/yarlis/Continuum/rapidtriageME
pip install mkdocs mkdocs-material
mkdocs build --config-file mkdocs.yml
```

**7.3 Deploy Docs to GitHub Pages**
```bash
mkdocs gh-deploy --config-file mkdocs.yml
```

**7.4 Update CHANGELOG.md**
Add release notes with:
- Version number
- Release date
- Features added
- Bugs fixed
- Breaking changes

---

### STAGE 8: Static Assets & Hosting

**8.1 Prepare Hosting Directory**
```bash
mkdir -p dist/public
# Copy static assets if any
```

**8.2 Deploy to Firebase Hosting**
```bash
# Staging
firebase hosting:channel:deploy staging --project rapidtriage-me --expires 7d

# Production
firebase deploy --only hosting --project rapidtriage-me
```

**Report:**
- Hosting URL
- Preview URL (staging)
- Cache invalidation status

---

### STAGE 9: API & Functions Deployment

**9.1 Deploy Functions**
```bash
# Staging (uses preview channel)
firebase functions:config:set env.stage="staging"
firebase deploy --only functions --project rapidtriage-me

# Production
firebase functions:config:set env.stage="production"
firebase deploy --only functions --project rapidtriage-me
```

**9.2 Verify Function Deployment**
```bash
firebase functions:list --project rapidtriage-me
```

**Functions Deployed:**
- health
- status
- metrics
- auth
- api
- apiDocs
- stripeWebhook
- connectWebhook
- createApiKey
- revokeApiKey
- captureScreenshot
- createCheckoutSession
- createPortalSession
- getSubscription
- cancelSubscription
- reactivateSubscription
- cleanupExpiredScreenshots
- cleanupExpiredSessions
- aggregateMetrics
- onScreenshotCreated
- onUserCreated

---

### STAGE 10: Webhook Verification

**10.1 Verify Stripe Webhook**
```bash
# Check webhook endpoint is accessible
curl -X POST https://rapidtriage-me.web.app/stripeWebhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**10.2 Verify Connect Webhook**
```bash
curl -X POST https://rapidtriage-me.web.app/connectWebhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**10.3 Stripe Dashboard Verification**
- Remind user to verify webhook endpoints in Stripe Dashboard
- Check webhook signing secret is configured

---

### STAGE 11: Post-Deployment Verification

**11.1 Health Check**
```bash
curl -s https://rapidtriage-me.web.app/health | jq .
```

**11.2 API Smoke Tests**
```bash
# Test core endpoints
curl -s https://rapidtriage-me.web.app/health
curl -s https://rapidtriage-me.web.app/metrics
curl -s https://rapidtriage-me.web.app/api-docs
```

**11.3 View Function Logs**
```bash
firebase functions:log --project rapidtriage-me --limit 50
```

**11.4 Monitor for Errors**
```bash
firebase functions:log --project rapidtriage-me --only api --severity ERROR
```

**Verification Checklist:**
- [ ] Health endpoint returns 200
- [ ] Metrics endpoint accessible
- [ ] API docs loading
- [ ] No errors in function logs
- [ ] Firestore connection working
- [ ] Storage connection working

---

### STAGE 12: Release Finalization

**12.1 Create GitHub Release**
```bash
gh release create v${VERSION} \
  --title "Release v${VERSION}" \
  --notes-file RELEASE_NOTES.md \
  --target main
```

**12.2 Update Version Numbers**
Update package.json versions in:
- /functions/package.json
- /rapidtriage-mcp/package.json
- /RapidTriageMobile/package.json
- /rapidtriage-server/package.json
- /package.json

**12.3 Generate Release Summary**

```
============================================
         RELEASE SUMMARY
============================================

Version: v${VERSION}
Environment: ${ENVIRONMENT}
Date: $(date)

Deployed Components:
  [x] Firebase Functions (23 functions)
  [x] Firebase Hosting
  [x] Firestore Rules & Indexes
  [x] Storage Rules
  [x] Documentation

Test Results:
  Total Tests: XXX
  Passed: XXX
  Failed: 0
  Coverage: XX.XX%

Endpoints:
  Health: https://rapidtriage-me.web.app/health
  API Docs: https://rapidtriage-me.web.app/api-docs
  Metrics: https://rapidtriage-me.web.app/metrics

GitHub:
  Release: https://github.com/YarlisAISolutions/rapidtriageME/releases/tag/v${VERSION}
  Commit: ${COMMIT_SHA}

============================================
```

---

## Rollback Procedure

If deployment fails, execute rollback:

```bash
# View recent deployments
firebase hosting:releases:list --project rapidtriage-me

# Rollback hosting to previous version
firebase hosting:rollback --project rapidtriage-me

# Rollback functions (redeploy previous version)
git checkout v${PREVIOUS_VERSION}
cd functions && npm run build
firebase deploy --only functions --project rapidtriage-me

# Restore Firestore backup
gcloud firestore import gs://rapidtriage-me.firebasestorage.app/backups/${BACKUP_DATE} \
  --project=rapidtriage-me
```

---

## Important Notes

### Breaking Change Handling
| Package | Notes |
|---------|-------|
| firebase-functions 7.x | Uses v2 function patterns |
| firebase-admin 13.x | Check Auth API changes |
| express 5.x | Test all routes carefully |
| @modelcontextprotocol/sdk 1.x | Protocol changes from 0.x |

### Required Secrets
Verify these are set in Firebase:
```bash
firebase functions:secrets:access AUTH_TOKEN
firebase functions:secrets:access JWT_SECRET
firebase functions:secrets:access RAPIDTRIAGE_API_TOKEN
```

### Monitoring URLs
- Firebase Console: https://console.firebase.google.com/project/rapidtriage-me
- Cloud Logging: https://console.cloud.google.com/logs?project=rapidtriage-me
- Stripe Dashboard: https://dashboard.stripe.com

</instructions>

<examples>
User: /release
Assistant: Starting Release Manager interview...

**Question 1:** What environment are you deploying to?
1. Staging (preview)
2. Production

User: production
Assistant: **Question 2:** What components are included in this release?
[Shows component checklist]

User: /release staging --dry-run
Assistant: Running dry-run deployment to staging...
[Shows what would be deployed without executing]

User: /release production --only=tests
Assistant: Running only the test stage...
[Executes tests and shows coverage report]
</examples>
