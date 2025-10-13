#!/bin/bash

# ============================================================================
# OAuth Providers Setup Script for RapidTriageME
# ============================================================================
# This script sets up OAuth credentials for Google, GitHub, and Azure AD
# for integration with Keycloak SSO
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Setting up OAuth Providers for RapidTriageME${NC}\n"

# Check for required tools
check_requirements() {
    local missing_tools=()

    command -v gcloud >/dev/null 2>&1 || missing_tools+=("gcloud")
    command -v gh >/dev/null 2>&1 || missing_tools+=("gh")
    command -v az >/dev/null 2>&1 || missing_tools+=("az")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")

    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
}

# ============================================================================
# Google Cloud OAuth Setup
# ============================================================================
setup_google_oauth() {
    echo -e "${YELLOW}📊 Setting up Google Cloud OAuth...${NC}"

    # Check if already logged in
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo "Please login to Google Cloud:"
        gcloud auth login
    fi

    # Get or create project
    read -p "Enter your Google Cloud project ID (or press enter for 'rapidtriage-me'): " GCP_PROJECT
    GCP_PROJECT=${GCP_PROJECT:-rapidtriage-me}

    # Check if project exists, create if not
    if ! gcloud projects describe "$GCP_PROJECT" >/dev/null 2>&1; then
        echo "Creating project $GCP_PROJECT..."
        gcloud projects create "$GCP_PROJECT" --name="RapidTriageME"
    fi

    gcloud config set project "$GCP_PROJECT"

    # Enable required APIs
    echo "Enabling required APIs..."
    gcloud services enable oauth2.googleapis.com
    gcloud services enable iap.googleapis.com
    gcloud services enable cloudidentity.googleapis.com

    # Create OAuth consent screen configuration
    echo "Configuring OAuth consent screen..."
    cat > oauth-consent.json <<EOF
{
  "displayName": "RapidTriageME",
  "supportEmail": "support@rapidtriage.me",
  "applicationTitle": "RapidTriageME - Browser Debugging Platform",
  "applicationHomepage": "https://rapidtriage.me",
  "applicationPrivacyPolicyUri": "https://rapidtriage.me/privacy",
  "applicationTermsOfServiceUri": "https://rapidtriage.me/terms",
  "authorizedDomains": ["rapidtriage.me", "auth.yarlis.ai"],
  "scopes": [
    "openid",
    "email",
    "profile"
  ]
}
EOF

    # Create OAuth 2.0 credentials using the console API
    echo "Creating OAuth 2.0 credentials..."

    # Note: gcloud doesn't have a direct command for OAuth client creation
    # We'll use the API directly
    ACCESS_TOKEN=$(gcloud auth print-access-token)

    # Create OAuth client
    OAUTH_RESPONSE=$(curl -s -X POST \
        "https://oauth2.googleapis.com/v1/projects/${GCP_PROJECT}/clients" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "client_id": "rapidtriage-oauth",
            "client_type": "WEB",
            "display_name": "RapidTriageME OAuth Client",
            "redirect_uris": [
                "https://auth.yarlis.ai/realms/rapidtriage-production/broker/google/endpoint",
                "https://rapidtriage.me/auth/callback",
                "http://localhost:3000/auth/callback"
            ],
            "javascript_origins": [
                "https://rapidtriage.me",
                "https://auth.yarlis.ai",
                "http://localhost:3000"
            ]
        }')

    # For now, we'll output instructions for manual creation
    echo -e "${YELLOW}⚠️  Google OAuth client must be created manually:${NC}"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$GCP_PROJECT"
    echo "2. Click 'Create Credentials' > 'OAuth client ID'"
    echo "3. Choose 'Web application'"
    echo "4. Name: 'RapidTriageME OAuth'"
    echo "5. Add Authorized redirect URIs:"
    echo "   - https://auth.yarlis.ai/realms/rapidtriage-production/broker/google/endpoint"
    echo "   - https://rapidtriage.me/auth/callback"
    echo "   - http://localhost:3000/auth/callback"
    echo "6. Add Authorized JavaScript origins:"
    echo "   - https://rapidtriage.me"
    echo "   - https://auth.yarlis.ai"
    echo ""
    read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
    read -s -p "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET
    echo ""

    # Save to file
    cat > google-oauth.json <<EOF
{
  "client_id": "$GOOGLE_CLIENT_ID",
  "client_secret": "$GOOGLE_CLIENT_SECRET"
}
EOF

    echo -e "${GREEN}✅ Google OAuth credentials saved to google-oauth.json${NC}\n"
}

