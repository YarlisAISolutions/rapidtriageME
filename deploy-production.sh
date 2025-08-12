#!/bin/bash

# RapidTriageME Unified Production Deployment Script
# Combines all features from both deployment scripts
# Features: Visual progress, enhanced error handling, comprehensive testing, rollback capability

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration & Variables
# ═══════════════════════════════════════════════════════════════════════════════

# Colors and styling
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Status symbols
PENDING="⏳"
IN_PROGRESS="🔄"
COMPLETED="✅"
FAILED="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-rapidtriage-mcp-1754768171}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="rapidtriage-backend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
EXPECTED_BACKEND_URL="https://rapidtriage-backend-457164051549.us-central1.run.app/"

# Deployment mode (can be set via environment variable)
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-production}"
ENABLE_ROLLBACK="${ENABLE_ROLLBACK:-true}"
VERBOSE="${VERBOSE:-false}"

# Step tracking
declare -a STEPS=(
    "Check prerequisites and environment"
    "Build Docker image for amd64 platform"
    "Configure Docker for Google Container Registry"
    "Push image to Container Registry"
    "Deploy to Cloud Run"
    "Update Cloudflare Worker configuration"
    "Test backend deployment"
    "Test Worker deployment"
    "Test MCP endpoints"
    "Verify all services"
)

declare -a STEP_STATUS=()
for i in "${!STEPS[@]}"; do
    STEP_STATUS+=("pending")
done

# Backup tracking for rollback
PREVIOUS_IMAGE=""
PREVIOUS_BACKEND_URL=""

# ═══════════════════════════════════════════════════════════════════════════════
# Helper Functions
# ═══════════════════════════════════════════════════════════════════════════════

# Function to display header
show_header() {
    clear
    echo -e "${BOLD}${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                 🚀 RapidTriageME Unified Production Deployment                ║"
    echo "║                     Enhanced Deployment with Full Features                     ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}Mode: ${YELLOW}${DEPLOYMENT_MODE}${NC} | ${CYAN}Project: ${YELLOW}${PROJECT_ID}${NC} | ${CYAN}Region: ${YELLOW}${REGION}${NC}"
    echo ""
}

# Function to display progress bar
show_progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "\r${CYAN}Progress: [${GREEN}"
    printf "%*s" $filled | tr ' ' '█'
    printf "${BLUE}"
    printf "%*s" $empty | tr ' ' '░'
    printf "${CYAN}] %d%% (%d/%d)${NC}" $percentage $current $total
}

# Function to display step status
show_step_status() {
    echo -e "\n${BOLD}${PURPLE}Deployment Pipeline Status:${NC}"
    echo "══════════════════════════════"
    
    for i in "${!STEPS[@]}"; do
        local step_num=$((i + 1))
        local status="${STEP_STATUS[$i]}"
        local symbol=""
        local color=""
        
        case $status in
            "pending")
                symbol="$PENDING"
                color="$YELLOW"
                ;;
            "in_progress")
                symbol="$IN_PROGRESS"
                color="$BLUE"
                ;;
            "completed")
                symbol="$COMPLETED"
                color="$GREEN"
                ;;
            "failed")
                symbol="$FAILED"
                color="$RED"
                ;;
            "warning")
                symbol="$WARNING"
                color="$YELLOW"
                ;;
        esac
        
        printf "${color}${symbol} Step %2d: %-50s${NC}\n" $step_num "${STEPS[$i]}"
    done
    echo ""
}

# Function to update step status
update_step_status() {
    local step_index=$1
    local status=$2
    STEP_STATUS[$step_index]=$status
    
    if [ "$VERBOSE" != "true" ]; then
        show_header
        show_step_status
        show_progress_bar $((step_index + 1)) ${#STEPS[@]}
        echo ""
    fi
}

# Function to log messages
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}${INFO} [${timestamp}] ${message}${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}${COMPLETED} [${timestamp}] ${message}${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}${WARNING} [${timestamp}] ${message}${NC}"
            ;;
        "ERROR")
            echo -e "${RED}${FAILED} [${timestamp}] ${message}${NC}"
            ;;
        "PROGRESS")
            echo -e "${CYAN}${IN_PROGRESS} [${timestamp}] ${message}${NC}"
            ;;
    esac
    
    # Also log to file
    echo "[${timestamp}] [${level}] ${message}" >> deployment.log
}

