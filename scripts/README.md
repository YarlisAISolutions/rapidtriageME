# RapidTriageME Scripts Directory

This directory contains all the automation scripts for building, testing, and deploying the RapidTriageME platform.

## 📋 Scripts Overview

All scripts are numbered in the order they should typically be executed for a complete deployment workflow.

### 01-load-env.sh
**Purpose**: Load environment variables from the `.env` file  
**Usage**: `source ./scripts/01-load-env.sh`  
**When to use**: Before running any script that requires environment variables (API tokens, etc.)

```bash
# Load environment variables
source ./scripts/01-load-env.sh
```

---

### 02-test-local.sh
**Purpose**: Build and test all components locally  
**Usage**: `./scripts/02-test-local.sh`  
**When to use**: Before deployment to verify everything builds and runs correctly

```bash
# Run local tests
./scripts/02-test-local.sh
```

**What it does**:
- Cleans previous builds
- Installs dependencies for all components
- Builds TypeScript code
- Verifies build output
- Tests server startup on port 1421
- Validates Chrome extension files

---

### 03-oauth-login.sh
**Purpose**: Clear API tokens and login to Cloudflare via OAuth  
**Usage**: `./scripts/03-oauth-login.sh`  
**When to use**: When you need to authenticate with Cloudflare for deployments

```bash
# Login to Cloudflare
./scripts/03-oauth-login.sh
```

**Note**: This script clears any existing API tokens and initiates OAuth login via browser

---

### 04-deploy.sh
**Purpose**: Deploy the application to Cloudflare Workers  
**Usage**: `./scripts/04-deploy.sh`  
**When to use**: To deploy to staging and/or production environments

```bash
# Deploy to Cloudflare
./scripts/04-deploy.sh
```

**What it does**:
- Checks Cloudflare authentication
- Installs dependencies
- Builds the project
- Creates/checks KV namespace
- Deploys to staging first
- Optionally deploys to production (with confirmation)

**Deployment URLs**:
- Staging: `https://rapidtriage-staging.[your-subdomain].workers.dev`
- Production: `https://rapidtriage.me` (if domain configured)

---

### 05-add-dns-records.sh
**Purpose**: Configure DNS records for rapidtriage.me domain  
**Usage**: `./scripts/05-add-dns-records.sh`  
**When to use**: After adding the domain to Cloudflare, to set up DNS routing

```bash
# Add DNS records
./scripts/05-add-dns-records.sh
```

**What it does**:
- Adds AAAA records for root domain (@) and www subdomain
- Configures Cloudflare proxy (orange cloud)
- Routes traffic to the Worker

**Note**: Requires the domain to be added to your Cloudflare account first

---

### 06-publish-packages.sh
**Purpose**: Publish npm packages to registry  
**Usage**: `./scripts/06-publish-packages.sh`  
**When to use**: When releasing new versions of the MCP server or browser connector

```bash
# Publish packages
./scripts/06-publish-packages.sh
```

**Packages published**:
- `@yarlis/rapidtriage-server` - Browser connector server
- `@yarlis/rapidtriage-mcp` - MCP protocol server

---

## 🚀 Complete Deployment Workflow

For a complete deployment from scratch:

```bash
# 1. Load environment variables
source ./scripts/01-load-env.sh

# 2. Test everything locally
./scripts/02-test-local.sh

# 3. Login to Cloudflare (if needed)
./scripts/03-oauth-login.sh

# 4. Deploy to Cloudflare
./scripts/04-deploy.sh

# 5. Configure DNS (if using custom domain)
./scripts/05-add-dns-records.sh

# 6. Publish packages (optional, for npm release)
./scripts/06-publish-packages.sh
```

## 🔧 Configuration

### Environment Variables (.env)
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
ZONE_ID=your_zone_id
AUTH_TOKEN=your_auth_token
JWT_SECRET=your_jwt_secret
```

### Port Configuration
- Default server port: **1421**
- Configurable via `BROWSER_TOOLS_PORT` environment variable

### Domain Configuration
- Production: `rapidtriage.me`
- Workers.dev fallback available
- Configure in `wrangler.toml`

## 📝 Notes

1. **Authentication**: Scripts will use OAuth login if no API token is set
2. **Permissions**: All scripts should be executable (`chmod +x`)
3. **Dependencies**: Requires Node.js 18+, npm, and wrangler CLI
4. **DNS Propagation**: After adding DNS records, wait 5-10 minutes for propagation

## 🐛 Troubleshooting

### Script not executable
```bash
chmod +x ./scripts/*.sh
```

### Environment variables not loading
```bash
# Make sure .env file exists
cat ../.env

# Source the load-env script
source ./scripts/01-load-env.sh
```

### Deployment fails with auth error
```bash
# Clear tokens and re-login
unset CLOUDFLARE_API_TOKEN
./scripts/03-oauth-login.sh
```

### DNS not resolving
```bash
# Check DNS propagation
nslookup rapidtriage.me 1.1.1.1

# Flush local DNS cache (macOS)
sudo dscacheutil -flushcache
```

## 📂 Project Structure

```
scripts/
├── README.md                 # This file
├── 01-load-env.sh           # Environment variable loader
├── 02-test-local.sh         # Local testing script
├── 03-oauth-login.sh        # Cloudflare OAuth login
├── 04-deploy.sh             # Deployment script
├── 05-add-dns-records.sh    # DNS configuration
└── 06-publish-packages.sh   # NPM package publishing
```

---

Last Updated: August 2025  
Port Configuration: 1421  
Platform: RapidTriageME - YarlisAISolutions