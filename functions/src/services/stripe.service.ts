/**
 * Stripe Service for RapidTriageME
 *
 * Handles all Stripe API interactions for subscription management,
 * payment processing, and customer management.
 *
 * Uses the centralized Stripe gateway for client initialization
 * and standardized error handling.
 */

import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import {
  getStripeClient,
  verifyWebhookSignature as gatewayVerifyWebhook,
  executeStripeOperation,
} from './stripe/index.js';

/**
 * Subscription tier definitions matching mobile app
 */
export enum SubscriptionTier {
  FREE = 'free',
  USER = 'user',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

/**
 * Subscription status types
 */
export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'incomplete' 
  | 'trialing' 
  | 'unpaid';

/**
 * User subscription data stored in Firestore
 */
export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: admin.firestore.Timestamp | null;
  currentPeriodEnd: admin.firestore.Timestamp | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: admin.firestore.Timestamp | null;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Pricing configuration
 */
export interface PricingPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number; // in cents
  priceYearly: number; // in cents
  features: string[];
  monthlyScans: number | null; // null = unlimited
  maxUsers: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

/**
 * Predefined pricing plans
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    tier: SubscriptionTier.FREE,
    name: 'Free',
    description: 'Get started with basic scans',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      '10 scans per month',
      'Basic accessibility checks',
      'Email support',
    ],
    monthlyScans: 10,
    maxUsers: 1,
  },
  {
    id: 'user',
    tier: SubscriptionTier.USER,
    name: 'User',
    description: 'For individual developers',
    priceMonthly: 1900, // $19/month
    priceYearly: 19000, // $190/year (save ~16%)
    features: [
      '100 scans per month',
      'Full accessibility reports',
      'Lighthouse integration',
      'Export reports',
      'Priority email support',
    ],
    monthlyScans: 100,
    maxUsers: 1,
    stripePriceIdMonthly: process.env.STRIPE_USER_PRICE_ID_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_USER_PRICE_ID_YEARLY,
  },
  {
    id: 'team',
    tier: SubscriptionTier.TEAM,
    name: 'Team',
    description: 'For development teams',
    priceMonthly: 4900, // $49/month
    priceYearly: 49000, // $490/year
    features: [
      '500 scans per month',
      'Everything in User',
      'Up to 5 team members',
      'Team dashboard',
      'API access',
      'Slack integration',
    ],
    monthlyScans: 500,
    maxUsers: 5,
    stripePriceIdMonthly: process.env.STRIPE_TEAM_PRICE_ID_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_TEAM_PRICE_ID_YEARLY,
  },
  {
    id: 'enterprise',
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: 0, // Custom pricing
    priceYearly: 0,
    features: [
      'Unlimited scans',
      'Everything in Team',
      'Unlimited team members',
      'SSO integration',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    monthlyScans: null,
    maxUsers: -1, // unlimited
  },
];

/**
 * Stripe Service Class
 */
class StripeService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
    const stripe = getStripeClient();
    
