/**
 * Get Subscription Callable Function
 * 
 * Returns the current user's subscription status and available pricing plans.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import stripeService, { 
  PRICING_PLANS, 
  SubscriptionTier,
  UserSubscription,
  PricingPlan 
} from '../services/stripe.service.js';

/**
 * Response data for getting subscription
 */
interface GetSubscriptionResponse {
  subscription: UserSubscription | null;
  tier: SubscriptionTier;
  pricingPlans: PricingPlan[];
}

/**
 * Get Subscription
 * 
 * Returns the authenticated user's current subscription status
 * and all available pricing plans.
 * 
 * @returns subscription - Current subscription or null for free tier
 * @returns tier - Current subscription tier
 * @returns pricingPlans - All available pricing plans
 */
export const getSubscription = onCall(
  async (request): Promise<GetSubscriptionResponse> => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to get subscription info'
      );
    }

    const userId = request.auth.uid;

    try {
      logger.info('Getting subscription info', { userId });

      const subscription = await stripeService.getUserSubscription(userId);
      const tier = subscription?.tier ?? SubscriptionTier.FREE;
      const pricingPlans = stripeService.getPricingPlans();

      return {
        subscription,
        tier,
        pricingPlans,
      };
    } catch (error: any) {
      logger.error('Failed to get subscription', {
        userId,
        error: error.message,
      });

      throw new HttpsError(
        'internal',
        'Failed to get subscription info'
      );
    }
  }
);

export default getSubscription;
