/**
 * Stripe Connect Webhooks
 *
 * Handles webhooks for Stripe Connect:
 * - V2 Account events (thin events) for requirements and capability updates
 * - Subscription events for platform subscriptions
 *
 * Webhook Setup Instructions:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Click "+ Add destination"
 * 3. Select "Connected accounts" for Events from
 * 4. Click "Show advanced options", select "Thin" for Payload style
 * 5. Select events:
 *    - v2.core.account[requirements].updated
 *    - v2.core.account[configuration.merchant].capability_status_updated
 *    - v2.core.account[configuration.customer].capability_status_updated
 *    - v2.core.account[configuration.recipient].capability_status_updated
 * 6. Set endpoint URL to: https://us-central1-rapidtriage-me.cloudfunctions.net/connectWebhook
 *
 * For local testing with Stripe CLI:
 * stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[configuration.recipient].capability_status_updated,v2.core.account[configuration.merchant].capability_status_updated,v2.core.account[configuration.customer].capability_status_updated' --forward-thin-to http://localhost:5001/rapidtriage-me/us-central1/connectWebhook
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { logger } from 'firebase-functions';
import { connectService } from '../../services/connect.service.js';
import { defineSecret } from 'firebase-functions/params';

// Define webhook secret
const STRIPE_CONNECT_WEBHOOK_SECRET = defineSecret('STRIPE_CONNECT_WEBHOOK_SECRET');

/**
 * HTTP Function options for webhook
 */
const options: HttpsOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 60,
  minInstances: 0,
  maxInstances: 20,
  secrets: [STRIPE_CONNECT_WEBHOOK_SECRET],
};

/**
 * Handle Stripe Connect webhook events
 *
 * This endpoint handles V2 account events (thin events).
 * For subscription events, use the standard stripeWebhook endpoint.
 */
async function handleConnectWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    logger.warn('Missing Stripe signature header');
    res.status(400).json({ error: 'Missing signature' });
    return;
  }

  const webhookSecret = STRIPE_CONNECT_WEBHOOK_SECRET.value();

  if (!webhookSecret) {
    logger.error('STRIPE_CONNECT_WEBHOOK_SECRET not configured');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  try {
    // Get raw body for signature verification
    // Firebase Functions provides rawBody on the request
    const rawBody = (req as any).rawBody || req.body;

    // Handle the webhook event
    const result = await connectService.handleAccountWebhook(
      rawBody,
      signature,
      webhookSecret
    );

    logger.info('Processed Connect webhook', {
      eventType: result.eventType,
      handled: result.handled,
    });

    res.status(200).json({ received: true, eventType: result.eventType });
  } catch (error: any) {
    logger.error('Connect webhook error', {
      error: error.message,
      type: error.type,
    });

    // Return 400 for signature verification failures
    if (error.message?.includes('signature')) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    // Return 200 for other errors to prevent Stripe retries
    // (we've logged the error and can investigate)
    res.status(200).json({ error: 'Processing error', logged: true });
  }
}

/**
 * Stripe Connect Webhook HTTP Function
 */
export const connectWebhook = onRequest(options, async (request, response) => {
  // Only allow POST
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await handleConnectWebhook(request, response);
});
