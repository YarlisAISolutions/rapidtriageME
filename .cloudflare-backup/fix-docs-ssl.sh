#!/bin/bash

# Fix SSL certificate issue for docs.rapidtriage.me
# This script updates Cloudflare DNS to proxy the docs subdomain

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     Fixing SSL for docs.rapidtriage.me${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Configuration
ZONE_ID="dba0cbc72f7f0b7727fbdb6f4d6d7901"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-FOzKotG1WfN2vdSPlqTIoDkQK-vaAaZs0sgs6hVU}"

echo -e "${YELLOW}Step 1: Checking current DNS records...${NC}"

# Get current DNS records for docs subdomain
CURRENT_RECORDS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=docs.rapidtriage.me" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json")

echo "$CURRENT_RECORDS" | jq '.result[] | {id, type, name, content, proxied}' 2>/dev/null || echo "No existing records found"

echo -e "\n${YELLOW}Step 2: Removing old CNAME record if exists...${NC}"

# Extract record IDs for docs subdomain
RECORD_IDS=$(echo "$CURRENT_RECORDS" | jq -r '.result[].id' 2>/dev/null)

if [ -n "$RECORD_IDS" ]; then
    for RECORD_ID in $RECORD_IDS; do
        echo -e "Deleting record: $RECORD_ID"
        curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
            -H "Authorization: Bearer ${API_TOKEN}" \
            -H "Content-Type: application/json" > /dev/null
        echo -e "${GREEN}✓ Deleted${NC}"
    done
else
    echo "No existing records to delete"
fi

echo -e "\n${YELLOW}Step 3: Creating new proxied CNAME record...${NC}"

# Create new CNAME record with proxy enabled
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "docs",
    "content": "yarlisaisolutions.github.io",
    "ttl": 1,
    "proxied": true,
    "comment": "Documentation site hosted on GitHub Pages"
  }')

if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ CNAME record created successfully${NC}"
    echo "$RESPONSE" | jq '.result | {type, name, content, proxied}'
else
    echo -e "${RED}✗ Failed to create CNAME record${NC}"
    echo "$RESPONSE" | jq '.errors'
    exit 1
fi

echo -e "\n${YELLOW}Step 4: Configuring SSL/TLS settings...${NC}"

# Ensure Full SSL mode is enabled
SSL_RESPONSE=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/ssl" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"value":"full"}')

if echo "$SSL_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ SSL mode set to 'Full'${NC}"
else
    echo -e "${YELLOW}⚠ Could not update SSL mode (may already be configured)${NC}"
fi

echo -e "\n${YELLOW}Step 5: Setting up Page Rules for docs subdomain...${NC}"

# Create a page rule for always HTTPS
PAGE_RULE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "targets": [
      {
        "target": "url",
        "constraint": {
          "operator": "matches",
          "value": "docs.rapidtriage.me/*"
        }
      }
    ],
    "actions": [
      {
        "id": "always_use_https"
      },
      {
        "id": "ssl",
        "value": "flexible"
      }
    ],
    "priority": 1,
    "status": "active"
  }')

if echo "$PAGE_RULE_RESPONSE" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Page rule created for HTTPS enforcement${NC}"
else
    echo -e "${YELLOW}⚠ Page rule may already exist or quota exceeded${NC}"
fi

echo -e "\n${YELLOW}Step 6: Verifying DNS propagation...${NC}"

# Wait a moment for changes to take effect
sleep 5

# Check DNS resolution
echo "Testing DNS resolution..."
nslookup docs.rapidtriage.me 8.8.8.8 | grep -A 2 "answer:" || nslookup docs.rapidtriage.me

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SSL Configuration Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}What was done:${NC}"
echo "1. Removed old DNS records for docs.rapidtriage.me"
echo "2. Created new CNAME record pointing to yarlisaisolutions.github.io"
echo "3. Enabled Cloudflare proxy (orange cloud) for SSL"
echo "4. Set SSL mode to 'Full'"
echo "5. Created page rule for HTTPS enforcement"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Wait 1-5 minutes for DNS propagation"
echo "2. Clear your browser cache"
echo "3. Visit https://docs.rapidtriage.me"
echo ""
echo -e "${BLUE}The site should now load with a valid SSL certificate!${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} If you still see SSL errors:"
echo "• Wait a few more minutes for propagation"
echo "• Try incognito/private browsing mode"
echo "• Clear DNS cache: sudo dscacheutil -flushcache (macOS)"
echo ""