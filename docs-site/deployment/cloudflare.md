# Cloudflare Deployment

This guide covers deploying RapidTriageME to Cloudflare's edge platform, providing global access to your browser debugging capabilities through Cloudflare Workers and related services.

## Overview

Cloudflare deployment enables:
- **Global Access** - Access your local browser data from anywhere
- **Edge Performance** - Low-latency responses via Cloudflare's global network  
- **Auto-scaling** - Handles traffic spikes automatically
- **Built-in Security** - DDoS protection and web application firewall

## Prerequisites

### Required Accounts & Tools

1. **Cloudflare Account** (Pro plan or higher recommended)
2. **Domain Name** (can be registered through Cloudflare)
3. **Node.js** (v18+) and npm
4. **Git** for version control
5. **Wrangler CLI** installed globally

### Initial Setup

```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare account
wrangler login

# Verify authentication
wrangler whoami
```

## Project Structure

```
rapidtriage/
├── cloudflare-worker/
│   ├── src/
│   │   ├── index.js          # Main worker script
│   │   ├── auth/              # Authentication handlers
│   │   ├── tunnel/            # WebSocket tunnel management
│   │   ├── api/               # API route handlers
│   │   └── utils/             # Utility functions
│   ├── wrangler.toml          # Worker configuration
│   ├── package.json           # Dependencies
│   └── schema.sql             # D1 database schema
├── docs-site/                 # Documentation (this site)
└── README.md
```

## Step 1: Domain Configuration

### Using Cloudflare DNS

1. **Add Domain to Cloudflare**:
   - Log into Cloudflare Dashboard
   - Click "Add a Site"
   - Enter your domain (e.g., `rapidtriage.me`)
   - Choose plan and complete DNS setup

2. **Configure DNS Records**:
```bash
# Create DNS records via CLI
wrangler zone create rapidtriage.me
wrangler dns record create --type A --name @ --content 1.1.1.1 --ttl 1
wrangler dns record create --type CNAME --name www --content rapidtriage.me
```

3. **Enable Cloudflare Proxy**:
   - Ensure orange cloud is enabled in DNS settings
   - This enables edge features and security

### SSL/TLS Configuration

```bash
# Enable Full (Strict) SSL
wrangler zone ssl --zone-id YOUR_ZONE_ID --mode full
```

## Step 2: Worker Deployment

### Configure wrangler.toml

```toml
name = "rapidtriage-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Production environment
[env.production]
name = "rapidtriage-worker-prod"
routes = [
  { pattern = "rapidtriage.me/*", zone_id = "your-zone-id" },
  { pattern = "*.rapidtriage.me/*", zone_id = "your-zone-id" }
]

# Staging environment  
[env.staging]
name = "rapidtriage-worker-staging"
routes = [
  { pattern = "staging.rapidtriage.me/*", zone_id = "your-zone-id" }
]

# KV Namespaces for session storage
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-sessions-kv-id"
preview_id = "your-sessions-preview-id"

[[kv_namespaces]]
binding = "ANALYTICS"
id = "your-analytics-kv-id"
preview_id = "your-analytics-preview-id"

# Durable Objects for WebSocket connections
[durable_objects]
bindings = [
  { name = "WEBSOCKET_CONNECTIONS", class_name = "WebSocketConnection" }
]

# Database for persistent storage
[[d1_databases]]
binding = "DB"
database_name = "rapidtriage-db"
database_id = "your-database-id"

# R2 Storage for screenshots and assets
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "rapidtriage-assets"

# Environment variables
[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"
MAX_CONNECTIONS = "1000"
```

### Set Secrets

```bash
# Generate secure JWT secret
openssl rand -base64 32 | wrangler secret put JWT_SECRET

# Set additional secrets
echo "your-api-key-here" | wrangler secret put API_KEY
echo "your-webhook-secret" | wrangler secret put WEBHOOK_SECRET
echo "your-encryption-key" | wrangler secret put ENCRYPTION_KEY

# Database connection (if using external DB)
echo "your-db-url" | wrangler secret put DATABASE_URL
```

