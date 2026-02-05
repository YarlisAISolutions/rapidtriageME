/**
 * Stripe Connect Service for RapidTriageME
 *
 * Handles Stripe Connect V2 accounts integration for the platform.
 * - Creates connected accounts using V2 API
 * - Manages onboarding with embedded components
 * - Handles product creation and storefronts
 * - Processes direct charges with application fees
 *
 * Integration Setup:
 * - Funds flow: Sellers collect payments directly
 * - Industry: Website building or hosting
 * - Account creation: Embedded onboarding components
 * - Account management: Redirect to Stripe Dashboard
 * - Risk: Stripe manages risk and liability
 */

import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';

const db = admin.firestore();

/**
 * Get Stripe client instance
 * Uses the STRIPE_SECRET_KEY environment variable
 */
const getStripeClient = (): Stripe => {
  // PLACEHOLDER: Ensure STRIPE_SECRET_KEY is set in Firebase secrets
  // Run: firebase functions:secrets:set STRIPE_SECRET_KEY
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable not set. ' +
      'Run: firebase functions:secrets:set STRIPE_SECRET_KEY'
    );
  }
  return new Stripe(secretKey);
};

/**
 * Connected account status
 */
export interface ConnectedAccountStatus {
  accountId: string;
  displayName: string | null;
  email: string | null;
  country: string;
  onboardingComplete: boolean;
  readyToProcessPayments: boolean;
  requirementsStatus: string | null;
  dashboardUrl: string | null;
  createdAt: string;
}

/**
 * Product data for connected accounts
 */
export interface ConnectedProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  priceId: string | null;
  priceAmount: number | null;
  priceCurrency: string;
  imageUrl: string | null;
}

/**
 * Stripe Connect Service Class
 */
