#!/bin/bash

# RapidTriageME Documentation Builder
# Builds and serves the MkDocs documentation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 RapidTriageME Documentation Builder${NC}"
echo "========================================="
echo ""

# Check if mkdocs is installed
if ! command -v mkdocs &> /dev/null; then
    echo -e "${YELLOW}MkDocs not found. Installing...${NC}"
    pip3 install mkdocs mkdocs-material mkdocs-mermaid2-plugin pymdown-extensions
fi

cd "$PROJECT_ROOT"

case "$1" in
    serve)
        echo -e "${BLUE}Starting documentation server...${NC}"
        mkdocs serve --dev-addr=0.0.0.0:8000
        ;;
    build)
        echo -e "${BLUE}Building documentation...${NC}"
        mkdocs build
        echo -e "${GREEN}✅ Documentation built in site/ directory${NC}"
        ;;
    deploy)
        echo -e "${BLUE}Deploying documentation to GitHub Pages...${NC}"
        mkdocs gh-deploy --force
        echo -e "${GREEN}✅ Documentation deployed${NC}"
        ;;
    clean)
        echo -e "${BLUE}Cleaning documentation build...${NC}"
        rm -rf site/
        echo -e "${GREEN}✅ Build directory cleaned${NC}"
        ;;
    *)
        echo "Usage: $0 {serve|build|deploy|clean}"
        echo ""
        echo "Commands:"
        echo "  serve  - Start development server on port 8000"
        echo "  build  - Build static documentation site"
        echo "  deploy - Deploy to GitHub Pages"
        echo "  clean  - Remove build artifacts"
        exit 1
        ;;
esac