### Create Required Resources

```bash
# Create KV namespaces
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "SESSIONS" --preview
wrangler kv:namespace create "ANALYTICS" 
wrangler kv:namespace create "ANALYTICS" --preview

# Create D1 database
wrangler d1 create rapidtriage-db

# Initialize database schema
wrangler d1 execute rapidtriage-db --file=./schema.sql

# Create R2 bucket
wrangler r2 bucket create rapidtriage-assets
```

### Deploy Worker

```bash
# Navigate to worker directory
cd cloudflare-worker

# Install dependencies
npm install

# Deploy to staging first
wrangler deploy --env staging

# Test staging deployment
curl https://staging.rapidtriage.me/health

# Deploy to production
wrangler deploy --env production

# Verify production deployment
curl https://rapidtriage.me/health
```

## Step 3: Database Setup

### D1 Database Schema

```sql
-- schema.sql
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    connector_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    last_activity INTEGER DEFAULT (strftime('%s', 'now')),
    authenticated INTEGER DEFAULT 0,
    capabilities TEXT,
    metadata TEXT,
    INDEX idx_connector_id (connector_id),
    INDEX idx_last_activity (last_activity)
);

CREATE TABLE IF NOT EXISTS auth_tokens (
    token_hash TEXT PRIMARY KEY,
    connector_id TEXT NOT NULL,
    issued_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER NOT NULL,
    scope TEXT DEFAULT 'read,write',
    revoked INTEGER DEFAULT 0,
    INDEX idx_connector_id (connector_id),
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS usage_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connector_id TEXT NOT NULL,
    date TEXT NOT NULL,
    requests INTEGER DEFAULT 0,
    data_transferred INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    uptime_percentage REAL DEFAULT 0,
    INDEX idx_connector_date (connector_id, date)
);

CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER DEFAULT (strftime('%s', 'now')),
    level TEXT DEFAULT 'error',
    message TEXT NOT NULL,
    context TEXT,
    connector_id TEXT,
    session_id TEXT,
    INDEX idx_timestamp (timestamp),
    INDEX idx_level (level)
);
```

### Apply Database Schema

```bash
# Apply schema to production
wrangler d1 execute rapidtriage-db --env production --file=./schema.sql

# Verify tables were created
wrangler d1 execute rapidtriage-db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## Step 4: Custom Domains & Routing

### Configure Routes

```bash
# Add routes for your domain
wrangler route add "rapidtriage.me/*" rapidtriage-worker-prod
wrangler route add "api.rapidtriage.me/*" rapidtriage-worker-prod  
wrangler route add "ws.rapidtriage.me/*" rapidtriage-worker-prod

# Add wildcard for subdomains
wrangler route add "*.rapidtriage.me/*" rapidtriage-worker-prod
```

### Page Rules (Optional)

Configure additional Cloudflare features:

1. **Caching Rules**:
   - Cache static assets for 24 hours
   - Bypass cache for API endpoints
   - Custom cache for documentation

2. **Security Rules**:
   - Rate limiting for API endpoints
   - Geographic restrictions if needed
   - Bot fight mode for protection

3. **Transform Rules**:
   - Add security headers
   - Modify response headers
   - URL redirects

## Step 5: SSL/TLS Configuration

### Certificate Setup

```bash
# Check SSL status
wrangler zone ssl --zone-id YOUR_ZONE_ID

# Enable automatic HTTPS rewrites
wrangler zone setting always_use_https --zone-id YOUR_ZONE_ID --value on

