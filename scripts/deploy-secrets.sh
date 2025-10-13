#!/bin/bash

# Deploy secrets to Cloudflare Workers

echo "🔐 Deploying secrets to Cloudflare Workers"
echo "========================================="
echo ""

# Keycloak Configuration
echo "Setting Keycloak configuration..."

echo "https://auth.yarlis.ai" | wrangler secret put KEYCLOAK_URL --env production
echo "rapidtriage-production" | wrangler secret put KEYCLOAK_REALM --env production
echo "rapidtriage-webapp" | wrangler secret put KEYCLOAK_CLIENT_ID --env production

# API Client secrets from Keycloak setup
echo "d2hxYzliNXRraW1naWE1cHhk" | wrangler secret put KEYCLOAK_API_CLIENT_SECRET --env production
echo "dmk5eGtzdDZ6cm1naWE1cHhk" | wrangler secret put KEYCLOAK_MCP_CLIENT_SECRET --env production

# Generate JWT secret if not exists
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env production

# API Token for internal authentication
API_TOKEN=$(openssl rand -hex 32)
echo "$API_TOKEN" | wrangler secret put RAPIDTRIAGE_API_TOKEN --env production
echo "$API_TOKEN" | wrangler secret put AUTH_TOKEN --env production

echo ""
echo "✅ Secrets deployed successfully!"
echo ""
echo "📝 Save these values for reference:"
echo "   JWT_SECRET: $JWT_SECRET"
echo "   API_TOKEN: $API_TOKEN"
echo ""
echo "🔑 Keycloak Clients:"
echo "   Web App: rapidtriage-webapp (public)"
echo "   API: rapidtriage-api (secret: d2hxYzliNXRraW1naWE1cHhk)"
echo "   MCP: rapidtriage-mcp (secret: dmk5eGtzdDZ6cm1naWE1cHhk)"