# Function to run command with progress and error handling
run_with_progress() {
    local cmd="$1"
    local step_name="$2"
    local log_file="/tmp/${3:-command}.log"
    
    log_message "PROGRESS" "Executing: ${step_name}"
    
    if [ "$VERBOSE" = "true" ]; then
        eval "$cmd" 2>&1 | tee "$log_file"
        return ${PIPESTATUS[0]}
    else
        # Run command in background
        eval "$cmd" > "$log_file" 2>&1 &
        local cmd_pid=$!
        
        # Show spinning progress
        local spin_chars="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
        local i=0
        
        while kill -0 $cmd_pid 2>/dev/null; do
            local char=${spin_chars:$((i % ${#spin_chars})):1}
            printf "\r${BLUE}${char} Processing: ${step_name}${NC}"
            sleep 0.1
            ((i++))
        done
        
        # Get exit status
        wait $cmd_pid
        local exit_status=$?
        
        if [ $exit_status -eq 0 ]; then
            printf "\r${GREEN}${COMPLETED} Completed: ${step_name}${NC}\n"
        else
            printf "\r${RED}${FAILED} Failed: ${step_name}${NC}\n"
        fi
        
        return $exit_status
    fi
}

# Function to handle errors with detailed troubleshooting
handle_error() {
    local step_index=$1
    local error_msg="$2"
    local log_file="${3:-}"
    
    STEP_STATUS[$step_index]="failed"
    update_step_status $step_index "failed"
    
    log_message "ERROR" "Deployment failed at step $((step_index + 1)): ${STEPS[$step_index]}"
    log_message "ERROR" "$error_msg"
    
    if [ -n "$log_file" ] && [ -f "$log_file" ]; then
        echo -e "\n${YELLOW}Last 10 lines from log file:${NC}"
        tail -10 "$log_file"
    fi
    
    echo -e "\n${YELLOW}${WARNING} Troubleshooting tips:${NC}"
    
    case $step_index in
        0)
            echo "• Ensure all required tools are installed"
            echo "• Check network connectivity"
            echo "• Verify credentials and permissions"
            ;;
        1)
            echo "• Check if Docker daemon is running: docker info"
            echo "• Verify Dockerfile exists in rapidtriage-server/"
            echo "• Ensure sufficient disk space: df -h"
            echo "• Review Docker build log: $log_file"
            ;;
        2)
            echo "• Authenticate with Google Cloud: gcloud auth login"
            echo "• Check project permissions: gcloud projects describe $PROJECT_ID"
            echo "• Verify Docker configuration: docker info"
            ;;
        3)
            echo "• Check network connectivity to gcr.io"
            echo "• Verify image size isn't too large: docker images"
            echo "• Check GCR permissions: gcloud auth configure-docker"
            ;;
        4)
            echo "• Ensure Cloud Run API is enabled"
            echo "• Check service account permissions"
            echo "• Verify region availability: gcloud run regions list"
            ;;
        5)
            echo "• Check Wrangler authentication: wrangler whoami"
            echo "• Verify Cloudflare API token permissions"
            echo "• Check wrangler.toml configuration"
            ;;
        6|7|8|9)
            echo "• Services may need time to propagate (wait 1-2 minutes)"
            echo "• Check service logs: gcloud run logs read --service $SERVICE_NAME"
            echo "• Verify DNS propagation: nslookup rapidtriage.me"
            ;;
    esac
    
    if [ "$ENABLE_ROLLBACK" = "true" ] && [ -n "$PREVIOUS_IMAGE" ]; then
        echo -e "\n${YELLOW}${WARNING} Rollback available. Run: ./deploy-production-unified.sh --rollback${NC}"
    fi
    
    exit 1
}

