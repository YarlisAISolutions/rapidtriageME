# Domain and Subdomain Setup Guide

This guide explains how to set up custom domains and subdomains for your RapidTriageME deployment, using our `docs.rapidtriage.me` setup as a real-world example.

## Overview

When deploying web applications, you may need to set up:
- **Primary domain** (e.g., `rapidtriage.me`) - Main application
- **Subdomains** (e.g., `docs.rapidtriage.me`, `api.rapidtriage.me`) - Additional services
- **SSL certificates** - Secure HTTPS connections

## Prerequisites

Before starting, ensure you have:
- Domain registered with a domain registrar
- Cloudflare account (free tier works)
- GitHub account (for GitHub Pages hosting)
- Access to DNS management

## Step-by-Step Domain Setup

### 1. Primary Domain Setup

#### Step 1.1: Add Domain to Cloudflare

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter your domain (e.g., `rapidtriage.me`)
4. Select a plan (Free tier is sufficient)
5. Cloudflare will scan existing DNS records

#### Step 1.2: Update Nameservers

1. Copy the Cloudflare nameservers provided
2. Go to your domain registrar (e.g., Namecheap, GoDaddy)
3. Update nameservers to Cloudflare's:
   ```
   Example:
   - elsa.ns.cloudflare.com
   - garry.ns.cloudflare.com
   ```

#### Step 1.3: Configure DNS for Primary Domain

For Cloudflare Workers deployment:
```bash
# No A or CNAME record needed for Workers
# Workers use routes configured in wrangler.toml
```

### 2. Subdomain Setup (Using docs.rapidtriage.me as Example)

#### Step 2.1: GitHub Pages Configuration

1. Create a GitHub repository for your documentation
2. Enable GitHub Pages in repository settings
3. Add a `CNAME` file to your site root:
   ```
   docs.rapidtriage.me
   ```

#### Step 2.2: Cloudflare DNS Configuration

Create a CNAME record with proxy enabled:

```bash
# Using Cloudflare API
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "docs",
    "content": "yourusername.github.io",
    "ttl": 1,
    "proxied": true
  }'
```

Or via Cloudflare Dashboard:
1. Go to DNS settings
2. Add record:
   - Type: `CNAME`
   - Name: `docs`
   - Target: `yourusername.github.io`
   - Proxy status: **Proxied (Orange cloud ON)**

### 3. SSL Configuration

#### Step 3.1: Cloudflare SSL Settings

1. Navigate to SSL/TLS settings
2. Set encryption mode to **Full**
3. Enable "Always Use HTTPS"

#### Step 3.2: Fix SSL Certificate Issues

If you encounter SSL certificate errors (like `*.github.io` certificate showing):

```bash
#!/bin/bash
# fix-subdomain-ssl.sh

ZONE_ID="your_zone_id"
API_TOKEN="your_api_token"
SUBDOMAIN="docs"
TARGET="yourusername.github.io"

# Remove existing non-proxied record
curl -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${SUBDOMAIN}.yourdomain.com" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  | jq -r '.result[].id' \
  | xargs -I {} curl -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/{}" \
  -H "Authorization: Bearer ${API_TOKEN}"

# Create new proxied record
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "'${SUBDOMAIN}'",
    "content": "'${TARGET}'",
    "ttl": 1,
    "proxied": true
  }'
```

## Complete Deployment Process for New Domain

### Phase 1: Domain Registration & Setup
```markdown
1. Register domain at registrar
2. Add domain to Cloudflare
3. Update nameservers to Cloudflare
4. Wait for DNS propagation (5-48 hours)
```

### Phase 2: Application Deployment
```markdown
1. Configure wrangler.toml with domain routes
2. Deploy Worker application
3. Set up environment variables
4. Test deployment
```

### Phase 3: Subdomain Configuration
```markdown
1. Create subdomain DNS records
2. Enable Cloudflare proxy for SSL
3. Configure target service (GitHub Pages, etc.)
4. Verify SSL certificates
```

## Real-World Example: RapidTriageME Setup

Here's exactly how we configured RapidTriageME:

### Main Application (rapidtriage.me)

**wrangler.toml configuration:**
```toml
[[env.production.routes]]
pattern = "rapidtriage.me/*"
zone_id = "dba0cbc72f7f0b7727fbdb6f4d6d7901"

[[env.production.routes]]
pattern = "www.rapidtriage.me/*"
zone_id = "dba0cbc72f7f0b7727fbdb6f4d6d7901"
```

