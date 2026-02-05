/**
 * Create Portal Session Callable Function
 * 
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Users can update payment methods, change plans, and cancel subscriptions.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import stripeService from '../services/stripe.service.js';

/**
 * Input data for creating a portal session
 */
interface CreatePortalSessionData {
  returnUrl: string;
}

/**
 * Response data from creating a portal session
 */
interface CreatePortalSessionResponse {
  url: string;
}

/**
 * Create Portal Session
 * 
 * Creates a Stripe Customer Portal session that allows users to:
 * - Update payment methods
 * - View billing history
 * - Change subscription plans
 * - Cancel their subscription
 * 
 * @param data.returnUrl - URL to redirect after user exits the portal
 * 
 * @returns Portal URL
 */
export const createPortalSession = onCall<CreatePortalSessionData>(
  async (request): Promise<CreatePortalSessionResponse> => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to access the customer portal'
      );
    }

    const { returnUrl } = request.data;

    // Validate required fields
    if (!returnUrl) {
      throw new HttpsError(
        'invalid-argument',
        'Return URL is required'
      );
    }

    const userId = request.auth.uid;

    try {
      logger.info('Creating portal session', { userId });

      const session = await stripeService.createPortalSession(userId, returnUrl);

      logger.info('Portal session created', { userId });

      return session;
    } catch (error: any) {
      logger.error('Failed to create portal session', {
        userId,
        error: error.message,
      });

      // Check for specific error cases
      if (error.message.includes('does not have a Stripe customer ID')) {
        throw new HttpsError(
          'failed-precondition',
          'You must have an active subscription to access the customer portal'
        );
      }

      throw new HttpsError(
        'internal',
        'Failed to create portal session'
      );
    }
  }
);

export default createPortalSession;