    // Check if user already has a Stripe customer ID
    const userDoc = await this.db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.stripeCustomerId) {
      return userData.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        firebaseUserId: userId,
      },
    });

    // Store customer ID in user document
    await this.db.collection('users').doc(userId).set(
      { stripeCustomerId: customer.id },
      { merge: true }
    );

    logger.info(`Created Stripe customer ${customer.id} for user ${userId}`);
    return customer.id;
  }

  /**
   * Create a Checkout Session for subscription
   */
  async createCheckoutSession(
    userId: string,
    email: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const stripe = getStripeClient();
    
    // Get or create customer
    const customerId = await this.getOrCreateCustomer(userId, email);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      allow_promotion_codes: true,
    });

    logger.info(`Created checkout session ${session.id} for user ${userId}`);
    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  /**
   * Create a Customer Portal session for managing subscription
   */
  async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    const stripe = getStripeClient();
    
    // Get user's Stripe customer ID
    const userDoc = await this.db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.stripeCustomerId) {
      throw new Error('User does not have a Stripe customer ID');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl,
    });

    logger.info(`Created portal session for user ${userId}`);
    return { url: session.url };
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const subDoc = await this.db.collection('subscriptions').doc(userId).get();
    if (!subDoc.exists) {
      return null;
    }
    return subDoc.data() as UserSubscription;
  }

  /**
   * Update user subscription from Stripe event
   */
  async updateSubscriptionFromStripe(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) {
      logger.error('Subscription missing userId in metadata', { subscriptionId: subscription.id });
      return;
    }

    // Determine tier from price
    const priceId = subscription.items.data[0]?.price.id;
    const tier = this.getTierFromPriceId(priceId);

    // Access billing cycle dates from subscription items
    const item = subscription.items.data[0];
    const periodStart = (subscription as any).current_period_start || 
                        item?.current_period_start ||
                        Math.floor(Date.now() / 1000);
    const periodEnd = (subscription as any).current_period_end || 
                      item?.current_period_end ||
                      Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    const subscriptionData: UserSubscription = {
      userId,
      tier,
      status: subscription.status as SubscriptionStatus,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart: admin.firestore.Timestamp.fromMillis(periodStart * 1000),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(periodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end
        ? admin.firestore.Timestamp.fromMillis(subscription.trial_end * 1000)
        : null,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await this.db.collection('subscriptions').doc(userId).set(subscriptionData, { merge: true });

    // Also update user document with tier
    await this.db.collection('users').doc(userId).set(
      { 
        subscriptionTier: tier,
        subscriptionStatus: subscription.status,
      },
      { merge: true }
    );

    logger.info(`Updated subscription for user ${userId}`, {
      tier,
      status: subscription.status,
    });
  }

  /**
   * Handle subscription deletion
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) {
      logger.error('Deleted subscription missing userId', { subscriptionId: subscription.id });
      return;
    }

    // Downgrade to free tier
    await this.db.collection('subscriptions').doc(userId).set({
      tier: SubscriptionTier.FREE,
      status: 'canceled',
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodEnd: admin.firestore.Timestamp.now(),
      cancelAtPeriodEnd: false,
      updatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true });

    await this.db.collection('users').doc(userId).set(
      { 
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: 'canceled',
      },
      { merge: true }
    );

    logger.info(`Subscription deleted for user ${userId}, downgraded to free`);
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string): Promise<void> {
    const stripe = getStripeClient();
    
    const subscription = await this.getUserSubscription(userId);
    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.db.collection('subscriptions').doc(userId).set(
      { 
        cancelAtPeriodEnd: true,
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    logger.info(`Subscription set to cancel at period end for user ${userId}`);
  }

  /**
   * Reactivate a subscription that's set to cancel
   */
  async reactivateSubscription(userId: string): Promise<void> {
    const stripe = getStripeClient();
    
    const subscription = await this.getUserSubscription(userId);
    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No subscription found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await this.db.collection('subscriptions').doc(userId).set(
      { 
        cancelAtPeriodEnd: false,
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    logger.info(`Subscription reactivated for user ${userId}`);
  }

  /**
   * Get pricing plans
   */
  getPricingPlans(): PricingPlan[] {
    return PRICING_PLANS;
  }

  /**
   * Determine tier from Stripe price ID
   */
  private getTierFromPriceId(priceId: string): SubscriptionTier {
    const plan = PRICING_PLANS.find(
      p => p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId
    );
    return plan?.tier ?? SubscriptionTier.FREE;
  }

  /**
   * Verify Stripe webhook signature
   * Delegates to the centralized gateway for consistent signature verification
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    return gatewayVerifyWebhook(payload, signature);
  }

  /**
   * Get billing history (invoices) for a user
   */
  async getBillingHistory(userId: string, limit: number = 10): Promise<{
    invoices: Array<{
      id: string;
      number: string | null;
      status: string | null;
      amountDue: number;
      amountPaid: number;
      currency: string;
      periodStart: string;
      periodEnd: string;
      created: string;
      hostedInvoiceUrl: string | null;
      pdfUrl: string | null;
    }>;
  }> {
    const stripe = getStripeClient();

    // Get user's Stripe customer ID
    const userDoc = await this.db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return { invoices: [] };
    }

    try {
      const invoices = await stripe.invoices.list({
        customer: userData.stripeCustomerId,
        limit,
      });

      return {
        invoices: invoices.data.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status as string | null,
          amountDue: invoice.amount_due,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          periodStart: new Date((invoice.period_start || 0) * 1000).toISOString(),
          periodEnd: new Date((invoice.period_end || 0) * 1000).toISOString(),
          created: new Date((invoice.created || 0) * 1000).toISOString(),
          hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
          pdfUrl: invoice.invoice_pdf ?? null,
        })),
      };
    } catch (error) {
      logger.error('Failed to fetch billing history', { userId, error });
      return { invoices: [] };
    }
  }

  /**
   * Get upcoming invoice preview
   */
  async getUpcomingInvoice(userId: string): Promise<{
    amountDue: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
    lines: Array<{ description: string | null; amount: number }>;
  } | null> {
    const stripe = getStripeClient();

    const userDoc = await this.db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      return null;
    }

    try {
      const invoice = await stripe.invoices.createPreview({
        customer: userData.stripeCustomerId,
      });

      return {
        amountDue: invoice.amount_due,
        currency: invoice.currency,
        periodStart: new Date((invoice.period_start || 0) * 1000).toISOString(),
        periodEnd: new Date((invoice.period_end || 0) * 1000).toISOString(),
        lines: invoice.lines.data.map((line: Stripe.InvoiceLineItem) => ({
          description: line.description,
          amount: line.amount,
        })),
      };
    } catch (error) {
      // No upcoming invoice is normal for some states
      return null;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;
