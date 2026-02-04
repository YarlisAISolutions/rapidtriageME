#!/bin/bash

# RapidTriageME Environment Switcher
# Easily switch between local, staging, and production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Environment configurations using functions for compatibility
function get_local_env() {
    echo "ENVIRONMENT=local
API_BASE_URL=http://localhost:8787
BACKEND_URL=http://localhost:3025
BROWSER_TOOLS_PORT=3025
SSE_ENDPOINT=/sse
HEALTH_ENDPOINT=/health
METRICS_ENDPOINT=/metrics"
}

# DEPRECATED: Staging environment is no longer in use
# function get_staging_env() {
#     echo "ENVIRONMENT=staging
# API_BASE_URL=https://rapidtriage-staging.sireesh-yarlagadda-d3f.workers.dev
# BACKEND_URL=https://rapidtriage-backend-staging.herokuapp.com
# BROWSER_TOOLS_PORT=443
# SSE_ENDPOINT=/sse
# HEALTH_ENDPOINT=/health
# METRICS_ENDPOINT=/metrics"
# }

function get_production_env() {
    echo "ENVIRONMENT=production
API_BASE_URL=https://rapidtriage.me
BACKEND_URL=https://rapidtriage-backend-u72y6ntcwa-uc.a.run.app
BROWSER_TOOLS_PORT=443
SSE_ENDPOINT=/sse
HEALTH_ENDPOINT=/health
METRICS_ENDPOINT=/metrics"
}

function print_header() {
    echo -e "${CYAN}🔄 RapidTriageME Environment Switcher${NC}"
    echo "======================================="
    echo ""
}

function show_current_env() {
    if [ -f .env ]; then
        current_env=$(grep "^ENVIRONMENT=" .env 2>/dev/null | cut -d'=' -f2 || echo "unknown")
        echo -e "${BLUE}Current environment: ${YELLOW}$current_env${NC}"
    else
        echo -e "${YELLOW}No .env file found${NC}"
    fi
    echo ""
}

function list_environments() {
    echo -e "${GREEN}Available environments:${NC}"
    echo "  1) local       - Local development"
    echo "  2) production  - Production environment"
    echo ""
    echo -e "${YELLOW}Note: Staging environment has been deprecated${NC}"
    echo ""
}

function backup_env() {
    if [ -f .env ]; then
        backup_file=".env.backup.$(date +%Y%m%d_%H%M%S)"
        cp .env "$backup_file"
        echo -e "${GREEN}✓${NC} Current .env backed up to $backup_file"
    fi
}

function switch_environment() {
    local env_name=$1
    local env_config=""
    
    # Get environment configuration based on name
    case $env_name in
        local)
            env_config=$(get_local_env)
            ;;
        staging)
            echo -e "${YELLOW}⚠️  Warning: Staging environment is deprecated and no longer in use${NC}"
            echo -e "${YELLOW}   Please use 'local' for development or 'production' for live environment${NC}"
            return 1
            ;;
        production)
            env_config=$(get_production_env)
            ;;
        *)
            echo -e "${RED}❌ Invalid environment: $env_name${NC}"
            echo -e "${YELLOW}   Valid options: local, production${NC}"
            return 1
            ;;
    esac
    
    # Backup current .env
    backup_env
    
    # Create new .env file
    echo "# RapidTriageME Environment Configuration" > .env.tmp
    echo "# Generated: $(date)" >> .env.tmp
    echo "# Environment: $env_name" >> .env.tmp
    echo "" >> .env.tmp
    
    # Add environment-specific variables
    echo "$env_config" | sed '/^$/d' >> .env.tmp
    
    # Preserve other configurations from .env.example
    if [ -f .env.example ]; then
        echo "" >> .env.tmp
        echo "# Additional Configuration" >> .env.tmp
        grep -E "^(CLOUDFLARE_|AUTH_TOKEN|JWT_SECRET|DOMAIN|ZONE_ID|RATE_LIMIT_)" .env.example | sed 's/=.*/=your_value_here/' >> .env.tmp
    fi
    
    # If existing .env has real values, preserve them
    if [ -f .env ]; then
        # Preserve Cloudflare and auth tokens
        for key in CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_TOKEN AUTH_TOKEN JWT_SECRET DOMAIN ZONE_ID; do
            value=$(grep "^$key=" .env 2>/dev/null | cut -d'=' -f2-)
            if [ ! -z "$value" ] && [ "$value" != "your_value_here" ] && [[ ! "$value" =~ your.*here ]]; then
                sed -i.bak "s/^$key=.*/$key=$value/" .env.tmp
            fi
        done
        rm -f .env.tmp.bak
    fi
    
    # Move the new env file
    mv .env.tmp .env
    
    echo -e "${GREEN}✓${NC} Switched to ${YELLOW}$env_name${NC} environment"
    echo ""
    
    # Show the configuration
    echo -e "${BLUE}Configuration:${NC}"
    echo "-------------------"
    grep -E "^(ENVIRONMENT|API_BASE_URL|BACKEND_URL)=" .env | while IFS='=' read -r key value; do
        echo -e "  ${CYAN}$key${NC} = $value"
    done
    echo ""
}

