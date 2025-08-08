# Production Deployment

## Complete Step-by-Step Deployment Process

This guide documents the exact process used to deploy RapidTriageME to production at rapidtriage.me.

## Prerequisites Checklist

- [x] Node.js 18+ installed
- [x] Cloudflare account created
- [x] Domain registered (rapidtriage.me)
- [x] Git repository cloned
- [x] Chrome browser installed

## Step 1: Initial Setup

### 1.1 Clone Repository

```bash
# Clone the repository
git clone https://github.com/YarlisAISolutions/rapidtriageME.git
cd rapidtriageME

# Verify you're in the right directory
pwd
# Output: /Users/yarlis/Downloads/rapidtriageME
```

### 1.2 Install Dependencies

```bash
# Install project dependencies
npm install

# Install Cloudflare Wrangler globally
npm install -g wrangler@latest

# Verify installation
wrangler --version
# Output: 3.97.1
```

## Step 2: Environment Configuration

### 2.1 Create Environment File

```bash
# Create .env file from template
cp .env.example .env

# Edit the file
nano .env
```

Add the following configuration:

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=ed3fbe9532564f2f06ae772da689431a
CLOUDFLARE_ZONE_ID=dba0cbc72f7f0b7727fbdb6f4d6d7901

# Application Settings
BROWSER_TOOLS_PORT=1421
NODE_ENV=production

# Worker Settings
WORKER_NAME=rapidtriage-me
WORKER_ENV=production
```

### 2.2 Load Environment Variables

```bash
# Source the environment loader script
source ./scripts/01-load-env.sh

# Verify environment is loaded
echo $BROWSER_TOOLS_PORT
# Output: 1421
```

## Step 3: Cloudflare Authentication

### 3.1 OAuth Login (Recommended)

```bash
# Run OAuth login script
./scripts/03-oauth-login.sh

# This will output:
# ✅ Attempting to login via OAuth...
# ✅ Successfully logged in.
```

### 3.2 Verify Authentication

```bash
# Check authentication status
wrangler whoami

# Expected output:
# You are logged in with an OAuth Token
# Account ID: ed3fbe9532564f2f06ae772da689431a
# Email: your-email@example.com
```

## Step 4: Configure Wrangler

### 4.1 Update wrangler.toml

```bash
# Edit wrangler configuration
nano wrangler.toml
```

Ensure the following configuration:

```toml
name = "rapidtriage-me"
main = "src/worker.ts"
compatibility_date = "2024-12-12"
node_compat = true

[env.production]
name = "rapidtriage-production"
workers_dev = false
route = "rapidtriage.me/*"
zone_id = "dba0cbc72f7f0b7727fbdb6f4d6d7901"

[env.production.vars]
BROWSER_TOOLS_PORT = "1421"
ENVIRONMENT = "production"

[env.staging]
name = "rapidtriage-staging"
workers_dev = true

[env.staging.vars]
BROWSER_TOOLS_PORT = "1421"
ENVIRONMENT = "staging"
```

## Step 5: Local Testing

### 5.1 Run Local Server

```bash
# Start local development server
./scripts/02-test-local.sh

# This runs:
# npm run dev -- --port 1421

# Output:
# ⛅️ wrangler 3.97.1
# ⎔ Starting local server...
# [wrangler:inf] Ready on http://localhost:1421
```

### 5.2 Test Health Endpoint

```bash
# In a new terminal, test the health endpoint
curl http://localhost:1421/health

# Expected response:
{
  "status": "healthy",
  "serverPort": 1421,
  "version": "1.0.0",
  "timestamp": "2025-08-07T23:45:00.000Z"
}
```

## Step 6: Deploy to Staging

### 6.1 Deploy Staging Environment

```bash
# Deploy to staging first
wrangler deploy --env staging

# Output:
# ⛅️ Deploying to staging environment
# ✨ Compiled Worker successfully
# ✨ Uploading Worker bundle
# ✨ Worker deployed successfully
# ✨ https://rapidtriage-staging.sireesh-yarlagadda-d3f.workers.dev
```

### 6.2 Test Staging Deployment

```bash
# Test staging health endpoint
curl https://rapidtriage-staging.sireesh-yarlagadda-d3f.workers.dev/health

# Verify response
{
  "status": "healthy",
  "environment": "staging"
}
```

## Step 7: Configure DNS

### 7.1 Add DNS Records

```bash
# Run DNS configuration script
./scripts/05-add-dns-records.sh

# This creates AAAA records pointing to 100::
```

Manual DNS configuration via Cloudflare Dashboard:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (rapidtriage.me)
3. Go to DNS settings
4. Add the following records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| AAAA | @ | 100:: | Proxied |
| AAAA | www | 100:: | Proxied |
| CNAME | docs | yarlisaisolutions.github.io | Proxied |

### 7.2 Verify DNS Propagation

```bash
# Check DNS resolution
dig rapidtriage.me

# Check specific record types
dig AAAA rapidtriage.me
dig CNAME docs.rapidtriage.me

# Alternative check
nslookup rapidtriage.me
```

## Step 8: Deploy to Production

### 8.1 Production Deployment

```bash
# Deploy to production
wrangler deploy --env production

# Full command output:
⛅️ wrangler 3.97.1
⎔ Compiling Worker to JS bundle...
✨ Compiled Worker successfully
⎔ Uploading Worker bundle...
✨ Uploaded Worker bundle (1.2 MB)
⎔ Deploying to production environment...
✨ Worker deployed successfully
✨ Published rapidtriage-production
  https://rapidtriage.me
```

### 8.2 Alternative Deployment Method

```bash
# Using the deployment script
./scripts/04-deploy.sh production

