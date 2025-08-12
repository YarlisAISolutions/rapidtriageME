#!/bin/bash

# Setup script for deploying RapidTriageME to a new domain
# Based on our actual deployment experience

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    RapidTriageME New Domain Setup Wizard${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Prompt for configuration
read -p "Enter your domain name (e.g., example.com): " DOMAIN
read -p "Enter subdomain for docs (e.g., docs): " DOCS_SUBDOMAIN
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter your Cloudflare Zone ID: " ZONE_ID
read -p "Enter your Cloudflare API Token: " API_TOKEN

echo ""
echo -e "${YELLOW}Configuration Summary:${NC}"
echo "Domain: ${DOMAIN}"
echo "Docs URL: ${DOCS_SUBDOMAIN}.${DOMAIN}"
echo "GitHub Pages: ${GITHUB_USER}.github.io"
echo ""

read -p "Proceed with setup? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled"
    exit 1
fi

echo -e "\n${BLUE}Step 1: Creating deployment configuration...${NC}"

# Create custom wrangler configuration
cat > wrangler-${DOMAIN}.toml << EOF
name = "rapidtriage-${DOMAIN//./-}"
main = "src/worker.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

account_id = "${ZONE_ID}"
workers_dev = false

routes = [
  { pattern = "${DOMAIN}/*", zone_id = "${ZONE_ID}" },
  { pattern = "www.${DOMAIN}/*", zone_id = "${ZONE_ID}" }
]

[vars]
ENVIRONMENT = "production"
BROWSER_TOOLS_PORT = "3025"
SSE_ENDPOINT = "/sse"
HEALTH_ENDPOINT = "/health"
METRICS_ENDPOINT = "/metrics"
DEPLOYMENT_TIMESTAMP = "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

[[kv_namespaces]]
binding = "SESSIONS"
id = "generate-new-kv-namespace-id"

[[durable_objects.bindings]]
name = "BROWSER_SESSIONS"
class_name = "BrowserSession"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["BrowserSession"]

[build]
command = "npm run build"
EOF

echo -e "${GREEN}✓ Created wrangler-${DOMAIN}.toml${NC}"

echo -e "\n${BLUE}Step 2: Setting up documentation subdomain...${NC}"

# Create CNAME file for GitHub Pages
echo "${DOCS_SUBDOMAIN}.${DOMAIN}" > site/CNAME
echo -e "${GREEN}✓ Created CNAME file${NC}"

echo -e "\n${BLUE}Step 3: Configuring Cloudflare DNS...${NC}"

# Setup main domain (if needed)
echo "Setting up main domain DNS..."
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "@",
    "content": "192.0.2.1",
    "ttl": 1,
    "proxied": true,
    "comment": "Dummy record for Cloudflare Workers"
  }' > /dev/null 2>&1 || true

# Setup docs subdomain with proxy
echo "Setting up ${DOCS_SUBDOMAIN} subdomain..."
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "'${DOCS_SUBDOMAIN}'",
    "content": "'${GITHUB_USER}'.github.io",
    "ttl": 1,
    "proxied": true,
    "comment": "Documentation site with SSL"
  }' | jq '.success' || echo "DNS record may already exist"

echo -e "${GREEN}✓ DNS records configured${NC}"

echo -e "\n${BLUE}Step 4: Configuring SSL settings...${NC}"

# Set SSL mode to Full
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/ssl" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"value":"full"}' > /dev/null

# Enable Always Use HTTPS
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/always_use_https" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"value":"on"}' > /dev/null

echo -e "${GREEN}✓ SSL configured for secure connections${NC}"

echo -e "\n${BLUE}Step 5: Creating deployment script...${NC}"

# Create custom deployment script
cat > deploy-${DOMAIN}.sh << 'EOF'
#!/bin/bash
set -e

echo "Deploying to ${DOMAIN}..."

# Build TypeScript
npm run build

# Update timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i '' "s/DEPLOYMENT_TIMESTAMP = \".*\"/DEPLOYMENT_TIMESTAMP = \"$TIMESTAMP\"/" wrangler-${DOMAIN}.toml

# Deploy to Cloudflare
wrangler deploy -c wrangler-${DOMAIN}.toml

echo "✅ Deployment complete!"
echo "Main site: https://${DOMAIN}"
echo "Docs: https://${DOCS_SUBDOMAIN}.${DOMAIN}"
EOF

chmod +x deploy-${DOMAIN}.sh
echo -e "${GREEN}✓ Created deploy-${DOMAIN}.sh${NC}"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Update nameservers at your registrar to Cloudflare"
echo "2. Wait for DNS propagation (5-48 hours)"
echo "3. Run: ./deploy-${DOMAIN}.sh"
echo "4. Push docs to GitHub: git push origin main"
echo ""
echo -e "${BLUE}Your sites will be available at:${NC}"
echo "• Main: https://${DOMAIN}"
echo "• Docs: https://${DOCS_SUBDOMAIN}.${DOMAIN}"
echo ""
echo -e "${YELLOW}Files created:${NC}"
echo "• wrangler-${DOMAIN}.toml - Cloudflare configuration"
echo "• deploy-${DOMAIN}.sh - Deployment script"
echo "• site/CNAME - GitHub Pages configuration"
echo ""
echo -e "${GREEN}Domain setup wizard complete!${NC}"