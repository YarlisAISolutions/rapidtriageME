# Complete Deployment Guide

## Overview

This guide covers the complete deployment process for RapidTriageME, including all components, testing, and production deployment.

## Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests passing (`node test-lifecycle.js`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Documentation updated
- [ ] Changelog updated

### ✅ Configuration
- [ ] Environment variables set
- [ ] API keys configured
- [ ] Domain settings verified
- [ ] SSL certificates ready

## Step 1: Run Complete Test Suite

```bash
# Run full test suite
node test-lifecycle.js

# Verify all tests pass (should show 41/41 passed)
# Review test report at reports/test-report-*.html
```

Expected output:
```
✅ All tests completed successfully!
📊 Tests Passed: 41/41 (100%)
```

## Step 2: Build Production Assets

```bash
# Build main application
npm run build

# Build Chrome extension
cd rapidtriage-extension
npm run build
cd ..

# Build documentation site
mkdocs build
```

## Step 3: Git Commit and Push

### Commit All Changes

```bash
# Check status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add comprehensive test suite with visual reporting

- Implemented 41+ automated tests with 100% pass rate
- Added real-time progress tracking
- Created HTML reports with screenshot capture
- Enhanced test reporting with expected vs actual results
- Updated documentation with test suite details"

# Push to main branch
git push origin main
```

### Create Release Tag

```bash
# Create version tag
git tag -a v2.0.0 -m "Release v2.0.0 - Enhanced Test Suite"

# Push tag
git push origin v2.0.0
```

## Step 4: Deploy to Cloudflare

### Deploy Worker

```bash
# Deploy to production
npm run deploy:production

# Or use wrangler directly
wrangler deploy --env production
```

Expected output:
```
Published rapidtriage-me (production)
  https://api.rapidtriage.me/*
  https://rapidtriage-me.yarlis-ai-solutions.workers.dev/*
```

### Verify Deployment

```bash
# Check production health
curl https://api.rapidtriage.me/health

# Run tests against production
TEST_URL=https://api.rapidtriage.me node test-lifecycle.js
```

## Step 5: Deploy Documentation

### Build and Deploy Docs

```bash
# Build documentation
mkdocs build

# Deploy to GitHub Pages
mkdocs gh-deploy

# Or deploy to custom domain
rsync -avz site/ user@server:/var/www/docs.rapidtriage.me/
```

### Verify Documentation

- Visit: https://docs.rapidtriage.me
- Check all pages load correctly
- Verify search functionality
- Test code examples

## Step 6: Deploy Chrome Extension

### Package Extension

```bash
cd rapidtriage-extension

# Create production build
npm run build:production

# Package extension
zip -r rapidtriage-extension.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "src/*" \
  -x "*.md"
```

### Publish to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Click "New Item"
3. Upload `rapidtriage-extension.zip`
4. Fill in listing details:
   - Title: RapidTriageME - AI Browser Debugger
   - Description: AI-powered browser debugging platform
   - Category: Developer Tools
   - Screenshots (at least 1280x800)
5. Set visibility to "Public"
6. Submit for review

## Step 7: Update DNS and SSL

### Configure DNS Records

```bash
# A Records
api.rapidtriage.me    → Cloudflare Worker
docs.rapidtriage.me   → Documentation server
app.rapidtriage.me    → Main application

# CNAME Records
www.rapidtriage.me    → rapidtriage.me
```

### SSL Configuration

Cloudflare automatically handles SSL for:
- Worker endpoints
- Custom domains
- Subdomains

Verify SSL:
```bash
# Check SSL certificate
openssl s_client -connect api.rapidtriage.me:443 -servername api.rapidtriage.me
```

## Step 8: Monitor Deployment

### Set Up Monitoring

```bash
# Health check monitoring
curl -X POST https://api.uptimerobot.com/v2/newMonitor \
  -d "api_key=YOUR_KEY" \
  -d "friendly_name=RapidTriageME API" \
  -d "url=https://api.rapidtriage.me/health" \
  -d "type=1"
```