# ============================================================================
# GitHub OAuth Setup
# ============================================================================
setup_github_oauth() {
    echo -e "${YELLOW}🐙 Setting up GitHub OAuth App...${NC}"

    # Check if gh is authenticated
    if ! gh auth status >/dev/null 2>&1; then
        echo "Please login to GitHub:"
        gh auth login
    fi

    # Check if app already exists
    APP_NAME="RapidTriageME"
    EXISTING_APP=$(gh api /user/apps --jq ".[] | select(.name==\"$APP_NAME\") | .client_id" 2>/dev/null || echo "")

    if [ -n "$EXISTING_APP" ]; then
        echo "OAuth App '$APP_NAME' already exists."
        read -p "Do you want to use the existing app? (y/n): " USE_EXISTING

        if [ "$USE_EXISTING" = "y" ]; then
            GITHUB_CLIENT_ID="$EXISTING_APP"
            echo "Using existing app with Client ID: $GITHUB_CLIENT_ID"
        else
            # Delete existing app
            echo "Deleting existing app..."
            gh api -X DELETE "/user/apps/$EXISTING_APP"
        fi
    fi

    if [ -z "$GITHUB_CLIENT_ID" ]; then
        # Create new OAuth App
        echo "Creating GitHub OAuth App..."

        RESPONSE=$(gh api \
            --method POST \
            -H "Accept: application/vnd.github+json" \
            /user/apps \
            -f name="$APP_NAME" \
            -f url="https://rapidtriage.me" \
            -f description="Browser debugging and monitoring platform" \
            -f callback_url="https://auth.yarlis.ai/realms/rapidtriage-production/broker/github/endpoint")

        GITHUB_CLIENT_ID=$(echo "$RESPONSE" | jq -r '.client_id')
        GITHUB_CLIENT_SECRET=$(echo "$RESPONSE" | jq -r '.client_secret')

        # Add additional redirect URIs
        gh api \
            --method PATCH \
            "/user/apps/$GITHUB_CLIENT_ID" \
            -f callback_urls[]="https://auth.yarlis.ai/realms/rapidtriage-production/broker/github/endpoint" \
            -f callback_urls[]="https://rapidtriage.me/auth/callback" \
            -f callback_urls[]="http://localhost:3000/auth/callback"
    else
        # Get client secret for existing app
        echo -e "${YELLOW}⚠️  Please get the Client Secret from GitHub:${NC}"
        echo "1. Go to: https://github.com/settings/developers"
        echo "2. Click on 'RapidTriageME' OAuth App"
        echo "3. Generate a new client secret if needed"
        read -s -p "Enter GitHub Client Secret: " GITHUB_CLIENT_SECRET
        echo ""
    fi

    # Save to file
    cat > github-oauth.json <<EOF
{
  "client_id": "$GITHUB_CLIENT_ID",
  "client_secret": "$GITHUB_CLIENT_SECRET"
}
EOF

    echo -e "${GREEN}✅ GitHub OAuth credentials saved to github-oauth.json${NC}\n"
}

# ============================================================================
# Azure AD OAuth Setup
# ============================================================================
setup_azure_oauth() {
    echo -e "${YELLOW}☁️  Setting up Azure AD OAuth...${NC}"

    # Check if az is logged in
    if ! az account show >/dev/null 2>&1; then
        echo "Please login to Azure:"
        az login
    fi

    APP_NAME="RapidTriageME"

    # Check if app already exists
    EXISTING_APP=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

    if [ -n "$EXISTING_APP" ]; then
        echo "Azure AD App '$APP_NAME' already exists."
        read -p "Do you want to use the existing app? (y/n): " USE_EXISTING

        if [ "$USE_EXISTING" = "y" ]; then
            APP_ID="$EXISTING_APP"
            echo "Using existing app with App ID: $APP_ID"
        else
            # Delete existing app
            echo "Deleting existing app..."
            az ad app delete --id "$EXISTING_APP"
        fi
    fi

    if [ -z "$APP_ID" ]; then
        # Create new app registration
        echo "Creating Azure AD App Registration..."

        APP_ID=$(az ad app create \
            --display-name "$APP_NAME" \
            --sign-in-audience "AzureADandPersonalMicrosoftAccount" \
            --web-redirect-uris \
                "https://auth.yarlis.ai/realms/rapidtriage-production/broker/microsoft/endpoint" \
                "https://rapidtriage.me/auth/callback" \
                "http://localhost:3000/auth/callback" \
            --enable-id-token-issuance true \
            --enable-access-token-issuance true \
            --query appId -o tsv)
    fi

    # Create or reset client secret
    echo "Creating client secret..."
    SECRET_RESPONSE=$(az ad app credential reset --id "$APP_ID" --years 2)

    AZURE_CLIENT_ID="$APP_ID"
    AZURE_CLIENT_SECRET=$(echo "$SECRET_RESPONSE" | jq -r '.password')
    AZURE_TENANT_ID=$(echo "$SECRET_RESPONSE" | jq -r '.tenant')

    # Configure API permissions
    echo "Configuring API permissions..."

    # Add Microsoft Graph permissions
    az ad app permission add --id "$APP_ID" \
        --api 00000003-0000-0000-c000-000000000000 \
        --api-permissions \
            37f7f235-527c-4136-accd-4a02d197296e=Scope \
            14dad69e-099b-42c9-810b-d002981feec1=Scope \
            e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

    # Grant admin consent (requires admin privileges)
    echo "Attempting to grant admin consent..."
    az ad app permission admin-consent --id "$APP_ID" 2>/dev/null || \
        echo -e "${YELLOW}⚠️  Admin consent required - please grant in Azure Portal${NC}"

    # Save to file
    cat > azure-oauth.json <<EOF
{
  "appId": "$AZURE_CLIENT_ID",
  "password": "$AZURE_CLIENT_SECRET",
  "tenant": "$AZURE_TENANT_ID"
}
EOF

    echo -e "${GREEN}✅ Azure AD OAuth credentials saved to azure-oauth.json${NC}\n"
}

