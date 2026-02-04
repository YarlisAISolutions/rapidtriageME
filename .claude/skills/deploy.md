---
name: deploy
description: One-click deployment of RapidTriageME to Firebase
user_invocable: true
arguments:
  - name: environment
    description: Target environment (production, staging, development)
    required: false
    default: production
  - name: target
    description: Deployment target (all, functions, hosting, rules, firestore, storage)
    required: false
    default: all
---

# Deploy Skill - RapidTriageME Firebase Deployment

Deploy RapidTriageME to Firebase with a single command. This skill handles the complete deployment lifecycle including pre-flight checks, building, and deployment verification.

## Usage

```
/deploy                          # Deploy all to production (default)
/deploy production               # Deploy all to production
/deploy staging                  # Deploy all to staging
/deploy production functions     # Deploy only functions to production
/deploy production hosting       # Deploy only hosting to production
/deploy production rules         # Deploy firestore and storage rules
```

## Execution Instructions

When this skill is invoked, execute the following steps:

### Step 1: Parse Arguments

```
Environment: {{ environment | default: "production" }}
Target: {{ target | default: "all" }}
```

### Step 2: Pre-flight Checks

Run these checks before deployment:

1. **Verify Firebase CLI is installed and authenticated**
```bash
firebase --version && firebase projects:list --limit 1
```

2. **Verify Java 21+ is available** (required for functions build)
```bash
java -version 2>&1 | head -1
```

3. **Check for uncommitted changes** (warn if present)
```bash
git status --porcelain
```

4. **Run TypeScript type checking**
```bash
cd functions && npm run build 2>&1
```

### Step 3: Set Environment Configuration

For each environment, use the appropriate Firebase project:

| Environment | Project ID | Description |
|-------------|------------|-------------|
| production | rapidtriage-me | Live production environment |
| staging | rapidtriage-me-staging | Pre-production testing (if configured) |
| development | rapidtriage-me-dev | Development testing (if configured) |

**Note**: If staging/development projects are not configured, default to production with appropriate warnings.

### Step 4: Execute Deployment

Run the deployment script based on target:

```bash
# Set Java path for Firebase
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"

# Execute deployment
cd /Users/yarlis/Continuum/rapidtriageME
./scripts/deploy-firebase.sh {{ target }}
```

Or use direct Firebase commands:

**All services:**
```bash
firebase deploy --project rapidtriage-me
```

**Functions only:**
```bash
firebase deploy --only functions --project rapidtriage-me
```

**Hosting only:**
```bash
firebase deploy --only hosting --project rapidtriage-me
```

**Rules only:**
```bash
firebase deploy --only firestore:rules,storage:rules --project rapidtriage-me
```

### Step 5: Post-deployment Verification

After deployment, verify the deployment was successful:

1. **Health check**
```bash
curl -s https://rapidtriage-me.web.app/health | head -20
```

2. **View recent function logs**
```bash
firebase functions:log --limit 10 --project rapidtriage-me
```

3. **Report deployment URLs**

| Service | URL |
|---------|-----|
| Hosting | https://rapidtriage-me.web.app |
| API Docs | https://rapidtriage-me.web.app/api-docs |
| Health | https://rapidtriage-me.web.app/health |
| Console | https://console.firebase.google.com/project/rapidtriage-me |

### Step 6: Rollback Instructions (if needed)

If deployment fails, provide rollback options:

```bash
# List previous function versions
firebase functions:list --project rapidtriage-me

# Rollback to previous hosting version
firebase hosting:clone rapidtriage-me:live rapidtriage-me:rollback
```

## Error Handling

| Error | Resolution |
|-------|------------|
| "Not logged in" | Run `firebase login` |
| "Permission denied" | Verify Firebase project access |
| "Build failed" | Check TypeScript errors in functions/src |
| "Function timeout" | Review function memory/timeout settings |
| "Quota exceeded" | Check Firebase billing/quotas |

## Environment Variables Required

Ensure these secrets are set in Firebase:
- `RAPIDTRIAGE_API_TOKEN` - API authentication token
- `AUTH_TOKEN` - General auth token
- `JWT_SECRET` - JWT signing secret
- `KEYCLOAK_CLIENT_SECRET` - Keycloak integration (if used)

Set secrets with:
```bash
firebase functions:secrets:set SECRET_NAME --project rapidtriage-me
```

## Deployment Checklist

Before deploying to production, verify:

- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] No uncommitted changes in git
- [ ] Version numbers updated if needed
- [ ] CHANGELOG updated for significant changes
- [ ] Security rules reviewed

## Success Output

On successful deployment, report:
- Deployment timestamp
- Services deployed
- URLs for verification
- Any warnings or notes
