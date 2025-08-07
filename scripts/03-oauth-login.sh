#!/bin/bash

# Unset all Cloudflare-related environment variables
unset CLOUDFLARE_API_TOKEN
unset CF_API_TOKEN
unset CLOUDFLARE_ZONE_ID
unset CF_ACCOUNT_ID
unset CLOUDFLARE_ACCOUNT_ID

# Verify they're unset
echo "Checking environment variables..."
env | grep -E "CLOUDFLARE|CF_API" || echo "✅ All API tokens cleared"

# Now login via OAuth
echo "Logging in via OAuth..."
wrangler login