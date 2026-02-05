# RapidTriage.me Monetization System

This document describes the monetization system implementation for RapidTriage.me, including subscription tiers, usage tracking, Stripe integration, and dashboard features.

## Table of Contents

1. [Subscription Tiers](#subscription-tiers)
2. [Usage Limits](#usage-limits)
3. [Stripe Integration](#stripe-integration)
4. [Mobile App Components](#mobile-app-components)
5. [API Endpoints](#api-endpoints)
6. [Firestore Data Model](#firestore-data-model)
7. [Implementation Guide](#implementation-guide)

---

## Subscription Tiers

### Free Tier
- **Price:** $0/month
- **Scans:** 10/month
- **Features:**
  - Basic accessibility checks
  - Email support

### User Tier
- **Price:** $19/month or $190/year (16% savings)
- **Scans:** 100/month
- **Features:**
  - Full accessibility reports
  - Lighthouse integration
  - Export reports
  - Priority email support

### Team Tier
- **Price:** $49/month or $490/year
- **Scans:** 500/month
- **Features:**
  - Everything in User
  - Up to 5 team members
  - Team dashboard
  - API access
  - Slack integration

### Enterprise Tier
- **Price:** Custom
- **Scans:** Unlimited
- **Features:**
  - Everything in Team
  - Unlimited team members
  - SSO integration
  - Custom integrations
  - Dedicated support
  - SLA guarantee

---

## Usage Limits

### Tracking

Usage is tracked per user per month in Firestore:

```typescript
// Collection: usage
// Document ID: {userId}_{year}_{month}

interface UsageDocument {
  userId: string;
  year: number;
  month: number;
  scansCount: number;
  lastScanAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Enforcement

1. **Before Scan:** Call `GET /api/dashboard/check-scan` to verify limit
2. **After Scan:** `incrementUsage()` function updates counter
3. **UI Display:** `UsageMeter` component shows remaining scans

### Plan Limits

```typescript
const PLAN_LIMITS = {
  free: 10,
  user: 100,
  team: 500,
  enterprise: null, // unlimited
};
```

---

## Stripe Integration

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_USER_PRICE_ID_MONTHLY=price_xxx
STRIPE_USER_PRICE_ID_YEARLY=price_xxx
STRIPE_TEAM_PRICE_ID_MONTHLY=price_xxx
STRIPE_TEAM_PRICE_ID_YEARLY=price_xxx
```

### Callable Functions

#### `createCheckoutSession`
Creates a Stripe Checkout session for subscription purchase.

```typescript
const result = await httpsCallable(functions, 'createCheckoutSession')({
  priceId: 'price_xxx',
  successUrl: 'https://app.rapidtriage.me/subscription/success',
  cancelUrl: 'https://app.rapidtriage.me/subscription/cancel',
});

// Opens Stripe Checkout
window.location.href = result.data.url;
```

#### `createPortalSession`
Opens Stripe Customer Portal for billing management.

```typescript
const result = await httpsCallable(functions, 'createPortalSession')({
  returnUrl: 'https://app.rapidtriage.me/settings',
});

window.location.href = result.data.url;
```

#### `getSubscription`
Returns current subscription status and available plans.

```typescript
const result = await httpsCallable(functions, 'getSubscription')();
console.log(result.data.subscription); // Current subscription
console.log(result.data.tier); // Current tier
console.log(result.data.pricingPlans); // All available plans
```

#### `cancelSubscription` / `reactivateSubscription`
Manages subscription cancellation.

```typescript
// Cancel at period end
await httpsCallable(functions, 'cancelSubscription')();

// Reactivate before period ends
await httpsCallable(functions, 'reactivateSubscription')();
```

### Webhook Events

The `/stripeWebhook` endpoint handles:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Log checkout completion |
| `customer.subscription.created` | Create/update subscription in Firestore |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Downgrade to free tier |
| `invoice.paid` | Log successful payment |
| `invoice.payment_failed` | Log failed payment |

---

## Mobile App Components

### Directory Structure

```
RapidTriageMobile/src/ui/components/monetization/
├── index.ts           # Exports all components
├── PlanCard.tsx       # Displays plan details
├── UsageMeter.tsx     # Visual usage progress
├── UpgradeModal.tsx   # Upgrade flow modal
├── BillingHistoryList.tsx  # Past invoices
├── FeatureGate.tsx    # Feature access control
├── PaywallModal.tsx   # Full paywall experience
└── UpgradePrompt.tsx  # Inline upgrade prompts
```

### Component Usage

#### UsageMeter

```tsx
<UsageMeter
  used={75}
  limit={100}
  label="Scans Used"
  size="medium"
  showRemaining
  showPercentage
  warningThreshold={75}   // Shows warning color
  criticalThreshold={90}  // Shows critical color
/>
```

#### PlanCard

```tsx
<PlanCard
  id="user"
  name="User"
  description="For individual developers"
  priceMonthly={1900}
  priceYearly={19000}
  features={['100 scans/month', 'Full reports', ...]}
  monthlyScans={100}
  isCurrentPlan={false}
  isPopular={true}
  isYearly={isYearly}
  onSelect={(planId) => handleUpgrade(planId)}
/>
```

#### UpgradeModal

```tsx
<UpgradeModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onUpgrade={async (priceId) => {
    const result = await createCheckoutSession({ priceId, ... });
    Linking.openURL(result.data.url);
  }}
  currentPlan="free"
  currentUsage={{ used: 10, limit: 10 }}
  reason="limit_reached"
/>
```

### Screens

#### HomeScreen (`/main/HomeScreen.tsx`)
- Displays usage meter with current scan count
- Shows upgrade prompt when near limit
- Shows limit alert when at limit
- Quick action buttons with scan protection

#### SettingsHomeScreen (`/settings/SettingsHomeScreen.tsx`)
- Account information
- Current plan display
- Theme toggle (dark/light)
- Notification preferences
- API key management link
- Logout

#### SubscriptionScreen (`/settings/SubscriptionScreen.tsx`)
- Current plan details with status
- Usage breakdown
- Plan comparison (all tiers)
- Monthly/Yearly toggle
- Upgrade buttons → Stripe checkout
- Billing history tab
- Manage billing → Stripe portal

---

## API Endpoints

### Dashboard Stats

```
GET /api/dashboard/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "displayName": "..." },
    "subscription": {
      "tier": "user",
      "status": "active",
      "scansUsed": 45,
      "scansLimit": 100,
      "scansRemaining": 55,
      "currentPeriodEnd": "2024-02-15T00:00:00Z",
      "cancelAtPeriodEnd": false
    },
    "recentAudits": [...],
    "usageHistory": {
      "thisMonth": 45,
      "lastMonth": 32,
      "trend": "up"
    },
    "planInfo": { ... }
  }
}
```

### Check Scan Allowed

```
GET /api/dashboard/check-scan
Authorization: Bearer <token>

Response:
{
  "success": true,
  "allowed": true,
  "scansUsed": 45,
  "scansLimit": 100,
  "scansRemaining": 55,
  "tier": "user"
}

// When limit reached:
{
  "success": true,
  "allowed": false,
  "scansUsed": 100,
  "scansLimit": 100,
  "scansRemaining": 0,
  "tier": "free",
  "upgradeUrl": "https://rapidtriage.me/pricing",
  "message": "You have reached your monthly scan limit. Upgrade to continue."
}
```

---

## Firestore Data Model

### Collections

#### `users`
```typescript
interface User {
  uid: string;
  email: string;
  displayName?: string;
  stripeCustomerId?: string;
  subscriptionTier?: 'free' | 'user' | 'team' | 'enterprise';
  subscriptionStatus?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `subscriptions`
```typescript
interface Subscription {
  userId: string;
  tier: 'free' | 'user' | 'team' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: Timestamp | null;
  currentPeriodEnd: Timestamp | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `usage`
```typescript
interface Usage {
  userId: string;
  year: number;
  month: number;
  scansCount: number;
  lastScanAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Implementation Guide

### 1. Setting Up Stripe

1. Create Stripe account and get API keys
2. Create products and prices in Stripe Dashboard
3. Set up webhook endpoint
4. Configure Firebase environment:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### 2. Frontend Integration

1. Import components from `@ui/components/monetization`
2. Use `useAuthStore()` to get user subscription info
3. Call Firebase callable functions for checkout/portal
4. Handle deep links for success/cancel URLs

### 3. Testing

1. Use Stripe test mode with test cards
2. Test all webhook events with Stripe CLI:
```bash
stripe listen --forward-to localhost:5001/rapidtriageme/us-central1/stripeWebhook
```

### 4. Going Live

1. Switch to live Stripe keys
2. Update price IDs to live products
3. Enable Stripe webhook in Dashboard
4. Test full flow with real card

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `unauthenticated` | No auth token | Require login |
| `permission-denied` | Invalid subscription | Show upgrade modal |
| `resource-exhausted` | Rate limited | Retry with backoff |
| `failed-precondition` | No email on account | Request email |

### User Experience

1. **Limit Warning (80%):** Show subtle upgrade prompt
2. **Limit Critical (90%):** Show prominent warning
3. **Limit Reached:** Show blocking upgrade modal
4. **Payment Failed:** Show billing portal link

---

## Metrics to Track

- Conversion rate: Free → Paid
- Upgrade path: Which plans convert
- Churn rate: Cancellations per month
- Usage patterns: Scans per user
- Revenue: MRR, ARR

---

## Future Enhancements

1. **Team features:** Invite members, shared dashboard
2. **Usage alerts:** Email when approaching limit
3. **Promo codes:** Discount campaigns
4. **Annual billing:** Better savings display
5. **Referral program:** Credits for referrals