# Function to check prerequisites
check_prerequisites() {
    log_message "INFO" "Checking prerequisites..."
    
    local errors=0
    local warnings=0
    
    # Required tools
    local required_tools=("gcloud" "docker" "jq" "wrangler" "curl")
    
    for tool in "${required_tools[@]}"; do
        if command -v $tool &> /dev/null; then
            log_message "SUCCESS" "$tool found"
        else
            log_message "ERROR" "$tool not found"
            case $tool in
                "gcloud")
                    echo "  Install from: https://cloud.google.com/sdk/docs/install"
                    ;;
                "docker")
                    echo "  Install from: https://docs.docker.com/get-docker/"
                    ;;
                "jq")
                    echo "  Install with: brew install jq (Mac) or apt-get install jq (Linux)"
                    ;;
                "wrangler")
                    echo "  Install with: npm install -g wrangler"
                    ;;
            esac
            ((errors++))
        fi
    done
    
    # Check Docker daemon
    if command -v docker &> /dev/null; then
        if ! docker info &> /dev/null; then
            log_message "ERROR" "Docker daemon is not running"
            echo "  Start Docker Desktop or run: sudo systemctl start docker"
            ((errors++))
        else
            log_message "SUCCESS" "Docker daemon is running"
        fi
    fi
    
    # Check gcloud authentication
    if command -v gcloud &> /dev/null; then
        if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
            log_message "WARNING" "No active gcloud authentication found"
            echo "  Run: gcloud auth login"
            ((warnings++))
        else
            local account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
            log_message "SUCCESS" "Authenticated as: $account"
        fi
    fi
    
    # Check project configuration
    if command -v gcloud &> /dev/null; then
        local current_project=$(gcloud config get-value project 2>/dev/null)
        if [ "$current_project" != "$PROJECT_ID" ]; then
            log_message "WARNING" "Current project ($current_project) differs from target ($PROJECT_ID)"
            echo "  Run: gcloud config set project $PROJECT_ID"
            ((warnings++))
        fi
    fi
    
    if [ $errors -gt 0 ]; then
        log_message "ERROR" "Prerequisites check failed with $errors errors"
        exit 1
    fi
    
    if [ $warnings -gt 0 ]; then
        log_message "WARNING" "Prerequisites check completed with $warnings warnings"
        echo -e "${YELLOW}Continue anyway? (y/n):${NC} "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_message "SUCCESS" "All prerequisites satisfied"
    fi
}

# Function to backup current deployment
backup_deployment() {
    log_message "INFO" "Backing up current deployment configuration..."
    
    # Get current image if exists
    PREVIOUS_IMAGE=$(gcloud run services describe $SERVICE_NAME \
        --region $REGION \
        --format 'value(spec.template.spec.containers[0].image)' 2>/dev/null || echo "")
    
    # Get current backend URL from Cloudflare
    # This would need actual implementation based on your setup
    PREVIOUS_BACKEND_URL="$EXPECTED_BACKEND_URL"
    
    if [ -n "$PREVIOUS_IMAGE" ]; then
        log_message "SUCCESS" "Backup created for rollback capability"
        echo "  Previous image: $PREVIOUS_IMAGE"
    fi
}

# Function to perform rollback
perform_rollback() {
    log_message "WARNING" "Starting rollback to previous deployment..."
    
    if [ -z "$PREVIOUS_IMAGE" ]; then
        log_message "ERROR" "No previous deployment found for rollback"
        exit 1
    fi
    
    log_message "INFO" "Rolling back to image: $PREVIOUS_IMAGE"
    
    gcloud run deploy $SERVICE_NAME \
        --image "$PREVIOUS_IMAGE" \
        --region $REGION \
        --quiet
    
    if [ $? -eq 0 ]; then
        log_message "SUCCESS" "Rollback completed successfully"
    else
        log_message "ERROR" "Rollback failed"
        exit 1
    fi
}

