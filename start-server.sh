#!/bin/bash

# RapidTriageME Local Server Startup Script
# This script starts the local browser tools server

set -e

echo "🚀 Starting RapidTriageME Local Server..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load configuration from config.json if available
CONFIG_FILE="config.json"
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✓${NC} Found configuration file: $CONFIG_FILE"
    PORT=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).server.port")
else
    echo -e "${YELLOW}⚠${NC} No config.json found, using default port 3025"
    PORT=3025
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node --version)"

# Navigate to server directory
cd rapidtriage-server

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Installing now..."
    npm install
fi

# Kill any existing server on the port
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠${NC} Port $PORT is already in use. Attempting to kill existing process..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start the server
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Starting Server on port $PORT...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Export PORT environment variable
export PORT=$PORT

# Start server
npm start

