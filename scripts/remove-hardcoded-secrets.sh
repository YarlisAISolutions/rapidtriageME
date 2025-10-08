#!/bin/bash

# Script to remove hardcoded secrets from the codebase
# and replace them with environment variable references

echo "🔍 Removing hardcoded secrets from codebase..."
echo "=============================================="
echo ""

# Token to replace
OLD_TOKEN="KskHe6x5tkS4CgLrwfeZvbXsSDmZUjR8"
REPLACEMENT='${RAPIDTRIAGE_API_TOKEN}'

# Files to update (excluding already processed extension files)
FILES_TO_UPDATE=(
    "test-all-buttons.sh"
    "test-mcp-buttons.js"
    "test-screenshot-upload.js"
    "deploy-production.sh"
    "test-browser-automation.js"
    "test-all-apis.js"
    "verify-mcp-setup.sh"
)

echo "Files to update:"
for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    fi
done
echo ""

# Create backup directory
BACKUP_DIR="backup-before-secret-removal-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📁 Creating backups in: $BACKUP_DIR"
echo ""

# Process each file
for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Create backup
        cp "$file" "$BACKUP_DIR/"
        
        # Replace hardcoded token with environment variable
        if [[ "$file" == *.sh ]]; then
            # For shell scripts, use ${RAPIDTRIAGE_API_TOKEN}
            sed -i '' "s/${OLD_TOKEN}/\${RAPIDTRIAGE_API_TOKEN}/g" "$file"
            
            # Add token check at the beginning of shell scripts
            if ! grep -q "RAPIDTRIAGE_API_TOKEN" "$file" | head -5; then
                # Add token check after shebang
                sed -i '' '2i\
# Check for API token\
if [ -z "$RAPIDTRIAGE_API_TOKEN" ]; then\
    echo "❌ Error: RAPIDTRIAGE_API_TOKEN environment variable not set"\
    echo "Set it using: export RAPIDTRIAGE_API_TOKEN=your_token"\
    exit 1\
fi\
' "$file"
            fi
            
        elif [[ "$file" == *.js ]]; then
            # For JavaScript files, use process.env.RAPIDTRIAGE_API_TOKEN
            sed -i '' "s/'${OLD_TOKEN}'/process.env.RAPIDTRIAGE_API_TOKEN || 'token_not_set'/g" "$file"
            sed -i '' "s/\"${OLD_TOKEN}\"/process.env.RAPIDTRIAGE_API_TOKEN || 'token_not_set'/g" "$file"
        fi
        
        echo "  ✅ Updated"
    fi
done

echo ""
echo "📝 Creating .env.example with token placeholders..."

cat > .env.example << 'EOF'
# RapidTriageME Environment Configuration Example
# Copy this file to .env.local and fill in your values

# Environment
ENVIRONMENT=development
API_BASE_URL=http://localhost:8787
BROWSER_TOOLS_PORT=3025

# Authentication Tokens (required)
RAPIDTRIAGE_API_TOKEN=your_api_token_here
AUTH_TOKEN=your_auth_token_here
JWT_SECRET=your_jwt_secret_here

# Cloudflare Configuration (optional for local dev)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_token
ZONE_ID=your_zone_id

# Service Endpoints
SSE_ENDPOINT=/sse
HEALTH_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
LOG_LEVEL=debug
EOF

echo "✅ Created .env.example"
echo ""

echo "📋 Summary:"
echo "  • Hardcoded secrets removed from ${#FILES_TO_UPDATE[@]} files"
echo "  • Backups saved to: $BACKUP_DIR"
echo "  • .env.example created with token placeholders"
echo ""
echo "⚠️  Next steps:"
echo "  1. Set environment variable: export RAPIDTRIAGE_API_TOKEN=your_token"
echo "  2. Or create .env.local from .env.example"
echo "  3. Run: source .env.local (to load variables)"
echo "  4. Deploy secrets to Cloudflare: ./scripts/setup-secrets.sh"
echo ""
echo "✅ Secret removal complete!"