**Deployment command:**
```bash
wrangler deploy --env production
```

### Documentation Site (docs.rapidtriage.me)

**DNS Configuration:**
- Type: CNAME
- Name: docs
- Content: yarlisaisolutions.github.io
- Proxy: Enabled (Orange cloud)
- SSL: Full encryption

**GitHub Pages Setup:**
1. Repository: `YarlisAISolutions/rapidtriageME`
2. Branch: `gh-pages` or `main`
3. CNAME file: `docs.rapidtriage.me`

## Automated Deployment Script

Create a complete deployment script for new domains:

```bash
#!/bin/bash
# deploy-new-domain.sh

# Configuration
DOMAIN="yournewdomain.com"
SUBDOMAIN="docs"
GITHUB_USER="yourusername"
CLOUDFLARE_EMAIL="your@email.com"
CLOUDFLARE_API_KEY="your_api_key"

# Step 1: Add domain to Cloudflare
echo "Adding domain to Cloudflare..."
curl -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "X-Auth-Key: ${CLOUDFLARE_API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"name":"'${DOMAIN}'","jump_start":true}'

# Step 2: Get Zone ID
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "X-Auth-Key: ${CLOUDFLARE_API_KEY}" \
  | jq -r '.result[0].id')

echo "Zone ID: ${ZONE_ID}"

# Step 3: Configure DNS for subdomain
echo "Setting up ${SUBDOMAIN}.${DOMAIN}..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "X-Auth-Key: ${CLOUDFLARE_API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "'${SUBDOMAIN}'",
    "content": "'${GITHUB_USER}'.github.io",
    "ttl": 1,
    "proxied": true
  }'

# Step 4: Configure SSL
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/ssl" \
  -H "X-Auth-Email: ${CLOUDFLARE_EMAIL}" \
  -H "X-Auth-Key: ${CLOUDFLARE_API_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"value":"full"}'

echo "Domain setup complete!"
```

## Troubleshooting Common Issues

### SSL Certificate Errors

**Problem:** Browser shows "Not Secure" or wrong certificate
**Solution:** 
1. Ensure Cloudflare proxy is enabled (orange cloud)
2. Set SSL mode to "Full"
3. Wait 5-15 minutes for propagation
4. Clear browser cache

### DNS Not Resolving

**Problem:** Domain doesn't load
**Solution:**
1. Check nameservers are pointing to Cloudflare
2. Verify DNS records in Cloudflare dashboard
3. Use `nslookup` or `dig` to test:
   ```bash
   nslookup yourdomain.com
   dig yourdomain.com
   ```

### GitHub Pages 404 Error

**Problem:** Subdomain shows 404
**Solution:**
1. Verify CNAME file in repository
2. Check GitHub Pages is enabled in settings
3. Ensure branch and folder settings are correct
4. Wait 10 minutes for GitHub Pages deployment

### Mixed Content Warnings

**Problem:** HTTPS site loading HTTP resources
**Solution:**
1. Enable "Automatic HTTPS Rewrites" in Cloudflare
2. Update all resource URLs to use HTTPS
3. Check for hardcoded HTTP URLs in code

## Best Practices

1. **Always use Cloudflare proxy** for SSL certificates
2. **Set up monitoring** for domain expiration
3. **Document DNS configurations** for team reference
4. **Use environment variables** for domain-specific settings
5. **Test in staging** before production deployment
6. **Keep DNS records minimal** and organized
7. **Enable DNSSEC** for additional security
8. **Set up email routing** for domain emails

## Quick Reference Commands

```bash
# Check DNS propagation
nslookup yourdomain.com 8.8.8.8

# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check HTTP headers
curl -I https://yourdomain.com

# Verify CNAME record
dig CNAME subdomain.yourdomain.com

# Test from different locations
curl -I https://yourdomain.com --resolve yourdomain.com:443:104.21.22.49
```

## Next Steps

After setting up your domain:
1. Configure monitoring and alerts
2. Set up backup DNS records
3. Implement CDN caching rules
4. Configure firewall rules
5. Set up analytics tracking

---

*This guide is based on the actual deployment of RapidTriageME and its documentation site. Follow these exact steps for reliable domain configuration.*