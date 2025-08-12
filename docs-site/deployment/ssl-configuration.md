# SSL/TLS Configuration Guide

Complete guide for setting up SSL certificates and fixing common SSL issues with Cloudflare and custom domains.

## Understanding SSL with Cloudflare

### How SSL Works in Our Setup

```mermaid
graph LR
    A[User Browser] -->|HTTPS| B[Cloudflare Edge]
    B -->|Proxied| C[Origin Server]
    B -->|SSL Cert| D[Valid Certificate]
    C -->|GitHub Pages| E[*.github.io cert]
    
    style B fill:#f96,stroke:#333,stroke-width:4px
    style D fill:#9f6,stroke:#333,stroke-width:2px
```

### SSL Modes Explained

| Mode | Description | When to Use |
|------|-------------|------------|
| **Off** | No encryption | Never (insecure) |
| **Flexible** | Browser→Cloudflare encrypted | Not recommended |
| **Full** | End-to-end encryption | GitHub Pages, most hosting |
| **Full (Strict)** | Requires valid origin cert | Production with own cert |

## Setting Up SSL for Different Scenarios

### Scenario 1: Cloudflare Workers (Main Domain)

**Example:** `rapidtriage.me`

Workers automatically handle SSL through Cloudflare:

```toml
# wrangler.toml
[[routes]]
pattern = "yourdomain.com/*"
zone_id = "your_zone_id"
```

No additional SSL configuration needed!

### Scenario 2: GitHub Pages (Subdomain)

**Example:** `docs.rapidtriage.me`

This is the trickiest scenario that often causes SSL errors.

#### The Problem
- GitHub Pages serves content with `*.github.io` certificate
- Direct CNAME to GitHub causes certificate mismatch
- Browser shows "Not Secure" warning

#### The Solution

1. **Enable Cloudflare Proxy (Orange Cloud)**
   ```json
   {
     "type": "CNAME",
     "name": "docs",
     "content": "username.github.io",
     "proxied": true  // This is crucial!
   }
   ```

2. **Set SSL Mode to Full**
   - Go to SSL/TLS → Overview
   - Select "Full" encryption mode

3. **Wait for Propagation**
   - Takes 5-15 minutes
   - Clear browser cache

### Scenario 3: Custom Backend (API Subdomain)

**Example:** `api.rapidtriage.me`

For Cloud Run or custom servers:

```bash
# Point to your backend
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  --data '{
    "type": "A",
    "name": "api",
    "content": "35.201.125.74",
    "proxied": true
  }'
```

## Complete SSL Fix Script

Here's the actual script we used to fix `docs.rapidtriage.me`:

```bash
#!/bin/bash
# fix-ssl-for-subdomain.sh
# This script fixes SSL certificate issues for subdomains

set -e

# Configuration - Replace with your values
ZONE_ID="dba0cbc72f7f0b7727fbdb6f4d6d7901"
API_TOKEN="your_cloudflare_api_token"
SUBDOMAIN="docs"
DOMAIN="rapidtriage.me"
TARGET="yarlisaisolutions.github.io"

echo "🔐 Fixing SSL for ${SUBDOMAIN}.${DOMAIN}"

# Step 1: Get existing records
echo "Checking existing DNS records..."
RECORDS=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${SUBDOMAIN}.${DOMAIN}" \
  -H "Authorization: Bearer ${API_TOKEN}")

# Step 2: Delete non-proxied records
echo "Removing non-proxied records..."
echo "$RECORDS" | jq -r '.result[] | select(.proxied == false) | .id' | while read -r id; do
  curl -s -X DELETE \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${id}" \
    -H "Authorization: Bearer ${API_TOKEN}"
  echo "Deleted record: ${id}"
done

# Step 3: Create proxied CNAME
echo "Creating proxied CNAME record..."
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "'${SUBDOMAIN}'",
    "content": "'${TARGET}'",
    "ttl": 1,
    "proxied": true,
    "comment": "SSL-enabled subdomain"
  }' | jq '.success'

# Step 4: Configure SSL settings
echo "Configuring SSL to Full mode..."
curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/ssl" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"value":"full"}' | jq '.success'

# Step 5: Enable Always HTTPS
echo "Enabling Always Use HTTPS..."
curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/always_use_https" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"value":"on"}' | jq '.success'

echo "✅ SSL configuration complete!"
echo "Wait 5-15 minutes for full propagation"
```

## SSL Verification Commands

### Check Certificate Details
```bash
# View certificate information
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -text

# Quick certificate check
curl -vI https://yourdomain.com 2>&1 | grep -A 5 "SSL certificate"

# Check certificate expiration
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -dates
```

### Test SSL Configuration
```bash
# SSL Labs test (comprehensive)
curl -s "https://api.ssllabs.com/api/v3/analyze?host=yourdomain.com"

# Check TLS versions supported
nmap --script ssl-enum-ciphers -p 443 yourdomain.com

# Verify certificate chain
openssl s_client -connect yourdomain.com:443 -showcerts
```

