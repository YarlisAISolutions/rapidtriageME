# Test Subdomain Setup Guide

## Overview
The test suite has been successfully deployed to handle requests at `test.rapidtriage.me`. The worker is configured and ready, but the DNS record needs to be created in Cloudflare.

## Current Status
✅ **Worker Deployed**: The Cloudflare Worker is deployed and configured to handle test.rapidtriage.me  
✅ **Routes Configured**: The worker has routes set up for test.rapidtriage.me/*  
✅ **DNS Record**: The DNS A/CNAME record needs to be created  

```
CNAME test rapidtriage.me Proxied Auto
```

## Required DNS Configuration

### Option 1: CNAME Record (Recommended)
1. Log in to Cloudflare Dashboard
2. Navigate to DNS → Records
3. Add a new record:
   - **Type**: CNAME
   - **Name**: test
   - **Target**: rapidtriage.me
   - **Proxy status**: Proxied (orange cloud ON)
   - **TTL**: Auto

### Option 2: A Record
If using an A record instead:
1. Add a new record:
   - **Type**: A
   - **Name**: test
   - **IPv4 address**: Same IP as rapidtriage.me
   - **Proxy status**: Proxied (orange cloud ON)
   - **TTL**: Auto

## Verification Steps

After creating the DNS record, verify it's working:

```bash
# Check DNS resolution
dig test.rapidtriage.me

# Test the endpoint
curl https://test.rapidtriage.me/

# Test the identity endpoint
curl https://test.rapidtriage.me/.identity
```

## What's Available

Once the DNS is configured, the test suite will be available at:

- **Main Test Suite**: https://test.rapidtriage.me/
- **Test Runner JS**: https://test.rapidtriage.me/assets/test-runner.js
- **Test Utils**: https://test.rapidtriage.me/assets/test-utils.js
- **Styles**: https://test.rapidtriage.me/assets/styles.css
- **Test Modules**: 
  - https://test.rapidtriage.me/modules/console-tests.js
  - https://test.rapidtriage.me/modules/network-tests.js
  - https://test.rapidtriage.me/modules/extension-tests.js
  - https://test.rapidtriage.me/modules/streaming-tests.js
  - https://test.rapidtriage.me/modules/devtools-tests.js
  - https://test.rapidtriage.me/modules/performance-tests.js
  - https://test.rapidtriage.me/modules/integration-tests.js

## Test Suite Features

The consolidated test suite includes:

1. **Overview Dashboard**
   - System status monitoring
   - Connection status (local/remote servers)
   - Quick test buttons
   - Test results summary
   - Activity log with export

2. **Extension Tests**
   - Installation verification
   - API communication tests
   - Button functionality tests
   - Lighthouse, Console, Screenshot, Inspect tests

3. **Console Tests**
   - Log, info, warn, error messages
   - Group messages
   - Table output
   - Stack traces
   - Timers and counters

4. **Network Tests**
   - GET/POST requests
   - Timeout handling
   - Error handling
   - CORS testing
   - Large payload tests
   - API endpoint testing

5. **Streaming Tests**
   - Server-Sent Events (SSE)
   - WebSocket connections
   - Long polling
   - Auto-reconnect configuration

6. **DevTools Integration Tests**
   - DevTools API verification
   - Inspector tests
   - Profiler tests
   - Debugger tests
   - Code evaluation

7. **Performance Tests**
   - Load time measurement
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)
   - Full benchmark suite

8. **Integration Tests**
   - Full extension flow scenarios
   - Server failover testing
   - Error recovery testing
   - Performance under load

## Troubleshooting

### DNS Not Resolving
- Wait 1-5 minutes for DNS propagation
- Ensure the record is proxied through Cloudflare (orange cloud)
- Check that the zone ID matches in wrangler.toml

### 404 Errors
- Verify the worker is deployed: `npx wrangler tail --env production`
- Check worker routes in Cloudflare Dashboard
- Ensure the subdomain matches exactly: `test.rapidtriage.me`

### Worker Not Responding
- Check worker logs: `npx wrangler tail --env production`
- Verify deployment: `npx wrangler deploy --env production`
- Check for any errors in the Cloudflare Dashboard

## Next Steps

1. Create the DNS record in Cloudflare
2. Wait for DNS propagation (1-5 minutes)
3. Access https://test.rapidtriage.me/ to use the test suite
4. Run comprehensive tests using the various test modules

## Notes

- The test suite is served directly from the worker (inline content)
- In production, consider using KV or R2 storage for static assets
- The test suite automatically detects local vs remote server connections
- All test results are tracked and displayed in real-time