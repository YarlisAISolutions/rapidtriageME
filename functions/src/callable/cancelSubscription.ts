/**
 * Cancel Subscription Callable Function
 * 
 * Cancels the user's subscription at the end of the current billing period.
 * The user retains access until the period ends.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import stripeService from '../services/stripe.service.js';

/**
 * Input data for canceling subscription
 */
interface CancelSubscriptionData {
  reason?: string;
  feedback?: string;
}

/**
 * Response data from canceling subscription
 */
interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
}

/**
 * Cancel Subscription
 * 
 * Sets the user's subscription to cancel at the end of the current
 * billing period. The user retains access to paid features until then.
 * 
 * @param data.reason - Optional cancellation reason for analytics
 * @param data.feedback - Optional feedback from the user
 * 
 * @returns Success status and confirmation message
 */
export const cancelSubscription = onCall<CancelSubscriptionData>(
  async (request): Promise<CancelSubscriptionResponse> => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to cancel your subscription'
      );
    }

    const userId = request.auth.uid;
    const { reason, feedback } = request.data || {};

    try {
      logger.info('Canceling subscription', {
        userId,
        reason,
        feedback,
      });

      await stripeService.cancelSubscription(userId);

      // Log cancellation reason for analytics (could store in Firestore)
      if (reason || feedback) {
        logger.info('Subscription cancellation feedback', {
          userId,
          reason,
          feedback,
        });
      }

      return {
        success: true,
        message: 'Your subscription has been set to cancel at the end of the current billing period.',
      };
    } catch (error: any) {
      logger.error('Failed to cancel subscription', {
        userId,
        error: error.message,
      });

      if (error.message.includes('No active subscription')) {
        throw new HttpsError(
          'failed-precondition',
          'You do not have an active subscription to cancel'
        );
      }

      throw new HttpsError(
        'internal',
        'Failed to cancel subscription'
      );
    }
  }
);

/**
 * Reactivate Subscription
 * 
 * Reactivates a subscription that was set to cancel at period end.
 * Only works if the subscription hasn't actually been canceled yet.
 */
export const reactivateSubscription = onCall(
  async (request): Promise<CancelSubscriptionResponse> => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to reactivate your subscription'
      );
    }

    const userId = request.auth.uid;

    try {
      logger.info('Reactivating subscription', { userId });

      await stripeService.reactivateSubscription(userId);

      return {
        success: true,
        message: 'Your subscription has been reactivated.',
      };
    } catch (error: any) {
      logger.error('Failed to reactivate subscription', {
        userId,
        error: error.message,
      });

      throw new HttpsError(
        'internal',
        'Failed to reactivate subscription'
      );
    }
  }
);

export default cancelSubscription;
