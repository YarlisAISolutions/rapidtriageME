#!/bin/bash

# Setup Cloudflare Secrets for RapidTriageME
# This script configures all required secrets for production deployment

echo "🔐 Setting up Cloudflare Secrets for RapidTriageME"
echo "=================================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Function to generate secure random token
generate_token() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo "📝 Setting ${secret_name}: ${description}"
    echo "${secret_value}" | wrangler secret put "${secret_name}" --env production
    
    if [ $? -eq 0 ]; then
        echo "✅ ${secret_name} set successfully"
    else
        echo "❌ Failed to set ${secret_name}"
        return 1
    fi
    echo ""
}

# Environment selection
echo "Select environment:"
echo "1) Production (rapidtriage.me)"
echo "2) Staging"
echo "3) Development (local)"
read -p "Enter choice [1-3]: " env_choice

case $env_choice in
    1)
        ENV_NAME="production"
        echo "🚀 Configuring PRODUCTION environment"
        ;;
    2)
        ENV_NAME="staging"
        echo "🧪 Configuring STAGING environment"
        ;;
    3)
        ENV_NAME="development"
        echo "💻 Configuring DEVELOPMENT environment"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Choose setup mode:"
echo "1) Generate new secure tokens (recommended for first setup)"
echo "2) Use existing tokens from .env.local"
echo "3) Enter custom tokens manually"
read -p "Enter choice [1-3]: " setup_mode

case $setup_mode in
    1)
        echo ""
        echo "🔑 Generating new secure tokens..."
        
        # Generate new tokens
        API_TOKEN="rt_prod_$(generate_token)"
        AUTH_TOKEN="$(generate_token)"
        JWT_SECRET="$(generate_token)"
        
        echo "Generated tokens:"
        echo "  API Token: ${API_TOKEN:0:10}..."
        echo "  Auth Token: ${AUTH_TOKEN:0:10}..."
        echo "  JWT Secret: ${JWT_SECRET:0:10}..."
        ;;
        
    2)
        echo ""
        echo "📄 Reading tokens from .env.local..."
        
        if [ ! -f ".env.local" ]; then
            echo "❌ .env.local file not found"
            exit 1
        fi
        
        # Read tokens from .env.local
        API_TOKEN=$(grep "^RAPIDTRIAGE_API_TOKEN=" .env.local | cut -d'=' -f2)
        AUTH_TOKEN=$(grep "^AUTH_TOKEN=" .env.local | cut -d'=' -f2)
        JWT_SECRET=$(grep "^JWT_SECRET=" .env.local | cut -d'=' -f2)
        CLOUDFLARE_API_TOKEN=$(grep "^CLOUDFLARE_API_TOKEN=" .env.local | cut -d'=' -f2)
        ;;
        
    3)
        echo ""
        echo "📝 Enter custom tokens..."
        
        read -sp "Enter API Token: " API_TOKEN
        echo ""
        read -sp "Enter Auth Token: " AUTH_TOKEN
        echo ""
        read -sp "Enter JWT Secret: " JWT_SECRET
        echo ""
        read -sp "Enter Cloudflare API Token (optional): " CLOUDFLARE_API_TOKEN
        echo ""
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🚀 Setting Cloudflare secrets for ${ENV_NAME} environment..."
echo ""

# Set the secrets
set_secret "RAPIDTRIAGE_API_TOKEN" "${API_TOKEN}" "API authentication token for extension and external clients"
set_secret "AUTH_TOKEN" "${AUTH_TOKEN}" "Internal authentication token"
set_secret "JWT_SECRET" "${JWT_SECRET}" "JWT signing secret for secure tokens"

if [ ! -z "${CLOUDFLARE_API_TOKEN}" ]; then
    set_secret "CLOUDFLARE_API_TOKEN" "${CLOUDFLARE_API_TOKEN}" "Cloudflare API token for DNS/zone management"
fi

echo ""
echo "✅ Secrets configuration complete!"
echo ""

# Save tokens for reference (optional)
if [ "$setup_mode" == "1" ]; then
    echo "🔐 IMPORTANT: Save these tokens securely!"
    echo ""
    echo "For Chrome Extension configuration, use this API token:"
    echo "  ${API_TOKEN}"
    echo ""
    echo "You can also save these in a secure password manager."
    echo ""
    
    read -p "Would you like to save tokens to .env.${ENV_NAME}.secret? (y/n): " save_choice
    if [ "$save_choice" == "y" ]; then
        cat > ".env.${ENV_NAME}.secret" << EOF
# RapidTriageME ${ENV_NAME} Secrets
# Generated: $(date)
# KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT

RAPIDTRIAGE_API_TOKEN=${API_TOKEN}
AUTH_TOKEN=${AUTH_TOKEN}
JWT_SECRET=${JWT_SECRET}
${CLOUDFLARE_API_TOKEN:+CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}}
EOF
        chmod 600 ".env.${ENV_NAME}.secret"
        echo "✅ Secrets saved to .env.${ENV_NAME}.secret (file permissions set to 600)"
        echo "⚠️  Remember to add *.secret to .gitignore!"
    fi
fi

echo ""
echo "📋 Next steps:"
echo "1. Deploy the worker: wrangler deploy --env ${ENV_NAME}"
echo "2. Configure Chrome extension with the API token"
echo "3. Test the deployment"
echo ""
echo "🎉 Setup complete!"