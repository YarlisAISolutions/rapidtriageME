# Setting up rapidtriage.me Domain

## Step 1: Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click "Add a Site"
3. Enter: rapidtriage.me
4. Select a plan (Free plan works)
5. Note the nameservers provided (e.g., alex.ns.cloudflare.com, uma.ns.cloudflare.com)

## Step 2: Update Nameservers at Your Registrar

Update your domain's nameservers to point to Cloudflare's nameservers.

## Step 3: Get the Zone ID

Once the domain is active in Cloudflare:
1. Go to the domain's Overview page
2. Scroll down to find the Zone ID
3. Copy it for use in wrangler.toml

## Step 4: Create Worker Route

In Cloudflare Dashboard:
1. Go to Workers & Pages
2. Click on your worker (rapidtriage-me)
3. Go to Settings > Triggers
4. Add custom domain: rapidtriage.me

## Alternative: Use Workers.dev URL

Your app is currently accessible at:
- Staging: https://rapidtriage-staging.sireesh-yarlagadda-d3f.workers.dev
- Production: https://rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev

## Temporary Solution: CNAME Record

If you want to use a subdomain of an existing domain:
1. Add a CNAME record pointing to your worker:
   - Name: rapidtriage
   - Target: rapidtriage-me.sireesh-yarlagadda-d3f.workers.dev
   - Proxy: ON (orange cloud)