# ============================================================================
# Generate environment variables file
# ============================================================================
generate_env_file() {
    echo -e "${YELLOW}📝 Generating environment variables...${NC}"

    # Read from JSON files if they exist
    if [ -f "google-oauth.json" ]; then
        GOOGLE_CLIENT_ID=$(jq -r '.client_id' google-oauth.json)
        GOOGLE_CLIENT_SECRET=$(jq -r '.client_secret' google-oauth.json)
    fi

    if [ -f "github-oauth.json" ]; then
        GITHUB_CLIENT_ID=$(jq -r '.client_id' github-oauth.json)
        GITHUB_CLIENT_SECRET=$(jq -r '.client_secret' github-oauth.json)
    fi

    if [ -f "azure-oauth.json" ]; then
        AZURE_CLIENT_ID=$(jq -r '.appId' azure-oauth.json)
        AZURE_CLIENT_SECRET=$(jq -r '.password' azure-oauth.json)
        AZURE_TENANT_ID=$(jq -r '.tenant' azure-oauth.json)
    fi

    # Create .env.oauth file
    cat > .env.oauth <<EOF
# OAuth Provider Credentials
# Generated: $(date)

# Google OAuth
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# GitHub OAuth
GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET

# Azure AD OAuth
AZURE_CLIENT_ID=$AZURE_CLIENT_ID
AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET
AZURE_TENANT_ID=$AZURE_TENANT_ID

# Keycloak Configuration
KEYCLOAK_URL=https://auth.yarlis.ai
KEYCLOAK_REALM=rapidtriage-production
KEYCLOAK_ADMIN_USER=root
KEYCLOAK_ADMIN_PASSWORD=BkdNHvll-QeL5-lngxWKcs
EOF

    echo -e "${GREEN}✅ Environment variables saved to .env.oauth${NC}"

    # Add to .gitignore
    if ! grep -q ".env.oauth" .gitignore 2>/dev/null; then
        echo ".env.oauth" >> .gitignore
        echo "google-oauth.json" >> .gitignore
        echo "github-oauth.json" >> .gitignore
        echo "azure-oauth.json" >> .gitignore
        echo -e "${GREEN}✅ Added OAuth files to .gitignore${NC}"
    fi
}

# ============================================================================
# Main execution
# ============================================================================
main() {
    check_requirements

    echo "This script will set up OAuth providers for:"
    echo "  1. Google Cloud"
    echo "  2. GitHub"
    echo "  3. Azure AD"
    echo ""

    read -p "Do you want to set up Google OAuth? (y/n): " SETUP_GOOGLE
    read -p "Do you want to set up GitHub OAuth? (y/n): " SETUP_GITHUB
    read -p "Do you want to set up Azure OAuth? (y/n): " SETUP_AZURE

    if [ "$SETUP_GOOGLE" = "y" ]; then
        setup_google_oauth
    fi

    if [ "$SETUP_GITHUB" = "y" ]; then
        setup_github_oauth
    fi

    if [ "$SETUP_AZURE" = "y" ]; then
        setup_azure_oauth
    fi

    generate_env_file

    echo -e "\n${GREEN}✅ OAuth setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Source the environment variables: source .env.oauth"
    echo "2. Run Keycloak setup: node scripts/keycloak-setup.js --env production"
    echo "3. Deploy secrets to Cloudflare: ./scripts/deploy-secrets.sh"
}

# Run main function
main "$@"