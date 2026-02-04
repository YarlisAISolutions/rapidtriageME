#!/bin/bash

# RapidTriageME Complete Deployment Script
# Version: 2.0.0
# Description: Automated deployment with testing, building, and verification

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Header
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🚀 RapidTriageME Complete Deployment v2.0.0          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Pre-deployment checks
log_info "Step 1: Running pre-deployment checks..."

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    log_warning "You have uncommitted changes. Commit them first? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        git add .
        echo "Enter commit message:"
        read -r commit_msg
        git commit -m "$commit_msg"
    else
        log_error "Deployment cancelled. Please commit your changes first."
        exit 1
    fi
fi

# Step 2: Run tests
log_info "Step 2: Running complete test suite..."
if node test-lifecycle.js; then
    log_success "All tests passed!"
else
    log_error "Tests failed. Aborting deployment."
    exit 1
fi

# Step 3: Build production assets
log_info "Step 3: Building production assets..."

# Build main application
log_info "Building main application..."
npm run build

# Build Chrome extension if it exists
if [ -d "rapidtriage-extension" ]; then
    log_info "Building Chrome extension..."
    cd rapidtriage-extension
    npm run build 2>/dev/null || true
    cd ..
fi

# Build documentation
log_info "Building documentation site..."
mkdocs build --quiet

log_success "Build completed!"

# Step 4: Deploy to Cloudflare
log_info "Step 4: Deploying to Cloudflare Workers..."

# Check if we should deploy to production or staging
echo "Deploy to production or staging? (p/s)"
read -r env_choice

if [[ "$env_choice" == "p" ]]; then
    log_info "Deploying to PRODUCTION..."
    npm run deploy:production
    DEPLOY_URL="https://api.rapidtriage.me"
else
    log_info "Deploying to STAGING..."
    npm run deploy:staging 2>/dev/null || wrangler deploy --env staging
    DEPLOY_URL="https://staging.rapidtriage.me"
fi

# Step 5: Verify deployment
log_info "Step 5: Verifying deployment..."

# Wait for deployment to propagate
sleep 5

# Check health endpoint
if curl -s "$DEPLOY_URL/health" | grep -q "healthy"; then
    log_success "Deployment verified - API is healthy!"
else
    log_error "Deployment verification failed!"
    log_warning "Check manually: $DEPLOY_URL/health"
fi

# Step 6: Deploy documentation (optional)
log_info "Deploy documentation to GitHub Pages? (y/n)"
read -r docs_response

if [[ "$docs_response" == "y" ]]; then
    log_info "Deploying documentation..."
    mkdocs gh-deploy --force
    log_success "Documentation deployed to GitHub Pages!"
fi

# Step 7: Create release tag (optional)
log_info "Create a release tag? (y/n)"
read -r tag_response

if [[ "$tag_response" == "y" ]]; then
    echo "Enter version number (e.g., 2.0.0):"
    read -r version
    git tag -a "v$version" -m "Release v$version"
    git push origin "v$version"
    log_success "Release tag v$version created!"
fi

# Step 8: Run production tests (optional)
log_info "Run tests against production? (y/n)"
read -r prod_test_response

if [[ "$prod_test_response" == "y" ]]; then
    log_info "Running production tests..."
    TEST_URL="$DEPLOY_URL" node test-lifecycle.js
fi

# Summary
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  🎉 Deployment Complete! 🎉                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

log_success "Deployment Summary:"
echo "  • API URL: $DEPLOY_URL"
echo "  • Health Check: $DEPLOY_URL/health"
echo "  • API Docs: $DEPLOY_URL/api-docs"
echo "  • Test Report: reports/test-report-*.html"

if [[ "$docs_response" == "y" ]]; then
    echo "  • Documentation: https://docs.rapidtriage.me"
fi

log_info "Next steps:"
echo "  1. Monitor error logs: wrangler tail --env production"
echo "  2. Check analytics: Cloudflare Dashboard"
echo "  3. Test Chrome extension with production API"
echo "  4. Update status page if needed"

log_success "Deployment completed successfully!"