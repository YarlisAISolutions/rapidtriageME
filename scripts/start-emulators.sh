#!/bin/bash
#
# start-emulators.sh - Start Firebase emulators for local development
#
# Usage:
#   ./start-emulators.sh [options]
#
# Options:
#   --import   Import data from previous session
#   --export   Export data on shutdown (to ./emulator-data)
#   --only     Start only specific emulators (comma-separated)
#   --debug    Enable debug mode
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="rapidtriage-me"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EMULATOR_DATA_DIR="$PROJECT_ROOT/emulator-data"

# Default options
IMPORT_DATA=false
EXPORT_DATA=false
DEBUG_MODE=false
ONLY_EMULATORS=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --import)
            IMPORT_DATA=true
            shift
            ;;
        --export)
            EXPORT_DATA=true
            shift
            ;;
        --only)
            ONLY_EMULATORS="$2"
            shift 2
            ;;
        --debug)
            DEBUG_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  RapidTriageME Firebase Emulators${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_info() {
    echo -e "${CYAN}[INFO] $1${NC}"
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

    # Check Java (required for some emulators)
    if ! command -v java &> /dev/null; then
        print_info "Java is not installed. Some emulators may not work properly."
    fi

    print_success "Prerequisites check complete"
}

build_functions() {
    print_step "Building Cloud Functions..."

    cd "$PROJECT_ROOT/functions"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_step "Installing functions dependencies..."
        npm ci
    fi

    # Build TypeScript
    npm run build

    print_success "Functions built successfully"
    cd "$PROJECT_ROOT"
}

create_data_dir() {
    if [ ! -d "$EMULATOR_DATA_DIR" ]; then
        mkdir -p "$EMULATOR_DATA_DIR"
        print_info "Created emulator data directory: $EMULATOR_DATA_DIR"
    fi
}

start_emulators() {
    print_step "Starting Firebase Emulators..."

    cd "$PROJECT_ROOT"

    # Build the command
    CMD="firebase emulators:start --project $PROJECT_ID"

    # Add import flag if requested
    if [ "$IMPORT_DATA" = true ] && [ -d "$EMULATOR_DATA_DIR" ]; then
        CMD="$CMD --import=$EMULATOR_DATA_DIR"
        print_info "Importing data from: $EMULATOR_DATA_DIR"
    fi

    # Add export flag if requested
    if [ "$EXPORT_DATA" = true ]; then
        create_data_dir
        CMD="$CMD --export-on-exit=$EMULATOR_DATA_DIR"
        print_info "Will export data on exit to: $EMULATOR_DATA_DIR"
    fi

    # Add only flag if specific emulators requested
    if [ -n "$ONLY_EMULATORS" ]; then
        CMD="$CMD --only $ONLY_EMULATORS"
        print_info "Starting only: $ONLY_EMULATORS"
    fi

    # Add debug flag if requested
    if [ "$DEBUG_MODE" = true ]; then
        CMD="$CMD --debug"
        print_info "Debug mode enabled"
    fi

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Emulator URLs${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "  Emulator UI:    http://localhost:4000"
    echo "  Hosting:        http://localhost:5000"
    echo "  Functions:      http://localhost:5001"
    echo "  Firestore:      http://localhost:8080"
    echo "  Auth:           http://localhost:9099"
    echo "  Storage:        http://localhost:9199"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the emulators${NC}"
    echo ""

    # Execute the command
    eval "$CMD"
}

cleanup() {
    echo ""
    print_info "Shutting down emulators..."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Main execution
print_header
check_prerequisites
build_functions
start_emulators
