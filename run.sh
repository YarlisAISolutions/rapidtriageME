#!/bin/bash

# RapidTriageME Quick Run Script
# This script provides shortcuts to common operations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_PATH="$SCRIPT_DIR/scripts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_header() {
    echo -e "${BLUE}🚀 RapidTriageME Runner${NC}"
    echo "========================="
    echo ""
}

function print_menu() {
    echo "Available commands:"
    echo ""
    echo -e "${GREEN}1${NC}) env       - Load environment variables"
    echo -e "${GREEN}2${NC}) switch    - Switch environment (local/staging/production)"
    echo -e "${GREEN}3${NC}) test      - Run local tests"
    echo -e "${GREEN}4${NC}) login     - Login to Cloudflare"
    echo -e "${GREEN}5${NC}) deploy    - Deploy to Cloudflare"
    echo -e "${GREEN}6${NC}) dns       - Configure DNS records"
    echo -e "${GREEN}7${NC}) publish   - Publish npm packages"
    echo -e "${GREEN}8${NC}) all       - Run complete deployment workflow"
    echo -e "${GREEN}9${NC}) status    - Check deployment status"
    echo ""
    echo -e "${YELLOW}Usage:${NC} ./run.sh [command] [args]"
    echo -e "${YELLOW}Example:${NC} ./run.sh test"
    echo -e "${YELLOW}Example:${NC} ./run.sh switch production"
    echo ""
}

function run_env() {
    echo -e "${BLUE}Loading environment variables...${NC}"
    source "$SCRIPTS_PATH/01-load-env.sh"
}

function switch_env() {
    echo -e "${BLUE}Switching environment...${NC}"
    "$SCRIPT_DIR/switch-env.sh" "$@"
}

function run_test() {
    echo -e "${BLUE}Running local tests...${NC}"
    "$SCRIPTS_PATH/02-test-local.sh"
}

function run_login() {
    echo -e "${BLUE}Logging into Cloudflare...${NC}"
    "$SCRIPTS_PATH/03-oauth-login.sh"
}

function run_deploy() {
    echo -e "${BLUE}Deploying to Cloudflare...${NC}"
    "$SCRIPTS_PATH/04-deploy.sh"
}

function run_dns() {
    echo -e "${BLUE}Configuring DNS records...${NC}"
    "$SCRIPTS_PATH/05-add-dns-records.sh"
}

function run_publish() {
    echo -e "${BLUE}Publishing npm packages...${NC}"
    "$SCRIPTS_PATH/06-publish-packages.sh"
}

function run_all() {
    echo -e "${BLUE}Running complete deployment workflow...${NC}"
    echo ""
    
    run_env
    echo ""
    
    run_test
    echo ""
    
    echo -e "${YELLOW}Do you need to login to Cloudflare? (y/n)${NC}"
    read -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_login
        echo ""
    fi
    
    run_deploy
    echo ""
    
    echo -e "${YELLOW}Configure DNS records? (y/n)${NC}"
    read -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_dns
    fi
    
    echo -e "${GREEN}✅ Complete deployment workflow finished!${NC}"
}

function check_status() {
    echo -e "${BLUE}Checking deployment status...${NC}"
    echo ""
    
    # Check local server
    echo -e "${YELLOW}Local Server (Port 3025):${NC}"
    if curl -s http://localhost:3025/.identity > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Not running${NC}"
    fi
    
    # Check staging
    echo -e "${YELLOW}Staging Environment:${NC}"
    if curl -s https://rapidtriage-staging.sireesh-yarlagadda-d3f.workers.dev/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Online${NC}"
    else
        echo -e "${RED}❌ Offline${NC}"
    fi
    
    # Check production
    echo -e "${YELLOW}Production (rapidtriage.me):${NC}"
    if curl -s https://rapidtriage.me/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Online${NC}"
    else
        echo -e "${RED}❌ Offline or DNS not propagated${NC}"
    fi
    
    echo ""
}

# Main script logic
print_header

case "$1" in
    env)
        run_env
        ;;
    switch)
        shift
        switch_env "$@"
        ;;
    test)
        run_test
        ;;
    login)
        run_login
        ;;
    deploy)
        run_deploy
        ;;
    dns)
        run_dns
        ;;
    publish)
        run_publish
        ;;
    all)
        run_all
        ;;
    status)
        check_status
        ;;
    *)
        print_menu
        ;;
esac