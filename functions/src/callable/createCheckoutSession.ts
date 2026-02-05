/**
 * Create Checkout Session Callable Function
 * 
 * Creates a Stripe Checkout Session for subscription purchases.
 * Called from the mobile app or web app to initiate payment flow.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import stripeService, { PRICING_PLANS } from '../services/stripe.service.js';

/**
 * Input data for creating a checkout session
 */
interface CreateCheckoutSessionData {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Response data from creating a checkout session
 */
interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create Checkout Session
 * 
 * Creates a Stripe Checkout Session for the authenticated user to purchase
 * or upgrade their subscription.
 * 
 * @param data.priceId - The Stripe Price ID for the subscription plan
 * @param data.successUrl - URL to redirect after successful payment
 * @param data.cancelUrl - URL to redirect if user cancels checkout
 * 
 * @returns sessionId and checkout URL
 */
export const createCheckoutSession = onCall<CreateCheckoutSessionData>(
  async (request): Promise<CreateCheckoutSessionResponse> => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to create a checkout session'
      );
    }

    const { priceId, successUrl, cancelUrl } = request.data;

    // Validate required fields
    if (!priceId) {
      throw new HttpsError(
        'invalid-argument',
        'Price ID is required'
      );
    }

    if (!successUrl || !cancelUrl) {
      throw new HttpsError(
        'invalid-argument',
        'Success and cancel URLs are required'
      );
    }

    // Validate price ID belongs to a valid plan
    const validPriceIds = PRICING_PLANS
      .filter(p => p.stripePriceIdMonthly || p.stripePriceIdYearly)
      .flatMap(p => [p.stripePriceIdMonthly, p.stripePriceIdYearly])
      .filter(Boolean);

    if (!validPriceIds.includes(priceId)) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid price ID'
      );
    }

    const userId = request.auth.uid;
    const email = request.auth.token.email;

    if (!email) {
      throw new HttpsError(
        'failed-precondition',
        'User email is required for checkout'
      );
    }

    try {
      logger.info('Creating checkout session', {
        userId,
        priceId,
      });

      const session = await stripeService.createCheckoutSession(
        userId,
        email,
        priceId,
        successUrl,
        cancelUrl
      );

      logger.info('Checkout session created', {
        userId,
        sessionId: session.sessionId,
      });

      return session;
    } catch (error: any) {
      logger.error('Failed to create checkout session', {
        userId,
        error: error.message,
      });

      throw new HttpsError(
        'internal',
        'Failed to create checkout session'
      );
    }
  }
);

export default createCheckoutSession;
