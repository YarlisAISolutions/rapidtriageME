# 🚀 RapidTriageME Deployment Guide

## YarlisAISolutions Browser Triage & Debugging Platform

This guide will walk you through deploying RapidTriageME to Cloudflare Workers with your custom domain `rapidtriage.me`.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain Setup**: Add `rapidtriage.me` to your Cloudflare account
3. **Node.js**: Version 18+ installed
4. **Wrangler CLI**: Will be installed automatically by the script

## Step 1: Domain Configuration in Cloudflare

1. Log in to your Cloudflare dashboard
2. Add `rapidtriage.me` as a new site
3. Update your domain's nameservers to Cloudflare's nameservers
4. Wait for DNS propagation (usually 5-30 minutes)

## Step 2: Get Your Cloudflare Credentials

1. Go to **My Profile** → **API Tokens**
2. Create a new API token with these permissions:
   - **Account**: Cloudflare Workers Scripts:Edit
   - **Zone**: Zone:Read, DNS:Edit for rapidtriage.me
3. Copy your Account ID from the right sidebar
4. Get your Zone ID from the domain overview page

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Or use your preferred editor
code .env  # VS Code
vim .env   # Vim
```


Update these values:
- `CLOUDFLARE_ACCOUNT_ID`: Your account ID
- `CLOUDFLARE_API_TOKEN`: Your API token
- `ZONE_ID`: Your zone ID for rapidtriage.me
- `AUTH_TOKEN`: Create a secure random token
- `JWT_SECRET`: Create a secure random secret

Hint: You can find your account ID and zone ID in the Cloudflare dashboard/Overview.
Hint 2: This is a secure random token: openssl rand -base64 32

## Step 4: Update Wrangler Configuration

Edit `wrangler.toml`:

```toml
account_id = "YOUR_ACCOUNT_ID_HERE"

[[kv_namespaces]]
binding = "SESSIONS"
id = "" # Will be created during deployment
```

## Step 5: Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

**Note**: The deployment script will:
- Install dependencies for both packages
- Build the TypeScript code
- Create KV namespaces
- Deploy to Cloudflare Workers

The script will:
1. Install dependencies
2. Build the project
3. Create KV namespace for sessions
4. Set up authentication secrets
5. Deploy to staging first
6. Optionally deploy to production

## Step 6: Manual Deployment (Alternative)

**Important**: Use the new folder structure

If you prefer manual deployment:

```bash
# Install dependencies for both packages
cd rapidtriage-mcp && npm install && cd ..
cd rapidtriage-server && npm install && cd ..

# Build the project
npm run build

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create SESSIONS

# Add the KV namespace ID to wrangler.toml
# Update the "id" field with the ID shown in the output

# Set secrets
wrangler secret put AUTH_TOKEN
wrangler secret put JWT_SECRET

# Deploy to production
wrangler deploy --env production
```

## Step 7: Configure DNS Records

In Cloudflare Dashboard:

1. Go to **DNS** settings for rapidtriage.me
2. Add these records if not automatically created:

```
Type: CNAME
Name: @
Target: rapidtriage-me.workers.dev
Proxy: ON (orange cloud)

Type: CNAME
Name: www
Target: rapidtriage-me.workers.dev
Proxy: ON (orange cloud)

Type: CNAME
Name: staging
Target: rapidtriage-staging.workers.dev
Proxy: ON (orange cloud)
```

## Step 8: Verify Deployment

Test your endpoints:

```bash
# Health check
curl https://rapidtriage.me/health

# Test SSE connection (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: text/event-stream" \
     https://rapidtriage.me/sse
```

## Step 9: Configure MCP Clients

### For Multiple IDEs

RapidTriageME supports 10+ IDEs. See [IDE_CONFIGURATION.md](./IDE_CONFIGURATION.md) for complete setup.

#### Claude Desktop
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "type": "sse",
      "url": "https://rapidtriage.me/sse",
      "headers": {
        "Authorization": "Bearer YOUR_AUTH_TOKEN"
      }
    }
  }
}
```

#### Cursor IDE
Edit `~/.cursor/mcp_settings.json`:

```json
{
  "mcpServers": {
    "rapidtriage": {
      "type": "sse",
      "url": "https://rapidtriage.me/sse",
      "headers": {
        "Authorization": "Bearer YOUR_AUTH_TOKEN"
      }
    }
  }
}
```

## Package Structure

```
rapidtriageME/
├── rapidtriage-mcp/       # MCP server package
│   ├── dist/             # Compiled JS
│   └── package.json      # @yarlis/rapidtriage-mcp
├── rapidtriage-server/    # Browser server package
│   ├── dist/             # Compiled JS
│   └── package.json      # @yarlis/rapidtriage-server
├── rapidtriage-extension/ # Browser extension
└── src/                  # Cloudflare Worker source
```

## Monitoring & Maintenance

### View Logs
```bash
wrangler tail
```

### Update Deployment
```bash
git pull
npm run build
wrangler deploy --env production
```

### View Metrics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://rapidtriage.me/metrics
```

## Troubleshooting

### Domain Not Working
- Ensure nameservers are pointed to Cloudflare
- Check DNS propagation: `nslookup rapidtriage.me`
- Verify DNS records in Cloudflare dashboard

### Authentication Errors
- Verify AUTH_TOKEN is set correctly
- Check secret was added: `wrangler secret list`
- Update secret: `wrangler secret put AUTH_TOKEN`

### KV Namespace Issues
- List namespaces: `wrangler kv:namespace list`
- Create new: `wrangler kv:namespace create SESSIONS`
- Update wrangler.toml with the new ID

### Worker Not Responding
- Check worker status in Cloudflare dashboard
- View real-time logs: `wrangler tail`
- Check error logs in dashboard → Workers → Logs

## Security Best Practices

1. **Strong Tokens**: Use long, random tokens for AUTH_TOKEN and JWT_SECRET
2. **CORS**: Configure allowed origins in the worker
3. **Rate Limiting**: Adjust limits based on your usage
4. **Regular Updates**: Keep dependencies updated
5. **Monitor Metrics**: Check /metrics endpoint regularly

## Support

For issues or questions:
- GitHub: [YarlisAISolutions/rapidtriageME](https://github.com/YarlisAISolutions/rapidtriageME)
- Documentation: [rapidtriage.me/docs](https://rapidtriage.me/docs)

---

**YarlisAISolutions** - Empowering AI-driven browser automation and debugging