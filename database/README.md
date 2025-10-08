# 📊 RapidTriageME Database Architecture

## Overview

This directory contains the comprehensive database schema for RapidTriageME, designed to support enterprise-grade features including multi-tenancy, Keycloak SSO integration, advanced billing, team collaboration, and compliance tracking.

## 🏗️ Database Structure

### Schema Files

1. **[01-core-tables.sql](schema/01-core-tables.sql)** - Core system tables
   - `users` - User management with Keycloak integration
   - `projects` - Multi-project support with theme extraction
   - `user_preferences` - Extended user settings
   - `user_profiles` - Professional profiles
   - `system_settings` - Global configuration
   - `feature_flags` - Feature toggles

2. **[02-auth-tables.sql](schema/02-auth-tables.sql)** - Authentication & authorization
   - `api_keys` - API key management with advanced security
   - `sessions` - Session tracking with device fingerprinting
   - `oauth_providers` - OAuth/SSO provider connections
   - `mfa_devices` - Multi-factor authentication
   - `auth_logs` - Authentication audit trail
   - `keycloak_mappings` - Keycloak entity mappings

3. **[03-billing-tables.sql](schema/03-billing-tables.sql)** - Monetization & billing
   - `subscription_plans` - Tiered pricing plans
   - `subscriptions` - Active subscriptions
   - `usage_metrics` - Usage tracking for billing
   - `invoices` - Invoice management
   - `transactions` - Payment transactions
   - `coupons` - Discount codes
   - `payment_methods` - Stored payment methods

4. **[04-organization-tables.sql](schema/04-organization-tables.sql)** - Teams & collaboration
   - `organizations` - Company/team entities
   - `team_members` - Organization membership
   - `team_invitations` - Pending invitations
   - `teams` - Sub-teams within organizations
   - `shared_resources` - Resource sharing
   - `collaboration_sessions` - Real-time collaboration

5. **[05-audit-tables.sql](schema/05-audit-tables.sql)** - Security & compliance
   - `audit_logs` - Comprehensive audit trail
   - `security_events` - Security incident tracking
   - `ip_blacklist` - Blocked IPs
   - `ip_whitelist` - Trusted IPs
   - `data_access_logs` - GDPR compliance tracking
   - `compliance_reports` - Compliance certifications
   - `privacy_requests` - GDPR/CCPA requests

6. **[06-analytics-tables.sql](schema/06-analytics-tables.sql)** - Analytics & monitoring
   - `debug_sessions` - Browser debugging sessions
   - `reports` - Analysis reports
   - `dashboards` - Custom dashboards
   - `dashboard_widgets` - Dashboard components
   - `metrics` - Time-series metrics
   - `alerts` - Alert configurations
   - `user_activity` - Activity tracking

## 🚀 Deployment

### Prerequisites
- PostgreSQL 13+ (primary support)
- MySQL 8.0+ (with modifications)
- Cloudflare KV/Durable Objects (current production)

### Initial Setup

```bash
# Create database
createdb rapidtriage

# Run all schemas in order
for schema in database/schema/*.sql; do
  psql -d rapidtriage -f "$schema"
done

# Run initial migrations
for migration in database/migrations/*.sql; do
  psql -d rapidtriage -f "$migration"
done
```

## 📈 Subscription Tiers

### Free Tier ($0/month)
- 100 API calls/day
- 1 API key
- 7-day log retention
- Basic features

### Starter Tier ($29/month)
- 1,000 API calls/day
- 3 API keys
- 3 team members
- 30-day log retention
- Custom domains

### Pro Tier ($99/month)
- 5,000 API calls/day
- 10 API keys
- 10 team members
- 90-day log retention
- White-label option
- SSO support
- Priority support

### Enterprise Tier ($499/month)
- Unlimited API calls
- Unlimited API keys
- Unlimited team members
- 365-day log retention
- Dedicated account manager
- SLA guarantees
- Custom integrations

## 🔐 Security Features

- **Multi-factor authentication** via TOTP, SMS, WebAuthn
- **IP whitelisting/blacklisting** with geo-location
- **API key scoping** with granular permissions
- **Session management** with device fingerprinting
- **Audit logging** for all data access
- **GDPR compliance** with data anonymization
- **Risk scoring** for threat detection

## 🤝 Team Collaboration

- **Organizations** with multi-tenant isolation
- **Role-based access control** (Owner, Admin, Developer, Viewer)
- **Team invitations** with email verification
- **Resource sharing** with granular permissions
- **Real-time collaboration** sessions
- **Shared dashboards** and reports

## 📊 Analytics Capabilities

- **Debug sessions** with full browser telemetry
- **Performance metrics** with P95/P99 tracking
- **Custom dashboards** with drag-and-drop widgets
- **Alert management** with multiple notification channels
- **Lighthouse audits** for web performance
- **User activity tracking** for product analytics

## 🔄 Migration Support

### From Cloudflare KV
```bash
# Use the migration script
node database/scripts/kv-to-sql-migration.js
```

### Database Partitioning
- `audit_logs` - Monthly partitions
- `metrics` - Daily partitions
- `user_activity` - Weekly partitions

## 📝 Compliance

### Supported Standards
- **GDPR** - Data protection and privacy
- **HIPAA** - Healthcare data security
- **SOC2** - Security controls
- **ISO 27001** - Information security
- **PCI DSS** - Payment card security
- **CCPA** - California privacy rights

### Privacy Features
- Data subject access requests
- Right to erasure (deletion)
- Data portability exports
- Consent management
- Data retention policies

## 🛠️ Maintenance

### Regular Tasks
```sql
-- Clean expired sessions (daily)
SELECT cleanup_expired_sessions();

-- Refresh materialized views (hourly)
REFRESH MATERIALIZED VIEW daily_metrics_summary;
REFRESH MATERIALIZED VIEW user_activity_summary;

-- Archive old audit logs (monthly)
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
```

### Backup Strategy
```bash
# Full backup (daily)
pg_dump -Fc rapidtriage > backup_$(date +%Y%m%d).dump

# Incremental backup (hourly)
pg_basebackup -D /backup/incremental -Fp -Xs -P
```

## 📚 TypeScript Models

TypeScript interfaces are provided in `/database/models/` for type-safe database access:

```typescript
import { User, Organization, Subscription } from './database/models';
```

## 🔗 Related Documentation

- [API Documentation](/docs/api/)
- [Security Configuration](/docs/security-configuration.md)
- [Deployment Guide](/docs/deployment/)
- [Keycloak Integration](/scripts/keycloak-setup.js)

## 📈 Performance Optimizations

- **Indexes** on all foreign keys and frequently queried columns
- **Partitioning** for time-series data
- **Materialized views** for aggregated metrics
- **JSONB** for flexible schema evolution
- **Connection pooling** for scalability

## 🚦 Status

- ✅ Schema design complete
- ✅ PostgreSQL support
- ✅ Compliance features
- ✅ Multi-tenancy support
- ✅ Billing integration ready
- 🔄 MySQL adaptation (in progress)
- 🔄 Migration tools (in progress)

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintainer**: YarlisAISolutions