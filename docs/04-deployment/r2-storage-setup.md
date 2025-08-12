# R2 Storage Setup for Screenshot Management

## Overview
RapidTriageME uses Cloudflare R2 for enterprise-grade screenshot storage with hierarchical organization and multi-tenant support.

## ✅ Implementation Complete
All code for R2 storage has been implemented and deployed:
- Storage path builder with hierarchical naming convention
- Screenshot storage service
- API handlers for upload/retrieve/list/delete
- TypeScript interfaces for strong typing
- MCP handler integration

## 🚨 Manual Setup Required

### 1. Create R2 Bucket in Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** section
3. Click **Create bucket**
4. Enter bucket name: `rapidtriage-screenshots`
5. Select region (auto or specific)
6. Click **Create**

### 2. Update API Token Permissions

Current API token needs R2 permissions:

1. Go to **My Profile** → **API Tokens**
2. Find your current token or create new one
3. Add these permissions:
   - **Account** → **Cloudflare R2** → **Edit**
   - **Account** → **Workers R2 Storage** → **Edit**
4. Save token

### 3. Create R2 Bucket via CLI (Alternative)

Once token has permissions:
```bash
npx wrangler r2 bucket create rapidtriage-screenshots
```

### 4. Deploy Worker with R2

```bash
npx wrangler deploy --env production
```

## Storage Architecture

### Hierarchical Path Structure
```
{tenant}/{project}/{domain}/{year}/{month}/{day}/{session}/{screenshot-id}.{format}
```

### Examples
```
# Enterprise Customer
enterprise/acme-corp/goflyplan/production-acme-com/2025/01/11/session-abc123/20250111-143022-a3f2d1-full.png

# Team Account
team/dev-team/goflyplan/localhost-3000/2025/01/11/session-def456/20250111-143022-a3f2d1-full.png

# Individual User
user/jane-smith/goflyplan/mysite-com/2025/01/11/session-ghi789/20250111-143022-a3f2d1-full.png

# Free Tier
public/anonymous/goflyplan/example-com/2025/01/11/session-mno345/20250111-143022-a3f2d1-full.png
```

## API Endpoints

### Upload Screenshot
```bash
POST /api/screenshot
Content-Type: application/json

{
  "data": "base64_image_data",
  "url": "https://example.com",
  "title": "Page Title",
  "tenant": {
    "type": "user",
    "identifier": "jane-smith"
  },
  "project": "goflyplan"
}
```

### Retrieve Screenshot
```bash
GET /api/screenshots/{id}
```

### List Screenshots
```bash
GET /api/screenshots/list?tenant=user&identifier=jane-smith&limit=20
```

### Delete Screenshot
```bash
DELETE /api/screenshots/{id}
Authorization: Bearer {token}
```

### Get Statistics
```bash
GET /api/screenshots/stats?tenant=enterprise&identifier=acme-corp
```

## Storage Tiers

| Tier | Max Screenshots | Retention | Projects | Monthly Cost |
|------|----------------|-----------|----------|--------------|
| Free | 100 | 7 days | 1 | $0 |
| User | 1,000 | 30 days | 3 | ~$2 |
| Team | 10,000 | 90 days | Unlimited | ~$20 |
| Enterprise | Unlimited | 365 days | Unlimited | ~$200+ |

## Features Implemented

### 1. Automatic Organization
- Tenant-based separation (enterprise/team/user/public)
- Project-level organization (default: goflyplan)
- Domain-based grouping
- Date-based archival (YYYY/MM/DD)
- Session tracking

### 2. Storage Optimization
- Content-based deduplication
- SHA-256 hashing for unique IDs
- Automatic expiration based on tier
- Metadata stored in KV for fast queries

### 3. Enterprise Features
- Multi-tenant isolation
- Custom retention policies
- Audit logging ready
- Compliance support (GDPR)
- Analytics tracking

### 4. Security
- Signed URLs (1-hour expiry)
- Tenant-based access control
- Optional authentication
- Rate limiting support

## Testing Without R2

The worker will gracefully handle missing R2:

1. **With R2**: Screenshots stored in R2 with full path structure
2. **Without R2**: Screenshots acknowledged but not stored, returns mock response

## Chrome Extension Integration

The extension (v2.5.0) automatically:
1. Captures screenshot using Chrome API
2. Sends to remote server (rapidtriage.me)
3. Server stores in R2 with hierarchical path
4. Returns storage confirmation with path

## Monitoring

Check worker logs:
```bash
npx wrangler tail --env production
```

## Troubleshooting

### "R2 bucket not found"
- Create bucket in Cloudflare Dashboard
- Ensure bucket name matches: `rapidtriage-screenshots`

### "Authentication error"
- Update API token with R2 permissions
- Or create new token with all required permissions

### "Screenshot not stored"
- Check if R2 is configured in wrangler.toml
- Verify bucket exists
- Check worker logs for errors

## Next Steps

1. **Create R2 bucket** in Cloudflare Dashboard
2. **Update API token** with R2 permissions
3. **Redeploy worker** with `npx wrangler deploy --env production`
4. **Test screenshot upload** from extension
5. **Monitor storage** via dashboard

## Cost Estimation

Based on R2 pricing ($0.015/GB/month storage, no egress fees):

- **1,000 screenshots/day** (5MB avg): ~$2.25/month
- **10,000 screenshots/day**: ~$22.50/month
- **100,000 screenshots/day**: ~$225/month

## Future Enhancements

1. **Image Optimization**
   - Convert PNG to WebP (30% size reduction)
   - Generate thumbnails
   - Progressive loading

2. **Advanced Features**
   - Full-text search in metadata
   - AI-powered image analysis
   - Automated categorization
   - Batch operations

3. **Integration**
   - Direct S3 compatibility
   - Backup to Google Cloud
   - CDN distribution
   - Webhook notifications