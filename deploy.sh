#!/bin/bash

# RapidTriageME Deployment Script
# YarlisAISolutions Browser Tools MCP Platform
# This script deploys the application to Cloudflare Workers

set -e

echo "🚀 RapidTriageME Deployment Script"
echo "===================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
echo "📋 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check for KV namespace
echo "🗄️ Checking KV namespace configuration..."
echo "   Note: KV namespace creation requires proper API token permissions."
echo "   If you haven't created a KV namespace yet, please:"
echo "   1. Go to Cloudflare Dashboard > Workers & Pages > KV"
echo "   2. Create a namespace called 'SESSIONS'"
echo "   3. Update the 'id' field in wrangler.toml with the namespace ID"
echo ""

# Try to create KV namespace (will fail if permissions insufficient)
if wrangler kv namespace create "SESSIONS" 2>/dev/null; then
    echo "✅ KV namespace created successfully"
    # Extract the ID from the output
    echo "   Please update wrangler.toml with the namespace ID shown above"
else
    echo "⚠️  Could not create KV namespace automatically (insufficient permissions)"
    echo "   Please create it manually in the Cloudflare dashboard"
fi

# Set secrets
echo "🔐 Setting up secrets..."
echo "   Note: Secrets are already configured in wrangler.toml"
echo "   For production, consider using 'wrangler secret' commands instead"
echo ""

# Optional: Set secrets via wrangler (more secure)
read -p "Do you want to set secrets via wrangler? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Please enter your secure authentication token:"
    read -s AUTH_TOKEN_INPUT
    echo ""
    wrangler secret put AUTH_TOKEN <<< "$AUTH_TOKEN_INPUT" || echo "Failed to set AUTH_TOKEN"
    
    echo "   Please enter your JWT secret:"
    read -s JWT_SECRET_INPUT
    echo ""
    wrangler secret put JWT_SECRET <<< "$JWT_SECRET_INPUT" || echo "Failed to set JWT_SECRET"
fi

# Deploy to staging first
echo "🎭 Deploying to staging environment..."
npm run deploy:staging

echo "✅ Staging deployment complete!"
echo "   Test at: https://staging.rapidtriage.me"
echo ""

# Ask for production deployment
read -p "Deploy to production? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    npm run deploy:production
    
    echo ""
    echo "✅ Production deployment complete!"
    echo "================================================"
    echo "🌐 Your application is now live at:"
    echo "   https://rapidtriage.me"
    echo ""
    echo "📡 SSE Endpoint: https://rapidtriage.me/sse"
    echo "🏥 Health Check: https://rapidtriage.me/health"
    echo "📊 Metrics: https://rapidtriage.me/metrics"
    echo ""
    echo "📚 MCP Client Configuration:"
    echo '{'
    echo '  "mcpServers": {'
    echo '    "rapidtriage": {'
    echo '      "type": "sse",'
    echo '      "url": "https://rapidtriage.me/sse",'
    echo '      "headers": {'
    echo '        "Authorization": "Bearer YOUR_AUTH_TOKEN"'
    echo '      }'
    echo '    }'
    echo '  }'
    echo '}'
    echo ""
    echo "🎉 Deployment successful! YarlisAISolutions RapidTriageME is ready!"
else
    echo "⏭️ Skipping production deployment."
fi