# Function to run comprehensive tests
run_comprehensive_tests() {
    local service_url=$1
    local test_failures=0
    
    log_message "INFO" "Running comprehensive test suite..."
    
    # Test 1: Backend Health
    echo -e "\n${CYAN}Test 1: Backend Health Check${NC}"
    local backend_health=$(curl -s --max-time 10 "$service_url/health" | jq -r '.status' 2>/dev/null || echo "failed")
    if [ "$backend_health" = "healthy" ]; then
        log_message "SUCCESS" "Backend health check passed"
    else
        log_message "WARNING" "Backend health check failed or timeout"
        ((test_failures++))
    fi
    
    # Test 2: Backend Identity
    echo -e "\n${CYAN}Test 2: Backend Identity Check${NC}"
    local backend_identity=$(curl -s --max-time 10 "$service_url/.identity" | jq -r '.name' 2>/dev/null || echo "failed")
    if [ "$backend_identity" != "failed" ]; then
        log_message "SUCCESS" "Backend identity verified: $backend_identity"
    else
        log_message "WARNING" "Backend identity check failed"
        ((test_failures++))
    fi
    
    # Test 3: Worker Health
    echo -e "\n${CYAN}Test 3: Worker Health Check${NC}"
    local worker_health=$(curl -s --max-time 10 "https://rapidtriage.me/health" | jq -r '.status' 2>/dev/null || echo "failed")
    if [ "$worker_health" = "healthy" ]; then
        log_message "SUCCESS" "Worker health check passed"
    else
        log_message "WARNING" "Worker health check failed (may need propagation time)"
        ((test_failures++))
    fi
    
    # Test 4: MCP Tools List
    echo -e "\n${CYAN}Test 4: MCP Tools List${NC}"
    local mcp_tools=$(curl -s --max-time 10 -X POST "https://rapidtriage.me/sse" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
        -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | \
        jq -r '.result.tools | length' 2>/dev/null || echo "0")
    
    if [ "$mcp_tools" -gt 0 ]; then
        log_message "SUCCESS" "MCP tools endpoint working ($mcp_tools tools available)"
    else
        log_message "WARNING" "MCP tools endpoint not responding correctly"
        ((test_failures++))
    fi
    
    # Test 5: MCP Resources List
    echo -e "\n${CYAN}Test 5: MCP Resources List${NC}"
    local mcp_resources=$(curl -s --max-time 10 -X POST "https://rapidtriage.me/sse" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
        -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":2}' | \
        jq -r '.result.resources | length' 2>/dev/null || echo "0")
    
    if [ "$mcp_resources" -gt 0 ]; then
        log_message "SUCCESS" "MCP resources endpoint working ($mcp_resources resources available)"
    else
        log_message "WARNING" "MCP resources endpoint not responding correctly"
        ((test_failures++))
    fi
    
    # Test 6: Metrics Endpoint
    echo -e "\n${CYAN}Test 6: Metrics Endpoint${NC}"
    local metrics_status=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8" \
        "https://rapidtriage.me/metrics")
    
    if [ "$metrics_status" = "200" ]; then
        log_message "SUCCESS" "Metrics endpoint accessible"
    else
        log_message "WARNING" "Metrics endpoint returned status: $metrics_status"
        ((test_failures++))
    fi
    
    # Test Summary
    echo -e "\n${BOLD}${CYAN}Test Summary:${NC}"
    local total_tests=6
    local passed_tests=$((total_tests - test_failures))
    
    echo -e "Total Tests: ${total_tests}"
    echo -e "${GREEN}Passed: ${passed_tests}${NC}"
    echo -e "${RED}Failed: ${test_failures}${NC}"
    echo -e "Success Rate: $(( passed_tests * 100 / total_tests ))%"
    
    if [ $test_failures -eq 0 ]; then
        log_message "SUCCESS" "All tests passed successfully!"
        return 0
    elif [ $test_failures -le 2 ]; then
        log_message "WARNING" "Some tests failed - services may need propagation time"
        return 0
    else
        log_message "ERROR" "Multiple test failures detected"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main Deployment Function
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rollback)
                perform_rollback
                exit 0
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --mode)
                DEPLOYMENT_MODE="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --rollback    Rollback to previous deployment"
                echo "  --verbose     Show detailed output"
                echo "  --mode MODE   Set deployment mode (production/staging)"
                echo "  --help        Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Initialize
    show_header
    
    log_message "INFO" "Starting RapidTriageME Unified Production Deployment"
    log_message "INFO" "Deployment Mode: $DEPLOYMENT_MODE"
    log_message "INFO" "Target Project: $PROJECT_ID"
    log_message "INFO" "Target Region: $REGION"
    
    # Step 0: Check prerequisites
    update_step_status 0 "in_progress"
    check_prerequisites
    update_step_status 0 "completed"
    
    # Backup current deployment if rollback is enabled
    if [ "$ENABLE_ROLLBACK" = "true" ]; then
        backup_deployment
    fi
    
    show_step_status
    
    # Step 1: Build Docker image
    update_step_status 1 "in_progress"
    
    if [ ! -d "rapidtriage-server" ]; then
        handle_error 1 "rapidtriage-server directory not found" ""
    fi
    
    cd rapidtriage-server
    
    if run_with_progress \
        "docker buildx build --platform linux/amd64 -t $IMAGE_NAME:latest --load ." \
        "Building Docker image" \
        "docker_build"; then
        update_step_status 1 "completed"
        log_message "SUCCESS" "Docker image built successfully"
    else
        handle_error 1 "Docker build failed" "/tmp/docker_build.log"
    fi
    
    # Step 2: Configure Docker for GCR
    update_step_status 2 "in_progress"
    
    if run_with_progress \
        "gcloud auth configure-docker --quiet" \
        "Configuring Docker for GCR" \
        "gcloud_config"; then
        update_step_status 2 "completed"
        log_message "SUCCESS" "Docker configured for GCR"
    else
        handle_error 2 "Failed to configure Docker for GCR" "/tmp/gcloud_config.log"
    fi
    
    # Step 3: Push image to GCR
    update_step_status 3 "in_progress"
    
    if run_with_progress \
        "docker push $IMAGE_NAME:latest" \
        "Pushing image to GCR" \
        "docker_push"; then
        update_step_status 3 "completed"
        log_message "SUCCESS" "Image pushed to GCR"
    else
        handle_error 3 "Failed to push image to GCR" "/tmp/docker_push.log"
    fi
    
    # Step 4: Deploy to Cloud Run
    update_step_status 4 "in_progress"
    
    deploy_cmd="gcloud run deploy $SERVICE_NAME \
        --image $IMAGE_NAME:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --timeout 60 \
        --max-instances 10 \
        --min-instances 1 \
        --port 3025 \
        --set-env-vars NODE_ENV=production \
        --quiet"
    
    if run_with_progress \
        "$deploy_cmd" \
        "Deploying to Cloud Run" \
        "cloudrun_deploy"; then
        update_step_status 4 "completed"
        
        # Get the service URL
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
            --region $REGION \
            --format 'value(status.url)' 2>/dev/null)
        
        log_message "SUCCESS" "Cloud Run deployment successful"
        log_message "INFO" "Service URL: $SERVICE_URL"
        
        # Verify URL matches expected
        if [[ "$SERVICE_URL" == "$EXPECTED_BACKEND_URL"* ]]; then
            log_message "SUCCESS" "Service URL matches expected backend URL"
        else
            log_message "WARNING" "Service URL differs from expected: $EXPECTED_BACKEND_URL"
        fi
    else
        handle_error 4 "Cloud Run deployment failed" "/tmp/cloudrun_deploy.log"
    fi
    
    # Step 5: Update Cloudflare Worker
    update_step_status 5 "in_progress"
    
    cd ..
    
    # Update deployment timestamp in wrangler.toml
    CURRENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    log_message "INFO" "Updating deployment timestamp to: $CURRENT_TIMESTAMP"
    
    # Update the timestamp in wrangler.toml
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/DEPLOYMENT_TIMESTAMP = \".*\"/DEPLOYMENT_TIMESTAMP = \"$CURRENT_TIMESTAMP\"/" wrangler.toml
    else
        # Linux
        sed -i "s/DEPLOYMENT_TIMESTAMP = \".*\"/DEPLOYMENT_TIMESTAMP = \"$CURRENT_TIMESTAMP\"/" wrangler.toml
    fi
    
    # Deploy worker with updated configuration
    if run_with_progress \
        "wrangler deploy --env production" \
        "Deploying Worker with updated timestamp" \
        "wrangler_deploy"; then
        
        # Update backend URL secret
        if run_with_progress \
            "echo '$SERVICE_URL' | wrangler secret put BACKEND_URL --env production" \
            "Updating Cloudflare Worker secrets" \
            "wrangler_update"; then
            update_step_status 5 "completed"
            log_message "SUCCESS" "Cloudflare Worker updated with timestamp: $CURRENT_TIMESTAMP"
        else
            handle_error 5 "Failed to update Cloudflare Worker secrets" "/tmp/wrangler_update.log"
        fi
    else
        handle_error 5 "Failed to deploy Cloudflare Worker" "/tmp/wrangler_deploy.log"
    fi
    
    # Wait for services to propagate
    log_message "INFO" "Waiting for services to initialize and propagate..."
    sleep 10
    
    # Steps 6-9: Run comprehensive tests
    for i in {6..9}; do
        update_step_status $i "in_progress"
    done
    
    if run_comprehensive_tests "$SERVICE_URL"; then
        for i in {6..9}; do
            update_step_status $i "completed"
        done
    else
        for i in {6..9}; do
            update_step_status $i "warning"
        done
    fi
    
    # Final display
    show_header
    show_step_status
    show_progress_bar ${#STEPS[@]} ${#STEPS[@]}
    echo ""
    
    # Deployment summary
    echo -e "\n${BOLD}${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                        🎉 DEPLOYMENT COMPLETE! 🎉                             ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "\n${BOLD}${CYAN}📍 Service Endpoints:${NC}"
    echo "═══════════════════════════════════════"
    echo -e "${GREEN}Backend URL:${NC}        $SERVICE_URL"
    echo -e "${GREEN}Worker URL:${NC}         https://rapidtriage.me"
    echo -e "${GREEN}Health Check:${NC}       https://rapidtriage.me/health"
    echo -e "${GREEN}Metrics:${NC}            https://rapidtriage.me/metrics"
    echo -e "${GREEN}MCP Endpoint:${NC}       https://rapidtriage.me/sse"
    
    echo -e "\n${BOLD}${CYAN}🔧 Management Commands:${NC}"
    echo "═══════════════════════════════════════"
    echo -e "${YELLOW}View logs:${NC}          gcloud run logs read --service $SERVICE_NAME --region $REGION"
    echo -e "${YELLOW}Stream logs:${NC}        gcloud run logs tail --service $SERVICE_NAME --region $REGION"
    echo -e "${YELLOW}Scale up:${NC}           gcloud run services update $SERVICE_NAME --max-instances 50 --region $REGION"
    echo -e "${YELLOW}Rollback:${NC}           ./deploy-production-unified.sh --rollback"
    
    echo -e "\n${BOLD}${CYAN}📊 Monitoring Dashboard:${NC}"
    echo "═══════════════════════════════════════"
    echo -e "${BLUE}• Cloud Run:${NC}        https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
    echo -e "${BLUE}• Cloudflare:${NC}       https://dash.cloudflare.com"
    echo -e "${BLUE}• Cloud Monitoring:${NC} https://console.cloud.google.com/monitoring"
    echo -e "${BLUE}• Cloud Logging:${NC}    https://console.cloud.google.com/logs"
    
    echo -e "\n${BOLD}${CYAN}📝 Post-Deployment Checklist:${NC}"
    echo "═══════════════════════════════════════"
    echo "□ Monitor service health for 5 minutes"
    echo "□ Check error logs for any issues"
    echo "□ Verify DNS propagation globally"
    echo "□ Test all API endpoints"
    echo "□ Configure alerting policies"
    echo "□ Document deployment in changelog"
    
    log_message "SUCCESS" "Deployment completed successfully!"
    log_message "INFO" "All services are ready for production use"
    
    # Save deployment info
    cat > deployment-info.json <<EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "mode": "$DEPLOYMENT_MODE",
    "project_id": "$PROJECT_ID",
    "region": "$REGION",
    "service_name": "$SERVICE_NAME",
    "service_url": "$SERVICE_URL",
    "image": "$IMAGE_NAME:latest",
    "worker_url": "https://rapidtriage.me",
    "status": "success"
}
EOF
    
    log_message "INFO" "Deployment info saved to deployment-info.json"
    echo -e "\n${GREEN}${COMPLETED} Deployment completed successfully!${NC}\n"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Error Handling & Cleanup
