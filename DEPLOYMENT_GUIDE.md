# RapidTriageME Deployment Guide

## Current Status
✅ **Application is ready for deployment**
- All TypeScript errors fixed
- Build process successful
- Configuration files prepared

## Required Cloudflare API Token Permissions

Your API token needs the following permissions:

### Account Permissions:
- **Account:** `Cloudflare Workers Scripts:Edit`
- **Account:** `Workers KV Storage:Edit`
- **Account:** `Account Settings:Read`
- **User:** `User Details:Read`

### Zone Permissions (for rapidtriage.me):
- **Zone:** `Workers Routes:Edit`
- **Zone:** `Zone Settings:Read`

## Step-by-Step Deployment

### 1. Update API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token" or edit existing token
3. Use "Custom token" template
4. Add the permissions listed above
5. Set Account Resources to your account ID: `ed3fbe9532564f2f06ae772da689431a`
6. Set Zone Resources to include `rapidtriage.me`
7. Copy the new token

### 2. Set New Token
```bash
export CLOUDFLARE_API_TOKEN="your-new-token-here"
```

### 3. Create KV Namespace
```bash
# Create the KV namespace
wrangler kv namespace create "SESSIONS"

# Note the ID from the output, it will look like:
# id = "abc123def456..."
```

### 4. Update wrangler.toml
Edit `/Users/yarlis/Downloads/rapidtriageME/wrangler.toml` and update:
```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID"  # Replace with the ID from step 3
```

### 5. Deploy
```bash
# Build the project
npm run build

# Deploy to staging first
wrangler deploy --env staging

# Test at staging URL
# If everything works, deploy to production
wrangler deploy --env=""
```

## Alternative: Manual Dashboard Deployment

If API token issues persist:

1. **Create KV Namespace Manually:**
   - Go to Cloudflare Dashboard > Workers & Pages > KV
   - Click "Create namespace"
   - Name: `rapidtriage-me-SESSIONS`
   - Copy the namespace ID

2. **Create Worker Manually:**
   - Go to Workers & Pages > Create > Worker
   - Name: `rapidtriage-me`
   - Click "Create"

3. **Upload Code:**
   ```bash
   # Build and bundle
   npm run build
   
   # The built file is at dist/worker.js
   # Copy its contents and paste in the Cloudflare dashboard editor
   ```

4. **Configure Settings:**
   - Add environment variables from wrangler.toml
   - Bind KV namespace
   - Set custom domain routes

## Verification

After deployment, test these endpoints:

- Health Check: `https://rapidtriage.me/health`
- Landing Page: `https://rapidtriage.me/`
- SSE Endpoint: `https://rapidtriage.me/sse`

## Troubleshooting

### Authentication Error [code: 10000]
- Token lacks required permissions
- Check token permissions at https://dash.cloudflare.com/profile/api-tokens

### KV Namespace Issues
- Create manually in dashboard if CLI fails
- Ensure namespace ID in wrangler.toml matches actual ID

### Deployment Fails
- Verify account ID is correct: `ed3fbe9532564f2f06ae772da689431a`
- Check if worker name `rapidtriage-me` is available
- Ensure no syntax errors in wrangler.toml

## Support
For issues, contact YarlisAISolutions support or refer to:
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Wrangler docs: https://developers.cloudflare.com/workers/wrangler/