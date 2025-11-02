#!/bin/bash

# RapidTriageME Local Server Stop Script

set -e

echo "🛑 Stopping RapidTriageME Local Server..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load port from config
CONFIG_FILE="config.json"
if [ -f "$CONFIG_FILE" ]; then
    PORT=$(node -pe "JSON.parse(require('fs').readFileSync('$CONFIG_FILE', 'utf8')).server.port")
else
    PORT=3025
fi

# Check if server is running
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠${NC} Found server running on port $PORT"
    echo -e "${GREEN}✓${NC} Stopping server..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}✓${NC} Server stopped successfully"
else
    echo -e "${YELLOW}⚠${NC} No server found running on port $PORT"
fi

echo ""
echo "✅ Done"

