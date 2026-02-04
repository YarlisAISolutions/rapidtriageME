#!/bin/bash
#
# deploy-firebase.sh - Firebase deployment script for RapidTriageME
#
# Usage:
#   ./deploy-firebase.sh [target]
#
# Targets:
#   all       - Deploy everything (default)
#   functions - Deploy only Cloud Functions
#   hosting   - Deploy only Hosting
#   rules     - Deploy Firestore and Storage rules
#   firestore - Deploy only Firestore rules
#   storage   - Deploy only Storage rules
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="rapidtriage-me"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  RapidTriageME Firebase Deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check if firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Install with: npm install -g firebase-tools"
        exit 1
    fi

    # Check if logged in
    if ! firebase projects:list &> /dev/null; then
        print_error "Not logged in to Firebase. Run: firebase login"
        exit 1
    fi

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ is required. Current version: $(node -v)"
        exit 1
    fi

    print_success "All prerequisites met"
}

build_functions() {
    print_step "Building Cloud Functions..."

    cd "$PROJECT_ROOT/functions"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_step "Installing functions dependencies..."
        npm ci
    fi

    # Clean previous build
    if [ -d "lib" ]; then
        rm -rf lib
    fi

    # Build TypeScript
    npm run build

    print_success "Functions built successfully"
    cd "$PROJECT_ROOT"
}

create_hosting_dir() {
    print_step "Ensuring hosting directory exists..."

    mkdir -p "$PROJECT_ROOT/dist/public"

    # Create index.html if it doesn't exist
    if [ ! -f "$PROJECT_ROOT/dist/public/index.html" ]; then
        print_step "Creating placeholder index.html..."
        cat > "$PROJECT_ROOT/dist/public/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RapidTriageME - Browser Debugging Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #fff; }
        .container { text-align: center; padding: 2rem; max-width: 600px; }
        h1 { font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(90deg, #00d9ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p { font-size: 1.2rem; color: #a0a0a0; margin-bottom: 2rem; }
        .links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        a { display: inline-block; padding: 0.75rem 1.5rem; background: #00d9ff; color: #1a1a2e; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s; }
        a:hover { background: #00ff88; transform: translateY(-2px); }
        .api-link { background: transparent; border: 2px solid #00d9ff; color: #00d9ff; }
        .api-link:hover { background: #00d9ff; color: #1a1a2e; }
    </style>
</head>
<body>
    <div class="container">
        <h1>RapidTriageME</h1>
        <p>Real-time browser debugging and monitoring platform with MCP integration for AI-powered development workflows.</p>
        <div class="links">
            <a href="/api-docs">API Documentation</a>
            <a href="/health" class="api-link">Health Check</a>
            <a href="https://github.com/YarlisAISolutions/rapidtriageME" class="api-link">GitHub</a>
        </div>
    </div>
</body>
</html>
EOF
    fi

    print_success "Hosting directory ready"
}

deploy_functions() {
    print_step "Deploying Cloud Functions..."
    firebase deploy --only functions --project "$PROJECT_ID"
    print_success "Functions deployed"
}

deploy_hosting() {
    print_step "Deploying Firebase Hosting..."
    firebase deploy --only hosting --project "$PROJECT_ID"
    print_success "Hosting deployed"
}

deploy_firestore_rules() {
    print_step "Deploying Firestore rules..."
    firebase deploy --only firestore:rules --project "$PROJECT_ID"
    print_success "Firestore rules deployed"
}

deploy_storage_rules() {
    print_step "Deploying Storage rules..."
    firebase deploy --only storage:rules --project "$PROJECT_ID"
    print_success "Storage rules deployed"
}

deploy_all() {
    build_functions
    create_hosting_dir

    print_step "Deploying all Firebase services..."
    firebase deploy --project "$PROJECT_ID"
    print_success "All services deployed"
}

# Main execution
print_header

TARGET="${1:-all}"

check_prerequisites

case "$TARGET" in
    "all")
        deploy_all
        ;;
    "functions")
        build_functions
        deploy_functions
        ;;
    "hosting")
        create_hosting_dir
        deploy_hosting
        ;;
    "rules")
        deploy_firestore_rules
        deploy_storage_rules
        ;;
    "firestore")
        deploy_firestore_rules
        ;;
    "storage")
        deploy_storage_rules
        ;;
    *)
        print_error "Unknown target: $TARGET"
        echo "Usage: $0 [all|functions|hosting|rules|firestore|storage]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Hosting URL: https://rapidtriage-me.web.app"
echo "Custom Domain: https://rapidtriage.me"
echo "Console: https://console.firebase.google.com/project/$PROJECT_ID"