class ConnectService {
  /**
   * Create a new connected account using V2 API
   *
   * Uses the V2 accounts API with embedded onboarding components.
   * Stripe manages risk and is liable for losses.
   *
   * @param displayName - Business or individual name
   * @param contactEmail - Contact email for the account
   * @param userId - Platform user ID (for mapping)
   * @param country - ISO country code (default: 'us')
   */
  async createConnectedAccount(
    displayName: string,
    contactEmail: string,
    userId: string,
    country: string = 'us'
  ): Promise<{ accountId: string; account: any }> {
    const stripeClient = getStripeClient();

    try {
      // Create connected account using V2 API
      // Note: Do NOT use type: 'express' or type: 'standard' at top level
      const account = await (stripeClient as any).v2.core.accounts.create({
        display_name: displayName,
        contact_email: contactEmail,
        identity: {
          country: country.toLowerCase(),
        },
        // Full dashboard access for sellers to manage their account
        dashboard: 'full',
        defaults: {
          responsibilities: {
            // Stripe collects fees from the connected account
            fees_collector: 'stripe',
            // Stripe is liable for losses (fraud protection)
            losses_collector: 'stripe',
          },
        },
        configuration: {
          // Enable customer configuration for subscriptions
          customer: {},
          // Enable merchant configuration for payments
          merchant: {
            capabilities: {
              card_payments: {
                requested: true,
              },
            },
          },
        },
      });

      // Store mapping in Firestore
      await db.collection('connected_accounts').doc(account.id).set({
        accountId: account.id,
        userId,
        displayName,
        contactEmail,
        country,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Also update user document with connected account ID
      await db.collection('users').doc(userId).set({
        connectedAccountId: account.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      logger.info('Created connected account', {
        accountId: account.id,
        userId,
        displayName,
      });

      return { accountId: account.id, account };
    } catch (error: any) {
      logger.error('Failed to create connected account', {
        userId,
        displayName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create an account link for onboarding
   *
   * Uses V2 account links API for embedded onboarding components.
   */
  async createAccountLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string
  ): Promise<{ url: string }> {
    const stripeClient = getStripeClient();

    try {
      const accountLink = await (stripeClient as any).v2.core.accountLinks.create({
        account: accountId,
        use_case: {
          type: 'account_onboarding',
          account_onboarding: {
            // Configure both merchant and customer capabilities
            configurations: ['merchant', 'customer'],
            refresh_url: refreshUrl,
            return_url: `${returnUrl}?accountId=${accountId}`,
          },
        },
      });

      logger.info('Created account link', { accountId });

      return { url: accountLink.url };
    } catch (error: any) {
      logger.error('Failed to create account link', {
        accountId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get connected account status
   *
   * Retrieves the account status including onboarding and payment readiness.
   * Always fetches from API directly (not cached).
   */
  async getAccountStatus(accountId: string): Promise<ConnectedAccountStatus> {
    const stripeClient = getStripeClient();

    try {
      // Retrieve account with configuration and requirements included
      const account = await (stripeClient as any).v2.core.accounts.retrieve(accountId, {
        include: ['configuration.merchant', 'requirements'],
      });

      // Check if ready to process payments
      // Card payments capability must be active
      const readyToProcessPayments =
        account?.configuration?.merchant?.capabilities?.card_payments?.status === 'active';

      // Check requirements status
      const requirementsStatus =
        account.requirements?.summary?.minimum_deadline?.status ?? null;

      // Onboarding is complete when no currently_due or past_due requirements
      const onboardingComplete =
        requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due';

      return {
        accountId: account.id,
        displayName: account.display_name ?? null,
        email: account.contact_email ?? null,
        country: account.identity?.country ?? 'unknown',
        onboardingComplete,
        readyToProcessPayments,
        requirementsStatus,
        dashboardUrl: `https://dashboard.stripe.com/${accountId}`,
        createdAt: account.created ? new Date(account.created * 1000).toISOString() : new Date().toISOString(),
      };
    } catch (error: any) {
      logger.error('Failed to get account status', {
        accountId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get connected account by user ID
   */
  async getAccountByUserId(userId: string): Promise<string | null> {
    const userDoc = await db.collection('users').doc(userId).get();
    return userDoc.exists ? (userDoc.data()?.connectedAccountId ?? null) : null;
  }

  /**
   * Create a product on a connected account
   *
   * Uses the Stripe-Account header to create products on the connected account.
   */
  async createProduct(
    accountId: string,
    name: string,
    description: string,
    priceInCents: number,
    currency: string = 'usd',
    imageUrl?: string
  ): Promise<ConnectedProduct> {
    const stripeClient = getStripeClient();

    try {
      const productData: any = {
        name,
        description,
        default_price_data: {
          unit_amount: priceInCents,
          currency: currency.toLowerCase(),
        },
      };

      if (imageUrl) {
        productData.images = [imageUrl];
      }

      // Create product with stripeAccount header for connected account
      const product = await stripeClient.products.create(productData, {
        stripeAccount: accountId,
      });

      logger.info('Created product on connected account', {
        accountId,
        productId: product.id,
        name,
      });

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        priceId: typeof product.default_price === 'string' ? product.default_price : product.default_price?.id ?? null,
        priceAmount: priceInCents,
        priceCurrency: currency,
        imageUrl: product.images?.[0] ?? null,
      };
    } catch (error: any) {
      logger.error('Failed to create product', {
        accountId,
        name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * List products for a connected account (storefront)
   *
   * Uses the Stripe-Account header to retrieve products.
   */
  async listProducts(accountId: string, limit: number = 20): Promise<ConnectedProduct[]> {
    const stripeClient = getStripeClient();

    try {
      // List active products with default price expanded
      const products = await stripeClient.products.list(
        {
          limit,
          active: true,
          expand: ['data.default_price'],
        },
        {
          stripeAccount: accountId,
        }
      );

      return products.data.map((product) => {
        const defaultPrice = product.default_price as Stripe.Price | null;
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          priceId: defaultPrice?.id ?? null,
          priceAmount: defaultPrice?.unit_amount ?? null,
          priceCurrency: defaultPrice?.currency ?? 'usd',
          imageUrl: product.images?.[0] ?? null,
        };
      });
    } catch (error: any) {
      logger.error('Failed to list products', {
        accountId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a checkout session for a direct charge
   *
   * Uses direct charges with application fee for monetization.
   * The connected account receives the payment directly.
   */
  async createCheckoutSession(
    accountId: string,
    priceId: string,
    quantity: number,
    successUrl: string,
    cancelUrl: string,
    applicationFeePercent: number = 10 // 10% platform fee
  ): Promise<{ sessionId: string; url: string }> {
    const stripeClient = getStripeClient();

    try {
      // Get the price to calculate application fee
      const price = await stripeClient.prices.retrieve(priceId, {
        stripeAccount: accountId,
      });

      const unitAmount = price.unit_amount ?? 0;
      const applicationFeeAmount = Math.round((unitAmount * quantity * applicationFeePercent) / 100);

      // Create checkout session with direct charge
      const session = await stripeClient.checkout.sessions.create(
        {
          line_items: [
            {
              price: priceId,
              quantity,
            },
          ],
          payment_intent_data: {
            // Application fee goes to the platform
            application_fee_amount: applicationFeeAmount,
          },
          mode: 'payment',
          success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl,
        },
        {
          stripeAccount: accountId,
        }
      );

      logger.info('Created checkout session', {
        accountId,
        sessionId: session.id,
        applicationFee: applicationFeeAmount,
      });

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error: any) {
      logger.error('Failed to create checkout session', {
        accountId,
        priceId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a subscription checkout session for platform subscription
   *
   * Charges the connected account for platform subscription using customer_account.
   */
  async createSubscriptionCheckout(
    accountId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    const stripeClient = getStripeClient();

    try {
      // Create subscription checkout with customer_account
      // This charges the connected account for platform services
      const session = await stripeClient.checkout.sessions.create({
        customer_account: accountId, // V2 accounts use customer_account
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
      });

      logger.info('Created subscription checkout', {
        accountId,
        sessionId: session.id,
      });

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error: any) {
      logger.error('Failed to create subscription checkout', {
        accountId,
        priceId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a billing portal session for connected account
   *
   * Allows connected accounts to manage their platform subscription.
   */
  async createBillingPortalSession(
    accountId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    const stripeClient = getStripeClient();

    try {
      // Create billing portal session with customer_account
      const session = await stripeClient.billingPortal.sessions.create({
        customer_account: accountId,
        return_url: returnUrl,
      });

      logger.info('Created billing portal session', { accountId });

      return { url: session.url };
    } catch (error: any) {
      logger.error('Failed to create billing portal session', {
        accountId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle V2 account webhook events (thin events)
   *
   * Processes account requirement updates and capability status changes.
   */
  async handleAccountWebhook(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Promise<{ handled: boolean; eventType: string }> {
    const stripeClient = getStripeClient();

    try {
      // Parse thin event
      const thinEvent = (stripeClient as any).parseThinEvent(payload, signature, webhookSecret);

      // Fetch the full event data
      const event = await (stripeClient as any).v2.core.events.retrieve(thinEvent.id);

      logger.info('Received V2 account event', {
        eventId: event.id,
        eventType: event.type,
      });

      // Handle different event types
      switch (event.type) {
        case 'v2.core.account[requirements].updated':
          await this.handleRequirementsUpdate(event);
          break;

        case 'v2.core.account[configuration.merchant].capability_status_updated':
          await this.handleMerchantCapabilityUpdate(event);
          break;

        case 'v2.core.account[configuration.customer].capability_status_updated':
          await this.handleCustomerCapabilityUpdate(event);
          break;

        case 'v2.core.account[configuration.recipient].capability_status_updated':
          await this.handleRecipientCapabilityUpdate(event);
          break;

        default:
          logger.warn('Unhandled V2 account event type', { eventType: event.type });
      }

      return { handled: true, eventType: event.type };
    } catch (error: any) {
      logger.error('Failed to handle account webhook', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle requirements update event
   */
  private async handleRequirementsUpdate(event: any): Promise<void> {
    const accountId = event.data?.object?.id;
    if (!accountId) return;

    // Get fresh account status
    const status = await this.getAccountStatus(accountId);

    // Update Firestore with new status
    await db.collection('connected_accounts').doc(accountId).set({
      onboardingComplete: status.onboardingComplete,
      readyToProcessPayments: status.readyToProcessPayments,
      requirementsStatus: status.requirementsStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info('Updated account requirements', {
      accountId,
      onboardingComplete: status.onboardingComplete,
      readyToProcessPayments: status.readyToProcessPayments,
    });
  }

  /**
   * Handle merchant capability status update
   */
  private async handleMerchantCapabilityUpdate(event: any): Promise<void> {
    const accountId = event.data?.object?.id;
    if (!accountId) return;

    const status = await this.getAccountStatus(accountId);

    await db.collection('connected_accounts').doc(accountId).set({
      readyToProcessPayments: status.readyToProcessPayments,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info('Updated merchant capability', {
      accountId,
      readyToProcessPayments: status.readyToProcessPayments,
    });
  }

  /**
   * Handle customer capability status update
   */
  private async handleCustomerCapabilityUpdate(event: any): Promise<void> {
    const accountId = event.data?.object?.id;
    if (!accountId) return;

    logger.info('Customer capability updated', { accountId });

    await db.collection('connected_accounts').doc(accountId).set({
      customerCapabilityUpdated: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  /**
   * Handle recipient capability status update
   */
  private async handleRecipientCapabilityUpdate(event: any): Promise<void> {
    const accountId = event.data?.object?.id;
    if (!accountId) return;

    logger.info('Recipient capability updated', { accountId });

    await db.collection('connected_accounts').doc(accountId).set({
      recipientCapabilityUpdated: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  /**
   * Handle subscription webhook events (standard events, not thin)
   *
   * Processes subscription lifecycle events for platform subscriptions.
   */
  async handleSubscriptionWebhook(event: Stripe.Event): Promise<void> {
    logger.info('Received subscription event', {
      eventId: event.id,
      eventType: event.type,
    });

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // For V2 accounts, get ID from customer_account (shape: acct_)
        const accountId = (subscription as any).customer_account;
        if (accountId) {
          await this.updateAccountSubscription(accountId, subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const accountId = (subscription as any).customer_account;
        if (accountId) {
          await this.handleSubscriptionDeleted(accountId, subscription);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info('Invoice paid', {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        logger.warn('Invoice payment failed', {
          invoiceId: invoice.id,
          amountDue: invoice.amount_due,
        });
        break;
      }

      case 'payment_method.attached':
      case 'payment_method.detached':
        logger.info('Payment method event', { eventType: event.type });
        break;

      default:
        logger.info('Unhandled subscription event', { eventType: event.type });
    }
  }

  /**
   * Update account subscription status in Firestore
   */
  private async updateAccountSubscription(
    accountId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    const priceId = subscription.items.data[0]?.price.id;
    const status = subscription.status;

    // TODO: Store subscription status in database
    // This is where you'd update the connected account's subscription tier

    await db.collection('connected_accounts').doc(accountId).set({
      subscriptionId: subscription.id,
      subscriptionStatus: status,
      subscriptionPriceId: priceId,
      subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info('Updated account subscription', {
      accountId,
      subscriptionId: subscription.id,
      status,
    });
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(
    accountId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    // TODO: Revoke access to premium features

    await db.collection('connected_accounts').doc(accountId).set({
      subscriptionId: null,
      subscriptionStatus: 'canceled',
      subscriptionPriceId: null,
      subscriptionCancelAtPeriodEnd: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info('Subscription deleted', {
      accountId,
      subscriptionId: subscription.id,
    });
  }
}

// Export singleton instance
export const connectService = new ConnectService();
export default connectService;
