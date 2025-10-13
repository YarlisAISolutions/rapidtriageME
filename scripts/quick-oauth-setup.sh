#!/bin/bash

# Quick OAuth Setup for RapidTriageME
# This script provides manual OAuth credentials and runs Keycloak setup

echo "🔐 Quick OAuth Setup for RapidTriageME"
echo "======================================"
echo ""

# Create OAuth configuration files with placeholder values
# These will need to be updated with actual credentials

# Google OAuth (needs manual creation)
cat > google-oauth.json <<EOF
{
  "client_id": "YOUR_GOOGLE_CLIENT_ID",
  "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
  "note": "Create at https://console.cloud.google.com/apis/credentials"
}
EOF

# GitHub OAuth (can be created via Settings > Developer settings)
cat > github-oauth.json <<EOF
{
  "client_id": "YOUR_GITHUB_CLIENT_ID",
  "client_secret": "YOUR_GITHUB_CLIENT_SECRET",
  "note": "Create at https://github.com/settings/developers"
}
EOF

# Azure AD OAuth (optional)
cat > azure-oauth.json <<EOF
{
  "appId": "YOUR_AZURE_CLIENT_ID",
  "password": "YOUR_AZURE_CLIENT_SECRET",
  "tenant": "YOUR_AZURE_TENANT_ID",
  "note": "Create at https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps"
}
EOF

echo "📝 Created OAuth configuration templates:"
echo "   - google-oauth.json"
echo "   - github-oauth.json"
echo "   - azure-oauth.json"
echo ""
echo "⚠️  IMPORTANT: You need to:"
echo ""
echo "1. Create a Google OAuth Client:"
echo "   - Go to: https://console.cloud.google.com/apis/credentials"
echo "   - Create OAuth 2.0 Client ID (Web application)"
echo "   - Add redirect URI: https://auth.yarlis.ai/realms/rapidtriage-production/broker/google/endpoint"
echo ""
echo "2. Create a GitHub OAuth App:"
echo "   - Go to: https://github.com/settings/developers"
echo "   - New OAuth App"
echo "   - Authorization callback URL: https://auth.yarlis.ai/realms/rapidtriage-production/broker/github/endpoint"
echo ""
echo "3. (Optional) Create Azure AD App Registration:"
echo "   - Go to: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps"
echo "   - New registration"
echo "   - Redirect URI: https://auth.yarlis.ai/realms/rapidtriage-production/broker/microsoft/endpoint"
echo ""

# Create environment file
cat > .env.keycloak <<EOF
# Keycloak Configuration
KEYCLOAK_URL=https://auth.yarlis.ai
KEYCLOAK_REALM=rapidtriage-production
KEYCLOAK_ADMIN_USER=root
KEYCLOAK_ADMIN_PASSWORD=BkdNHvll-QeL5-lngxWKcs

# OAuth Providers (update with your actual values)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
EOF

echo "📋 Created .env.keycloak file for configuration"
echo ""
echo "Once you have the OAuth credentials, update .env.keycloak and run:"
echo "  source .env.keycloak && node scripts/keycloak-setup.js --env production"