/**
 * Stripe Webhook Handler
 * 
 * Handles incoming webhook events from Stripe for subscription management.
 * Events are verified using webhook signature before processing.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import Stripe from 'stripe';
import stripeService from '../../services/stripe.service.js';

/**
 * Stripe Webhook HTTP Function
 * 
 * Endpoint: /stripeWebhook
 * Method: POST
 * 
 * Handles the following events:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.paid: Payment successful
 * - invoice.payment_failed: Payment failed
 */
export const stripeWebhook = onRequest(
  { cors: false },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      logger.error('Missing Stripe signature header');
      res.status(400).send('Missing signature');
      return;
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripeService.verifyWebhookSignature(req.rawBody, signature);
    } catch (err: any) {
      logger.error('Webhook signature verification failed', { error: err.message });
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    logger.info(`Processing Stripe webhook: ${event.type}`, { eventId: event.id });

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(session);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(invoice);
          break;
        }

        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error('Error processing webhook', { 
        error: err.message, 
        eventType: event.type,
        eventId: event.id 
      });
      res.status(500).send(`Webhook processing error: ${err.message}`);
    }
  }
);

/**
 * Handle checkout.session.completed event
 * 
 * Triggered when a customer completes the checkout flow.
 * Creates or updates the subscription in Firestore.
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  logger.info('Checkout session completed', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    userId: session.metadata?.userId,
  });

  // Subscription will be created/updated via customer.subscription.created webhook
  // Log for tracking
  if (session.metadata?.userId) {
    logger.info(`User ${session.metadata.userId} completed checkout`);
  }
}

/**
 * Handle customer.subscription.created and customer.subscription.updated events
 * 
 * Updates the user's subscription status in Firestore.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  logger.info('Subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer,
    userId: subscription.metadata?.userId,
  });

  await stripeService.updateSubscriptionFromStripe(subscription);
}

/**
 * Handle customer.subscription.deleted event
 * 
 * Downgrades the user to free tier when subscription is deleted.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  logger.info('Subscription deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    userId: subscription.metadata?.userId,
  });

  await stripeService.handleSubscriptionDeleted(subscription);
}

/**
 * Handle invoice.paid event
 * 
 * Logs successful payment. The subscription status update is handled
 * by the subscription webhook events.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Get subscription ID from lines if available
  const subscriptionId = invoice.lines?.data?.[0]?.subscription as string | undefined;
  
  logger.info('Invoice paid', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    amountPaid: invoice.amount_paid,
    subscriptionId,
  });

  // Could send payment confirmation email here
  // Could track payment analytics here
}

/**
 * Handle invoice.payment_failed event
 * 
 * Logs failed payment. Stripe automatically handles retries based on
 * your billing settings. The subscription status will be updated via
 * subscription webhooks if it becomes past_due or unpaid.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // Get subscription ID from lines if available
  const subscriptionId = invoice.lines?.data?.[0]?.subscription as string | undefined;
  
  logger.warn('Invoice payment failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId,
    attemptCount: invoice.attempt_count,
  });

  // Could send payment failed notification email here
  // Could trigger in-app notification here
}

export default stripeWebhook;
