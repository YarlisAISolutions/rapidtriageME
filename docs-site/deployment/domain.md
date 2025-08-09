# Domain Configuration

This guide covers setting up custom domains for RapidTriageME, including DNS configuration, SSL certificates, and subdomain management for optimal deployment architecture.

## Overview

A proper domain setup enables:
- **Professional URLs** - Custom branding instead of generic Worker URLs
- **SSL/TLS Security** - Automatic certificate management
- **Subdomain Organization** - Logical separation of services
- **Global Performance** - Cloudflare's edge optimization

## Domain Architecture

### Recommended Structure

```
rapidtriage.me (main domain)
├── api.rapidtriage.me        # REST API endpoints
├── ws.rapidtriage.me         # WebSocket connections
├── docs.rapidtriage.me       # Documentation site
├── cdn.rapidtriage.me        # Static assets & screenshots
├── staging.rapidtriage.me    # Staging environment
└── admin.rapidtriage.me      # Admin dashboard (future)
```

### DNS Record Types

| Record Type | Name | Target | Purpose |
|-------------|------|---------|---------|
| A | @ | 1.1.1.1 | Root domain (proxied) |
| CNAME | www | rapidtriage.me | WWW redirect |
| CNAME | api | rapidtriage.me | API subdomain |
| CNAME | ws | rapidtriage.me | WebSocket subdomain |
| CNAME | docs | rapidtriage.me | Documentation |
| CNAME | cdn | rapidtriage.me | CDN/Assets |
| CNAME | staging | rapidtriage.me | Staging environment |

## Step 1: Domain Registration

### Using Cloudflare Registrar

```bash
# Check domain availability
wrangler domains check rapidtriage.me

# Register domain through Cloudflare
wrangler domains register rapidtriage.me --years 2

# Verify registration
wrangler domains list
```

### Using External Registrar

If registering elsewhere:

1. **Register domain** with your preferred registrar
2. **Update nameservers** to Cloudflare's:
   ```
   alec.ns.cloudflare.com
   rima.ns.cloudflare.com
   ```
3. **Wait for propagation** (up to 48 hours)

## Step 2: Cloudflare Zone Setup

### Add Site to Cloudflare

```bash
# Add domain to Cloudflare
wrangler zone create rapidtriage.me

# Get zone information
wrangler zone list | grep rapidtriage

# Set zone ID for future commands
export ZONE_ID="your-zone-id-here"
```

### Configure Zone Settings

```bash
# Enable HTTPS rewrites
wrangler zone setting always_use_https --zone-id $ZONE_ID --value on

# Set minimum TLS version
wrangler zone setting min_tls_version --zone-id $ZONE_ID --value 1.2

# Enable HTTP/2
wrangler zone setting http2 --zone-id $ZONE_ID --value on

# Configure security level
wrangler zone setting security_level --zone-id $ZONE_ID --value medium
```

## Step 3: DNS Configuration

### Core DNS Records

```bash
# Root domain (A record with Cloudflare proxy)
wrangler dns record create \
  --type A \
  --name @ \
  --content 1.1.1.1 \
  --ttl 1 \
  --proxied

# WWW subdomain
wrangler dns record create \
  --type CNAME \
  --name www \
  --content rapidtriage.me \
  --ttl 1 \
  --proxied

# API subdomain
wrangler dns record create \
  --type CNAME \
  --name api \
  --content rapidtriage.me \
  --ttl 1 \
  --proxied

# WebSocket subdomain
wrangler dns record create \
  --type CNAME \
  --name ws \
  --content rapidtriage.me \
  --ttl 1 \
  --proxied
```

### Additional Subdomains

```bash
# Documentation site
wrangler dns record create \
  --type CNAME \
  --name docs \
  --content rapidtriage.me \
  --ttl 1 \
  --proxied

# CDN for assets
wrangler dns record create \
  --type CNAME \
  --name cdn \
  --content rapidtriage.me \
  --ttl 1 \
  --proxied

# Staging environment
wrangler dns record create \
  --type CNAME \
  --name staging \
  --content rapidtriage.me \
  --ttl 1 \
  --proxied
```

### Verification Records