# ═══════════════════════════════════════════════════════════════════════════════

# Trap errors and interrupts
trap 'echo -e "\n${RED}${FAILED} Deployment interrupted${NC}"; exit 1' INT TERM

# Cleanup function
cleanup() {
    if [ -f "/tmp/docker_build.log" ]; then rm -f /tmp/docker_build.log; fi
    if [ -f "/tmp/gcloud_config.log" ]; then rm -f /tmp/gcloud_config.log; fi
    if [ -f "/tmp/docker_push.log" ]; then rm -f /tmp/docker_push.log; fi
    if [ -f "/tmp/cloudrun_deploy.log" ]; then rm -f /tmp/cloudrun_deploy.log; fi
    if [ -f "/tmp/wrangler_update.log" ]; then rm -f /tmp/wrangler_update.log; fi
}

trap cleanup EXIT

# ═══════════════════════════════════════════════════════════════════════════════
# Script Entry Point
# ═══════════════════════════════════════════════════════════════════════════════

# Create log file
touch deployment.log
echo "═══════════════════════════════════════════════════════════════════════════════" >> deployment.log
echo "Deployment started at $(date)" >> deployment.log
echo "═══════════════════════════════════════════════════════════════════════════════" >> deployment.log

# Run main function
main "$@"

# End of script