## Troubleshooting SSL Issues

### Issue 1: "Your connection is not private"

**Symptoms:**
- Browser shows privacy error
- Certificate shows `*.github.io` instead of your domain

**Fix:**
```bash
# Ensure proxy is enabled
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  --data '{"proxied": true}'
```

### Issue 2: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Symptoms:**
- Site won't load at all
- SSL handshake fails

**Fix:**
1. Check minimum TLS version in Cloudflare
2. Go to SSL/TLS → Edge Certificates
3. Set Minimum TLS Version to 1.2

### Issue 3: Mixed Content Warnings

**Symptoms:**
- Padlock shows warning
- Some resources blocked

**Fix:**
```html
<!-- Update all resources to HTTPS -->
<script src="https://example.com/script.js"></script>
<link rel="stylesheet" href="https://example.com/style.css">
<img src="https://example.com/image.jpg">

<!-- Or use protocol-relative URLs -->
<script src="//example.com/script.js"></script>
```

### Issue 4: Certificate Not Updating

**Symptoms:**
- Old certificate still showing
- Changes not reflected

**Fix:**
```bash
# Clear Cloudflare cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  --data '{"purge_everything":true}'

# Wait 5 minutes, then test in incognito mode
```

## Cloudflare SSL Settings Checklist

✅ **Essential Settings:**
- [ ] SSL/TLS encryption mode: **Full**
- [ ] Always Use HTTPS: **On**
- [ ] Automatic HTTPS Rewrites: **On**
- [ ] Minimum TLS Version: **1.2**
- [ ] Opportunistic Encryption: **On**
- [ ] TLS 1.3: **Enabled**

✅ **For Subdomains:**
- [ ] CNAME record created
- [ ] Proxy status: **Proxied (Orange cloud)**
- [ ] SSL mode: **Full** (not Full Strict)
- [ ] Edge Certificate covers subdomain

✅ **For GitHub Pages:**
- [ ] CNAME file in repository
- [ ] Custom domain in GitHub settings
- [ ] DNS points to `username.github.io`
- [ ] Cloudflare proxy enabled

## Advanced SSL Configuration

### Custom Certificates

If you have your own SSL certificate:

```bash
# Upload custom certificate
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/custom_certificates" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  --data '{
    "certificate": "-----BEGIN CERTIFICATE-----...",
    "private_key": "-----BEGIN PRIVATE KEY-----...",
    "bundle_method": "optimal"
  }'
```

### Client Certificates

For mutual TLS authentication:

1. Go to SSL/TLS → Client Certificates
2. Create client certificate
3. Configure your application to require client certs

### Origin Certificates

For Full (Strict) mode:

```bash
# Generate origin certificate
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/origin_tls_client_auth" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  --data '{
    "certificate": "-----BEGIN CERTIFICATE-----...",
    "private_key": "-----BEGIN PRIVATE KEY-----..."
  }'
```

## Monitoring SSL Health

### Set Up Alerts

```bash
# Create SSL expiration alert
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/monitoring/alerts" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  --data '{
    "name": "SSL Certificate Expiring",
    "type": "ssl_expiration",
    "threshold": 30,
    "email": "admin@yourdomain.com"
  }'
```

### Regular Checks

Create a monitoring script:

```bash
#!/bin/bash
# ssl-monitor.sh

DOMAINS=("rapidtriage.me" "docs.rapidtriage.me" "api.rapidtriage.me")

for domain in "${DOMAINS[@]}"; do
  expiry=$(echo | openssl s_client -connect ${domain}:443 -servername ${domain} 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
  expiry_epoch=$(date -d "${expiry}" +%s)
  current_epoch=$(date +%s)
  days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
  
  echo "${domain}: ${days_left} days until expiration"
  
  if [ ${days_left} -lt 30 ]; then
    echo "⚠️  WARNING: Certificate expiring soon!"
  fi
done
```

## Quick Reference

### Essential URLs
- Cloudflare SSL Settings: `https://dash.cloudflare.com/YOUR_ACCOUNT/YOUR_DOMAIN/ssl-tls`
- SSL Labs Test: `https://www.ssllabs.com/ssltest/analyze.html?d=YOUR_DOMAIN`
- Certificate Transparency: `https://crt.sh/?q=YOUR_DOMAIN`

### Key API Endpoints
```bash
# SSL Settings
GET /zones/{zone_id}/settings/ssl
PATCH /zones/{zone_id}/settings/ssl

# DNS Records
GET /zones/{zone_id}/dns_records
POST /zones/{zone_id}/dns_records
PATCH /zones/{zone_id}/dns_records/{record_id}

# Certificates
GET /zones/{zone_id}/ssl/certificate_packs
POST /zones/{zone_id}/custom_certificates
```

---

*This guide is based on our actual experience fixing SSL issues for RapidTriageME and its subdomains. These solutions have been tested and proven to work.*