```bash
# Add TXT record for domain verification
wrangler dns record create \
  --type TXT \
  --name @ \
  --content "rapidtriage-verification=abc123xyz789" \
  --ttl 300

# MX record for email (optional)
wrangler dns record create \
  --type MX \
  --name @ \
  --content "10 mail.rapidtriage.me" \
  --ttl 300
```

## Step 4: SSL/TLS Configuration

### Certificate Management

Cloudflare provides automatic SSL certificates:

```bash
# Check SSL status
wrangler zone ssl --zone-id $ZONE_ID

# Enable Universal SSL (usually automatic)
wrangler zone ssl universal --zone-id $ZONE_ID --enable

# Configure SSL mode (Full Strict recommended)
wrangler zone ssl --zone-id $ZONE_ID --mode full_strict
```

### Custom SSL (Enterprise Only)

For custom certificates:

```bash
# Upload custom certificate
wrangler ssl-certificate create \
  --certificate-file cert.pem \
  --private-key-file key.pem \
  --zone-id $ZONE_ID
```

### SSL Settings

```javascript
// Worker code for SSL enforcement
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Force HTTPS in production
    if (url.protocol === 'http:' && env.ENVIRONMENT === 'production') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    
    // Add security headers
    const response = await handleRequest(request, env);
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    return response;
  }
};
```

## Step 5: Worker Route Configuration

### Route Patterns

```bash
# Main domain routes
wrangler route add "rapidtriage.me/*" rapidtriage-worker-prod
wrangler route add "www.rapidtriage.me/*" rapidtriage-worker-prod

# API subdomain routes
wrangler route add "api.rapidtriage.me/*" rapidtriage-worker-prod

# WebSocket subdomain routes
wrangler route add "ws.rapidtriage.me/*" rapidtriage-worker-prod

# Staging routes
wrangler route add "staging.rapidtriage.me/*" rapidtriage-worker-staging
```

### Advanced Routing

```javascript
// Worker routing logic
async function handleRequest(request) {
  const url = new URL(request.url);
  const subdomain = url.hostname.split('.')[0];
  
  switch (subdomain) {
    case 'api':
      return handleAPI(request);
    case 'ws':
      return handleWebSocket(request);
    case 'docs':
      return handleDocs(request);
    case 'cdn':
      return handleCDN(request);
    case 'staging':
      return handleStaging(request);
    default:
      return handleMain(request);
  }
}
```

## Step 6: Page Rules & Redirects

### WWW to Non-WWW Redirect

```bash
# Create redirect rule for www
wrangler page-rule create \
  --zone-id $ZONE_ID \
  --url "www.rapidtriage.me/*" \
  --setting forwarding_url \
  --value "301,https://rapidtriage.me/\$1"
```

### API Versioning

```bash
# Redirect old API versions
wrangler page-rule create \
  --zone-id $ZONE_ID \
  --url "rapidtriage.me/api/*" \
  --setting forwarding_url \
  --value "301,https://api.rapidtriage.me/v1/\$1"
```

### Caching Rules

```javascript
// Custom caching in Worker
const CACHE_RULES = {
  'docs.rapidtriage.me': {
    '*.html': { ttl: 3600, staleWhileRevalidate: 86400 },
    '*.css': { ttl: 86400, staleWhileRevalidate: 86400 },
    '*.js': { ttl: 86400, staleWhileRevalidate: 86400 },
    '*.png': { ttl: 604800, staleWhileRevalidate: 604800 }
  },
  'cdn.rapidtriage.me': {
    '*': { ttl: 86400, staleWhileRevalidate: 86400 }
  },
  'api.rapidtriage.me': {
    '/health': { ttl: 60, staleWhileRevalidate: 120 },
    '/console-logs': { ttl: 30, staleWhileRevalidate: 60 }
  }
};

async function applyCacheRule(request, response) {
  const url = new URL(request.url);
  const rules = CACHE_RULES[url.hostname];
  
  if (rules) {
    for (const [pattern, config] of Object.entries(rules)) {
      if (matchPattern(url.pathname, pattern)) {
        response.headers.set('Cache-Control', `public, max-age=${config.ttl}, stale-while-revalidate=${config.staleWhileRevalidate}`);
        break;
      }
    }
  }
  
  return response;
}
```

## Step 7: Email Configuration

### MX Records for Email