# Configure minimum TLS version
wrangler zone setting min_tls_version --zone-id YOUR_ZONE_ID --value 1.2
```

### HTTPS Redirect

Add to your worker code:

```javascript
// Redirect HTTP to HTTPS
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Force HTTPS in production
    if (url.protocol === 'http:' && env.ENVIRONMENT === 'production') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    
    return handleRequest(request, env, ctx);
  }
}
```

## Step 6: Monitoring & Analytics

### Built-in Analytics

```javascript
// Custom analytics in worker
async function recordAnalytics(env, event) {
  const key = `analytics:${new Date().toISOString().split('T')[0]}`;
  
  await env.ANALYTICS.put(key, JSON.stringify({
    timestamp: Date.now(),
    event: event.type,
    connectorId: event.connectorId,
    userAgent: event.userAgent,
    country: event.cf?.country,
    performance: {
      duration: event.duration,
      status: event.status
    }
  }));
}
```

### Real User Monitoring (RUM)

```javascript
// Add RUM data collection
async function collectRUM(request, response, duration) {
  const rumData = {
    url: request.url,
    method: request.method,
    status: response.status,
    duration: duration,
    userAgent: request.headers.get('user-agent'),
    country: request.cf?.country,
    colo: request.cf?.colo,
    timestamp: Date.now()
  };
  
  // Store in analytics KV
  await env.ANALYTICS.put(
    `rum:${Date.now()}:${Math.random()}`,
    JSON.stringify(rumData)
  );
}
```

### Health Checks

```javascript
// Health check endpoint
async function healthCheck(env) {
  const checks = {
    database: await testDatabase(env.DB),
    kvStorage: await testKVStorage(env.SESSIONS),
    r2Storage: await testR2Storage(env.ASSETS),
    durableObjects: await testDurableObjects(env),
    externalAPIs: await testExternalAPIs()
  };
  
  const overall = Object.values(checks).every(check => check.healthy);
  
  return new Response(JSON.stringify({
    status: overall ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: checks,
    version: env.API_VERSION
  }), {
    status: overall ? 200 : 503,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Step 7: Performance Optimization

### Caching Strategy

```javascript
// Intelligent caching
const CACHE_CONFIG = {
  '/health': { ttl: 60, staleWhileRevalidate: 30 },
  '/api/console-logs': { ttl: 30, staleWhileRevalidate: 60 },
  '/api/network-requests': { ttl: 30, staleWhileRevalidate: 60 },
  '/static/*': { ttl: 86400, staleWhileRevalidate: 86400 }
};

async function getCachedResponse(request, env, generateResponse) {
  const cacheKey = new Request(request.url, request);
  const cache = caches.default;
  
  // Check cache first
  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }
  
  // Generate fresh response
  response = await generateResponse();
  
  // Cache based on URL pattern
  const config = getCacheConfig(request.url);
  if (config) {
    response.headers.set('Cache-Control', `max-age=${config.ttl}`);
    await cache.put(cacheKey, response.clone());
  }
  
  return response;
}
```

### Resource Optimization

```javascript
// Optimize data transfer
async function compressResponse(response) {
  if (response.headers.get('content-encoding')) {
    return response; // Already compressed
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json') || contentType?.includes('text/')) {
    const compressed = await gzipCompress(await response.text());
    
    return new Response(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'content-encoding': 'gzip',
        'content-length': compressed.length
      }
    });
  }
  
  return response;
}
```

## Step 8: Security Hardening

### Security Headers

```javascript
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
};

function addSecurityHeaders(response) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
```

### Rate Limiting

```javascript
class RateLimiter {
  constructor(env) {
    this.env = env;
  }

  async checkLimit(identifier, limit = 100, windowMs = 60000) {
    const window = Math.floor(Date.now() / windowMs);
    const key = `rate-limit:${identifier}:${window}`;
    
    const current = await this.env.SESSIONS.get(key);
    const count = current ? parseInt(current) + 1 : 1;
    
    if (count > limit) {
      throw new Error(`Rate limit exceeded: ${count}/${limit} requests`);
    }
    
    await this.env.SESSIONS.put(key, count.toString(), {
      expirationTtl: Math.ceil(windowMs / 1000)
    });
    
    return {
      count,
      limit,
      remaining: Math.max(0, limit - count),
      resetTime: (window + 1) * windowMs
    };
  }
}
```

## Step 9: Testing Deployment

### Basic Functionality Tests

```bash
# Test health endpoint
curl https://rapidtriage.me/health

# Test authentication
curl -X POST https://rapidtriage.me/auth/token \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test-client","publicKey":"test-key"}'

# Test WebSocket connection
wscat -c wss://rapidtriage.me/tunnel/test123 \
  -H "Authorization: Bearer $TOKEN"

# Test API endpoints
curl https://rapidtriage.me/api/v1/console-logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Session-ID: test123"
```

### Load Testing

```bash
# Install load testing tool
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: 'https://rapidtriage.me'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer test-token'

scenarios:
  - name: 'Health check'
    weight: 30
    flow:
      - get:
          url: '/health'
  
  - name: 'API requests'
    weight: 70
    flow:
      - get:
          url: '/api/v1/console-logs'
          headers:
            X-Session-ID: 'load-test-session'
EOF

# Run load test
artillery run load-test.yml
```

## Step 10: Continuous Deployment

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
    paths: ['cloudflare-worker/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd cloudflare-worker
          npm ci
          
      - name: Run tests
        run: |
          cd cloudflare-worker
          npm test
          
      - name: Deploy to staging
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'cloudflare-worker'
          command: deploy --env staging
          
      - name: Test staging deployment
        run: |
          sleep 10
          curl -f https://staging.rapidtriage.me/health
          
      - name: Deploy to production
        if: success()
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: 'cloudflare-worker'
          command: deploy --env production
```

### Rollback Strategy

```bash
# Create deployment tags
wrangler deployments list --name rapidtriage-worker-prod

# Rollback to previous version if needed
wrangler rollback --name rapidtriage-worker-prod --deployment-id DEPLOYMENT_ID
```

## Troubleshooting

### Common Issues

??? bug "Deployment fails with 'Exceeded CPU time'"
    **Cause:** Worker script is too complex or has infinite loops
    **Solution:**
    - Review worker code for performance issues
    - Use async/await properly
    - Implement proper error handling
    - Consider breaking up large functions

??? bug "KV storage operations timing out"
    **Cause:** KV operations are eventually consistent
    **Solution:**
    - Implement retry logic with exponential backoff
    - Use consistent reads where needed
    - Cache frequently accessed data locally

??? bug "WebSocket connections dropping"
    **Cause:** Cloudflare has connection limits and timeouts
    **Solution:**
    - Implement proper heartbeat/ping-pong
    - Use Durable Objects for stateful connections
    - Handle reconnection logic in client

??? bug "CORS errors for API requests"
    **Cause:** Missing or incorrect CORS headers
    **Solution:**
    ```javascript
    function corsHeaders(origin) {
      return {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-ID',
        'Access-Control-Max-Age': '86400'
      };
    }
    ```

### Debug Commands

```bash
# View worker logs in real-time
wrangler tail --format pretty

# Check worker metrics
wrangler pages deployment list --project-name rapidtriage

# Test specific routes
curl -v https://rapidtriage.me/api/v1/health \
  -H "Authorization: Bearer $TOKEN"

# Validate DNS configuration
dig rapidtriage.me
nslookup rapidtriage.me 8.8.8.8
```

### Performance Monitoring

```bash
# Monitor worker performance
wrangler metrics --zone-id YOUR_ZONE_ID

# Check KV usage
wrangler kv:namespace list

# Monitor D1 database
wrangler d1 info rapidtriage-db
```

## Next Steps

- [Domain Configuration](domain.md) - Advanced domain setup
- [Local Testing](local-testing.md) - Development workflow
- [Security Guide](../guides/security.md) - Advanced security
- [Performance Guide](../guides/performance.md) - Optimization tips