function test_environment() {
    echo -e "${BLUE}Testing current environment...${NC}"
    echo ""
    
    # Load current environment
    source .env 2>/dev/null || {
        echo -e "${RED}❌ No .env file found${NC}"
        return 1
    }
    
    # Test API endpoint
    if [ ! -z "$API_BASE_URL" ]; then
        echo -n "Testing API ($API_BASE_URL/health): "
        if curl -s -f "$API_BASE_URL/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Connected${NC}"
        else
            echo -e "${YELLOW}⚠ Not reachable${NC}"
        fi
    fi
    
    # Test Backend endpoint
    if [ ! -z "$BACKEND_URL" ]; then
        echo -n "Testing Backend ($BACKEND_URL/health): "
        if curl -s -f "$BACKEND_URL/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Connected${NC}"
        else
            echo -e "${YELLOW}⚠ Not reachable${NC}"
        fi
    fi
    
    echo ""
}

function interactive_mode() {
    print_header
    show_current_env
    list_environments
    
    echo -n "Select environment (1-2) or 'q' to quit: "
    read -r choice
    
    case $choice in
        1) switch_environment "local" ;;
        2) switch_environment "production" ;;
        q|Q) echo "Exiting..."; exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
    esac
    
    # Ask if user wants to test
    echo -n "Test the environment? (y/n): "
    read -r test_choice
    if [[ $test_choice =~ ^[Yy]$ ]]; then
        test_environment
    fi
}

# Main script logic
case "$1" in
    local|production)
        print_header
        switch_environment "$1"
        test_environment
        ;;
    staging)
        print_header
        echo -e "${YELLOW}⚠️  Warning: Staging environment is deprecated and no longer in use${NC}"
        echo -e "${YELLOW}   Please use 'local' for development or 'production' for live environment${NC}"
        exit 1
        ;;
    test)
        print_header
        show_current_env
        test_environment
        ;;
    show|status)
        print_header
        show_current_env
        ;;
    -h|--help|help)
        print_header
        echo "Usage: ./switch-env.sh [environment|command]"
        echo ""
        echo "Environments:"
        echo "  local       - Switch to local development"
        echo "  production  - Switch to production environment"
        echo ""
        echo "Commands:"
        echo "  test        - Test current environment"
        echo "  show        - Show current environment"
        echo "  help        - Show this help message"
        echo ""
        echo "Interactive mode: ./switch-env.sh (no arguments)"
        echo ""
        echo -e "${YELLOW}Note: Staging environment has been deprecated${NC}"
        ;;
    *)
        interactive_mode
        ;;
esac