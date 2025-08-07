#!/bin/bash

# Add DNS records for rapidtriage.me to point to Cloudflare Workers
# Note: This requires API token with DNS edit permissions

ZONE_ID="dba0cbc72f7f0b7727fbdb6f4d6d7901"
API_TOKEN="FOzKotG1WfN2vdSPlqTIoDkQK-vaAaZs0sgs6hVU"

echo "Adding DNS records for rapidtriage.me..."

# Add root domain record (using AAAA record with Cloudflare's special IPv6 address)
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "AAAA",
    "name": "@",
    "content": "100::",
    "ttl": 1,
    "proxied": true
  }'

echo ""

# Add www subdomain record
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "AAAA",
    "name": "www",
    "content": "100::",
    "ttl": 1,
    "proxied": true
  }'

echo ""
echo "DNS records added. The domain should be accessible shortly."