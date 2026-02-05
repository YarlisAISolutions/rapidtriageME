# RapidTriageME Stripe Integration Setup Guide

This guide covers how to set up and configure Stripe for RapidTriageME's subscription billing system.

## Overview

RapidTriageME uses Stripe for:
- Subscription billing (monthly/yearly plans)
- Payment processing
- Customer portal (self-service subscription management)
- Webhook handling for real-time subscription updates

## Pricing Plans

| Plan | Monthly | Yearly | Scans/Month | Users |
|------|---------|--------|-------------|-------|
| Free | $0 | $0 | 10 | 1 |
| User | $19 | $190 | 100 | 1 |
| Team | $49 | $490 | 500 | 5 |
| Enterprise | Custom | Custom | Unlimited | Unlimited |

## Prerequisites

1. **Stripe Account**: Create an account at [stripe.com](https://stripe.com)
2. **Firebase Project**: Ensure Firebase Functions are deployed
3. **Stripe CLI** (optional): For local webhook testing

## Setup Steps

### 1. Create Stripe Products and Prices

#### Option A: Using Stripe Dashboard

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create products for each plan:
   - **RapidTriage User** - Individual plan
   - **RapidTriage Team** - Team plan
3. For each product, create prices:
   - Monthly recurring price
   - Yearly recurring price (with ~16% discount)

#### Option B: Using Stripe CLI

```bash
# Create User Plan
stripe products create --name="RapidTriage User" --description="Individual developer plan"

# Create monthly price
stripe prices create \
  --product="prod_XXXXX" \
  --unit-amount=1900 \
  --currency=usd \
  -d "recurring[interval]=month"

# Create yearly price
stripe prices create \
  --product="prod_XXXXX" \
  --unit-amount=19000 \
  --currency=usd \
  -d "recurring[interval]=year"

# Repeat for Team plan ($49/month, $490/year)
```

### 2. Configure Environment Variables

Add these environment variables to your Firebase Functions:

```bash
# Using Firebase CLI
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Set price IDs in Firebase config or .env
firebase functions:config:set stripe.user_price_monthly="price_xxx"
firebase functions:config:set stripe.user_price_yearly="price_xxx"
firebase functions:config:set stripe.team_price_monthly="price_xxx"
firebase functions:config:set stripe.team_price_yearly="price_xxx"
```

Or create a `.env` file in `functions/`:

```env
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
STRIPE_USER_PRICE_ID_MONTHLY=price_xxxx
STRIPE_USER_PRICE_ID_YEARLY=price_xxxx
STRIPE_TEAM_PRICE_ID_MONTHLY=price_xxxx
STRIPE_TEAM_PRICE_ID_YEARLY=price_xxxx
```

### 3. Set Up Webhook Endpoint

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint:
   - URL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/stripeWebhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Configure Customer Portal

1. Go to [Stripe Dashboard > Settings > Billing > Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable the following features:
   - Update payment methods
   - Cancel subscriptions
   - Update subscriptions (optional)
   - View invoices
3. Configure business information and branding

### 5. Deploy Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Mobile App Configuration

The RapidTriageMobile app already has `@stripe/stripe-react-native` installed.

### Add publishable key to `.env`:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
```

### Usage in App:

```typescript
import { paymentService } from './src/services/payment/payment.service';

// Initialize Stripe (call once at app start)
await paymentService.initialize();

// Create checkout session
const { url } = await functions.httpsCallable('createCheckoutSession')({
  priceId: 'price_xxxx',
  successUrl: 'rapidtriage://payment-success',
  cancelUrl: 'rapidtriage://payment-cancel',
});

// Open checkout in browser/webview
Linking.openURL(url);

// Access customer portal
const { url } = await functions.httpsCallable('createPortalSession')({
  returnUrl: 'rapidtriage://settings',
});
Linking.openURL(url);

// Get subscription info
const { subscription, tier, pricingPlans } = await functions.httpsCallable('getSubscription')();

// Cancel subscription
await functions.httpsCallable('cancelSubscription')({
  reason: 'Too expensive',
  feedback: 'Would return if cheaper',
});
```

## Firebase Functions API

### Callable Functions

| Function | Description | Input | Output |
|----------|-------------|-------|--------|
| `createCheckoutSession` | Create Stripe checkout | `{ priceId, successUrl, cancelUrl }` | `{ sessionId, url }` |
| `createPortalSession` | Create customer portal session | `{ returnUrl }` | `{ url }` |
| `getSubscription` | Get user's subscription | none | `{ subscription, tier, pricingPlans }` |
| `cancelSubscription` | Cancel subscription | `{ reason?, feedback? }` | `{ success, message }` |
| `reactivateSubscription` | Reactivate canceled subscription | none | `{ success, message }` |

### HTTP Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /stripeWebhook` | Stripe webhook handler |

## Firestore Data Structure

### Collections

#### `users/{userId}`
```typescript
{
  stripeCustomerId: string;
  subscriptionTier: 'free' | 'user' | 'team' | 'enterprise';
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | ...;
}
```

#### `subscriptions/{userId}`
```typescript
{
  userId: string;
  tier: 'free' | 'user' | 'team' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | ...;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  trialEnd: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Testing

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local emulator
stripe listen --forward-to http://localhost:5001/YOUR_PROJECT/YOUR_REGION/stripeWebhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.paid
```

### Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242424242424242` | Success |
| `4000000000000341` | Attach fails |
| `4000000000009995` | Payment fails |
| `4000002500003155` | Requires authentication |

## Troubleshooting

### Common Issues

1. **Webhook signature verification failed**
   - Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint
   - Use `rawBody` for signature verification, not `body`

2. **User ID missing from subscription**
   - Ensure `metadata.userId` is set in `subscription_data` during checkout

3. **Customer portal not working**
   - Verify customer has `stripeCustomerId` in Firestore
   - Ensure portal is configured in Stripe Dashboard

4. **Prices not found**
   - Verify price IDs in environment variables match Stripe Dashboard
   - Check for test vs live mode mismatch

## Security Best Practices

1. **Never expose secret keys** - Use Firebase Secrets for `STRIPE_SECRET_KEY`
2. **Always verify webhooks** - Validate signatures on all webhook requests
3. **Use HTTPS** - All Stripe endpoints must use HTTPS
4. **Validate user permissions** - Check authentication before allowing subscription changes
5. **Log events** - Keep audit logs of subscription changes

## Resources

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe React Native SDK](https://github.com/stripe/stripe-react-native)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