# This script runs:
# 1. Loads environment variables
# 2. Builds the project
# 3. Deploys to specified environment
# 4. Verifies deployment
```

## Step 9: Verify Production Deployment

### 9.1 Test Production Endpoints

```bash
# Test main site
curl https://rapidtriage.me
# Should return HTML content

# Test health endpoint
curl https://rapidtriage.me/health
# Response:
{
  "status": "healthy",
  "serverPort": 1421,
  "environment": "production",
  "version": "1.0.0"
}

# Test API endpoint
curl https://rapidtriage.me/api/status
```

### 9.2 Browser Testing

1. Open Chrome browser
2. Navigate to https://rapidtriage.me
3. Open Developer Tools (F12)
4. Check Network tab for successful requests
5. Check Console for any errors

## Step 10: Deploy Documentation

### 10.1 Build Documentation

```bash
# Install MkDocs dependencies
pip install mkdocs mkdocs-material mkdocs-mermaid2-plugin

# Build documentation
mkdocs build

# Output:
# INFO - Building documentation...
# INFO - Cleaning site directory
# INFO - Documentation built to 'site'
```

### 10.2 Deploy to GitHub Pages

```bash
# Deploy documentation
mkdocs gh-deploy --force

# Output:
# INFO - Copying files to 'gh-pages' branch
# INFO - Pushing to GitHub...
# INFO - Documentation deployed to:
# https://yarlisaisolutions.github.io/rapidtriageME/
```

### 10.3 Configure Custom Domain for Docs

Add CNAME record in Cloudflare:

```bash
# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "docs",
    "content": "yarlisaisolutions.github.io",
    "ttl": 1,
    "proxied": false
  }'
```

## Step 11: Post-Deployment Tasks

### 11.1 Monitor Logs

```bash
# Stream production logs
wrangler tail --env production

# Filter for errors
wrangler tail --env production --format pretty | grep ERROR
```

### 11.2 Check Analytics

```bash
# View worker analytics
wrangler analytics --env production
```

### 11.3 Set Up Monitoring

```bash
# Create uptime monitor
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/healthchecks" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "Production Health Check",
    "type": "HTTPS",
    "address": "rapidtriage.me/health",
    "interval": 60,
    "retries": 2
  }'
```

## Complete Deployment Script

Here's the complete deployment process in a single script:

```bash
#!/bin/bash
# complete-deployment.sh

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting RapidTriageME Production Deployment${NC}"

# Step 1: Load environment
echo -e "${YELLOW}Loading environment variables...${NC}"
source ./scripts/01-load-env.sh

# Step 2: Authenticate with Cloudflare
echo -e "${YELLOW}Authenticating with Cloudflare...${NC}"
wrangler login

# Step 3: Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Step 4: Build project
echo -e "${YELLOW}Building project...${NC}"
npm run build

# Step 5: Test locally
echo -e "${YELLOW}Running local tests...${NC}"
npm test

# Step 6: Deploy to staging
echo -e "${YELLOW}Deploying to staging...${NC}"
wrangler deploy --env staging

# Step 7: Test staging
echo -e "${YELLOW}Testing staging deployment...${NC}"
STAGING_URL=$(wrangler deployments list --env staging | grep https | head -1)
curl -s "$STAGING_URL/health" | jq .

# Step 8: Deploy to production
echo -e "${YELLOW}Deploying to production...${NC}"
wrangler deploy --env production

# Step 9: Configure DNS
echo -e "${YELLOW}Configuring DNS records...${NC}"
./scripts/05-add-dns-records.sh

# Step 10: Verify production
echo -e "${YELLOW}Verifying production deployment...${NC}"
sleep 5
curl -s https://rapidtriage.me/health | jq .

# Step 11: Deploy documentation
echo -e "${YELLOW}Deploying documentation...${NC}"
mkdocs gh-deploy --force

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "Production URL: https://rapidtriage.me"
echo -e "Documentation: https://docs.rapidtriage.me"
echo -e "Health Check: https://rapidtriage.me/health"
```

## Troubleshooting

### Authentication Issues

```bash
# If authentication fails:
# 1. Clear all environment variables
unset CLOUDFLARE_API_TOKEN
unset CF_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID

# 2. Remove wrangler config
rm -rf ~/.wrangler

# 3. Re-authenticate
wrangler login
```

### Deployment Failures

```bash
# Check error details
wrangler deploy --env production --dry-run

# View detailed logs
wrangler tail --env production --format json

# Rollback if needed
wrangler rollback --env production
```

### DNS Issues

```bash
# Force DNS refresh
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Success Indicators

✅ **All checks passed:**
- [ ] Local server runs on port 1421
- [ ] Staging deployment accessible
- [ ] Production deployment live at rapidtriage.me
- [ ] Health endpoint returns 200 OK
- [ ] DNS records properly configured
- [ ] Documentation deployed to GitHub Pages
- [ ] Custom docs domain working (docs.rapidtriage.me)
- [ ] Chrome extension connects to server
- [ ] No errors in production logs

## Maintenance Commands

```bash
# View current deployment
wrangler deployments list --env production

# Check worker status
wrangler status --env production

# Update deployment
git pull
npm install
wrangler deploy --env production

# Monitor performance
wrangler analytics --env production --date 2025-08-07
```

## Summary

This production deployment process ensures:
- ✅ Secure OAuth authentication
- ✅ Proper environment configuration
- ✅ Staging validation before production
- ✅ Custom domain with SSL
- ✅ Comprehensive documentation
- ✅ Monitoring and logging
- ✅ Rollback capability

Total deployment time: **~10 minutes**

For support, visit [docs.rapidtriage.me](https://docs.rapidtriage.me) or open an issue on [GitHub](https://github.com/YarlisAISolutions/rapidtriageME/issues).