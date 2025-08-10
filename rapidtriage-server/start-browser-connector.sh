#!/bin/bash

# RapidTriageME Browser Connector Startup Script
# This starts the TypeScript browser-connector with all required endpoints

echo "🚀 Starting RapidTriageME Browser Connector..."

# Change to the server directory
cd "$(dirname "$0")"

# Check if TypeScript is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js and npm."
    exit 1
fi

# Check if ts-node is available
if ! npx ts-node --version &> /dev/null 2>&1; then
    echo "📦 Installing ts-node..."
    npm install --save-dev ts-node typescript @types/node
fi

# Set environment variables
export PORT=3025
export NODE_ENV=development

echo "✅ Starting browser-connector on port $PORT..."
echo "📝 This server includes:"
echo "   - Chrome extension endpoints (/extension-log, /extension-ws)"
echo "   - Identity endpoint (/.identity)"
echo "   - Screenshot capture support"
echo "   - WebSocket support for real-time communication"
echo ""

# Run the TypeScript browser connector
npx ts-node browser-connector.ts