```bash
# Primary MX record
wrangler dns record create \
  --type MX \
  --name @ \
  --content "10 mail.rapidtriage.me" \
  --ttl 300

# Backup MX record
wrangler dns record create \
  --type MX \
  --name @ \
  --content "20 mail-backup.rapidtriage.me" \
  --ttl 300
```

### SPF Record

```bash
# SPF record for email authentication
wrangler dns record create \
  --type TXT \
  --name @ \
  --content "v=spf1 include:_spf.google.com ~all" \
  --ttl 300
```

### DKIM and DMARC

```bash
# DKIM record (example)
wrangler dns record create \
  --type TXT \
  --name "default._domainkey" \
  --content "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA..." \
  --ttl 300

# DMARC policy
wrangler dns record create \
  --type TXT \
  --name "_dmarc" \
  --content "v=DMARC1; p=quarantine; rua=mailto:dmarc@rapidtriage.me" \
  --ttl 300
```

## Step 8: Subdomain Management

### Programmatic Subdomain Creation

```javascript
// Dynamic subdomain creation for user workspaces
async function createUserSubdomain(userId, workspaceName) {
  const subdomain = `${workspaceName}-${userId}.rapidtriage.me`;
  
  // Create DNS record
  await createDNSRecord({
    type: 'CNAME',
    name: subdomain,
    content: 'rapidtriage.me',
    proxied: true
  });
  
  // Add worker route
  await addWorkerRoute(`${subdomain}/*`, 'rapidtriage-workspace-worker');
  
  return subdomain;
}
```

### Wildcard Subdomain Support

```bash
# Wildcard DNS record for user subdomains
wrangler dns record create \
  --type CNAME \
  --name "*" \
  --content rapidtriage.me \
  --ttl 1 \
  --proxied

# Worker route for wildcard
wrangler route add "*.rapidtriage.me/*" rapidtriage-dynamic-worker
```

### Subdomain Routing Logic

```javascript
// Handle dynamic subdomains
function parseSubdomain(hostname) {
  const parts = hostname.split('.');
  
  if (parts.length === 3) {
    const subdomain = parts[0];
    
    // Static subdomains
    if (['api', 'ws', 'docs', 'cdn', 'staging'].includes(subdomain)) {
      return { type: 'static', name: subdomain };
    }
    
    // User workspace subdomains (format: workspace-userid)
    const match = subdomain.match(/^(\w+)-(\w+)$/);
    if (match) {
      return { 
        type: 'workspace', 
        workspace: match[1], 
        userId: match[2] 
      };
    }
    
    // Regional subdomains (format: us-east-1, eu-west-1)
    const regionMatch = subdomain.match(/^(\w+)-(\w+)-(\d+)$/);
    if (regionMatch) {
      return { 
        type: 'regional', 
        region: `${regionMatch[1]}-${regionMatch[2]}-${regionMatch[3]}` 
      };
    }
  }
  
  return { type: 'main' };
}
```

## Step 9: Performance Optimization

### Global Load Balancing

```bash
# Create origin pool
wrangler load-balancer pool create \
  --name rapidtriage-origin \
  --origins rapidtriage.me \
  --monitor-id health-monitor-id

# Create load balancer
wrangler load-balancer create \
  --name rapidtriage-lb \
  --fallback-pool rapidtriage-origin \
  --default-pools rapidtriage-origin
```

### Geographic Routing

```javascript
// Route based on user location
function getRegionalEndpoint(country) {
  const regionalMap = {
    'US': 'us.rapidtriage.me',
    'GB': 'eu.rapidtriage.me',
    'DE': 'eu.rapidtriage.me',
    'FR': 'eu.rapidtriage.me',
    'JP': 'ap.rapidtriage.me',
    'AU': 'ap.rapidtriage.me',
    'SG': 'ap.rapidtriage.me'
  };
  
  return regionalMap[country] || 'rapidtriage.me';
}

// Worker code for geographic routing
export default {
  async fetch(request) {
    const country = request.cf?.country;
    const optimalEndpoint = getRegionalEndpoint(country);
    
    if (optimalEndpoint !== new URL(request.url).hostname) {
      const url = new URL(request.url);
      url.hostname = optimalEndpoint;
      return Response.redirect(url.toString(), 302);
    }
    
    return handleRequest(request);
  }
};
```

## Step 10: Monitoring & Health Checks

### DNS Health Monitoring

```javascript
// Monitor DNS resolution
async function checkDNSHealth() {
  const domains = [
    'rapidtriage.me',
    'api.rapidtriage.me',
    'ws.rapidtriage.me',
    'docs.rapidtriage.me'
  ];
  
  const results = await Promise.all(
    domains.map(async domain => {
      try {
        const response = await fetch(`https://${domain}/health`, {
          timeout: 5000
        });
        return { domain, healthy: response.ok, status: response.status };
      } catch (error) {
        return { domain, healthy: false, error: error.message };
      }
    })
  );
  
  return results;
}
```

### Certificate Monitoring

```javascript
// Check SSL certificate expiration
async function checkCertificateHealth(domain) {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD'
    });
    
    const certificate = response.headers.get('cf-ray');
    // Cloudflare automatically manages certificates
    
    return {
      domain,
      ssl: true,
      provider: 'cloudflare',
      autoRenewed: true
    };
  } catch (error) {
    return {
      domain,
      ssl: false,
      error: error.message
    };
  }
}
```

## Troubleshooting

### Common DNS Issues

??? bug "DNS not propagating"
    **Symptoms:** Domain not resolving or showing old records
    **Solutions:**
    - Check TTL settings (lower for faster updates)
    - Verify nameserver configuration
    - Use DNS checker tools
    - Wait up to 48 hours for full propagation
    ```bash
    # Check DNS propagation
    dig rapidtriage.me @8.8.8.8
    nslookup rapidtriage.me 1.1.1.1
    ```

??? bug "SSL certificate not working"
    **Symptoms:** Certificate errors or mixed content
    **Solutions:**
    - Verify SSL mode is set to "Full (Strict)"
    - Check that origin server has valid certificate
    - Clear browser cache and cookies
    - Disable "Always Use HTTPS" temporarily for testing

??? bug "Worker routes not matching"
    **Symptoms:** 404 errors or routing to wrong worker
    **Solutions:**
    - Check route pattern syntax
    - Verify zone ID is correct
    - Order routes from specific to general
    - Test with curl/wget directly

### Debug Commands

```bash
# Test domain resolution
dig rapidtriage.me +short
dig api.rapidtriage.me +short
dig ws.rapidtriage.me +short

# Check SSL certificate
openssl s_client -connect rapidtriage.me:443 -servername rapidtriage.me

# Test HTTP/HTTPS responses
curl -I http://rapidtriage.me
curl -I https://rapidtriage.me

# Verify worker routing
curl -H "Host: api.rapidtriage.me" https://rapidtriage.me/health
curl -H "Host: ws.rapidtriage.me" https://rapidtriage.me/health
```

### Performance Testing

```bash
# Test from multiple locations
curl -w "@curl-format.txt" -s -o /dev/null https://rapidtriage.me/health

# DNS lookup performance
time dig rapidtriage.me +short

# SSL handshake timing
curl -w "%{time_connect} %{time_appconnect}\n" -o /dev/null -s https://rapidtriage.me
```

## Best Practices

### Domain Management

1. **Use descriptive subdomains** for different services
2. **Implement consistent SSL** across all subdomains
3. **Plan for scaling** with wildcard records where appropriate
4. **Monitor certificate expiration** (automated with Cloudflare)
5. **Document DNS changes** and maintain change logs

### Security

1. **Enable HSTS** on all domains and subdomains
2. **Use strong SPF/DKIM/DMARC** policies for email
3. **Implement domain validation** in application code
4. **Regular security audits** of DNS configuration
5. **Monitor for subdomain takeovers**

### Performance

1. **Optimize DNS TTLs** based on change frequency
2. **Use regional subdomains** for geographic optimization
3. **Implement proper caching** at the DNS level
4. **Monitor resolution times** across different regions
5. **Use load balancing** for high availability

## Next Steps

- [Cloudflare Deployment](cloudflare.md) - Complete Cloudflare setup
- [Local Testing](local-testing.md) - Development workflow
- [Security Guide](../guides/security.md) - Security best practices
- [Performance Guide](../guides/performance.md) - Optimization strategies