### Check Metrics

```bash
# View Cloudflare analytics
wrangler tail --env production

# Check error logs
wrangler tail --env production --status error
```

## Step 9: Post-Deployment Testing

### Smoke Tests

```bash
# Test main endpoints
curl https://api.rapidtriage.me/health
curl https://api.rapidtriage.me/metrics
curl https://api.rapidtriage.me/api-docs

# Test authentication
curl -X POST https://api.rapidtriage.me/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick \
  --count 10 \
  --num 100 \
  https://api.rapidtriage.me/health
```

## Step 10: Update Public Resources

### Update README

```markdown
## 🚀 Latest Release: v2.0.0

### What's New
- ✅ Comprehensive test suite with 41+ automated tests
- 📊 Real-time progress tracking
- 📸 Visual test reports with screenshots
- 🎯 Enhanced error handling
```

### Update Changelog

```markdown
## [2.0.0] - 2025-08-12

### Added
- Comprehensive automated test suite
- Real-time test progress indicators
- Visual HTML test reports
- Screenshot capture for failed tests
- Expected vs actual result comparison

### Enhanced
- Test coverage to 100%
- Documentation with test suite details
- Error handling and validation
```

## Deployment Scripts

### Complete Deployment Script

Create `deploy-all.sh`:

```bash
#!/bin/bash

echo "🚀 Starting RapidTriageME Complete Deployment"

# Step 1: Run tests
echo "📊 Running test suite..."
node test-lifecycle.js
if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Aborting deployment."
  exit 1
fi

# Step 2: Build
echo "🔨 Building production assets..."
npm run build

# Step 3: Deploy Worker
echo "☁️ Deploying to Cloudflare..."
npm run deploy:production

# Step 4: Deploy Docs
echo "📚 Deploying documentation..."
mkdocs gh-deploy

# Step 5: Verify
echo "✅ Verifying deployment..."
curl -s https://api.rapidtriage.me/health | jq .

echo "🎉 Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy-all.sh
./deploy-all.sh
```

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous version
wrangler rollback --env production

# Or deploy specific version
git checkout v1.9.0
npm run deploy:production
```

### Full Rollback

```bash
# Revert git commits
git revert HEAD
git push origin main

# Redeploy previous version
git checkout tags/v1.9.0
npm run deploy:production
```

## Environment-Specific Deployments

### Staging Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Test staging
TEST_URL=https://staging.rapidtriage.me node test-lifecycle.js
```

### Development Deployment

```bash
# Deploy to dev environment
npm run deploy:dev

# Run with local overrides
npm run dev -- --port 3025
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: node test-lifecycle.js

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: production
```

## Troubleshooting Deployment

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. **Deployment Failures**
   ```bash
   # Check wrangler configuration
   wrangler whoami
   wrangler deploy --dry-run
   ```

3. **DNS Issues**
   ```bash
   # Verify DNS propagation
   dig api.rapidtriage.me
   nslookup api.rapidtriage.me
   ```

4. **SSL Issues**
   - Enable Cloudflare SSL
   - Set SSL mode to "Full (strict)"
   - Clear browser cache

## Success Criteria

Deployment is successful when:

- ✅ All tests pass in production
- ✅ Health endpoint returns 200
- ✅ Documentation is accessible
- ✅ Chrome extension is published
- ✅ SSL certificates are valid
- ✅ Monitoring shows no errors
- ✅ Load tests pass

## Next Steps

After successful deployment:

1. **Monitor Performance**
   - Set up alerts
   - Review analytics
   - Track error rates

2. **Gather Feedback**
   - User testing
   - Performance metrics
   - Bug reports

3. **Plan Next Release**
   - Feature roadmap
   - Performance improvements
   - Security updates

## Support

For deployment assistance:

- 📖 [Documentation](https://docs.rapidtriage.me)
- 🐛 [GitHub Issues](https://github.com/YarlisAISolutions/rapidtriageME/issues)
- 💬 [Discord Support](https://discord.gg/rapidtriage)