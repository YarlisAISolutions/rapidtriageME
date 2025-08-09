import { initStripe, PaymentIntent, createPaymentMethod, confirmPayment } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '@env';
import { ApiService } from '../api/api.service';

/**
 * Subscription tier definitions matching Phase 1 pricing
 * These tiers determine feature access and usage limits
 */
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro', 
  TEAM = 'team',
  ENTERPRISE = 'enterprise'
}

/**
 * Payment method types supported by the app
 * Includes traditional cards and mobile payment options
 */
export enum PaymentMethodType {
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay'
}

/**
 * Interface for subscription plan configuration
 * Contains all necessary information for plan management and billing
 */
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number; // Monthly price in cents
  currency: string;
  features: string[];
  monthlySessionLimit: number | null; // null means unlimited
  maxUsers: number;
  stripePriceId?: string; // Stripe price ID for billing
}

/**
 * Current subscription status for a user
 * Tracks active subscription, usage, and billing information
 */
export interface UserSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

/**
 * Payment method information stored for user
 * Used for recurring billing and payment method management
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4?: string; // Last 4 digits for cards
  brand?: string; // Card brand (visa, mastercard, etc)
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId?: string;
}

/**
 * Payment intent for one-time or subscription payments
 * Handles the secure payment flow with Stripe
 */
export interface PaymentIntentData {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
  paymentMethodId?: string;
}

/**
 * Comprehensive payment service handling all monetization aspects
 * Manages subscriptions, payment methods, and secure payment processing
 * 
 * Key responsibilities:
 * - Initialize Stripe SDK with proper configuration
 * - Handle subscription creation, updates, and cancellations
 * - Manage payment methods securely with PCI compliance
 * - Process payments for upgrades and renewals
 * - Integrate with backend API for subscription management
 */
class PaymentService {
  private isInitialized = false;
  private apiService: ApiService;

  /**
   * Predefined subscription plans matching the Phase 1 pricing structure
   * These plans are used throughout the app for feature gating and billing
   */
  public readonly subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'free_plan',
      tier: SubscriptionTier.FREE,
      name: 'Free',
      price: 0,
      currency: 'usd',
      features: [
        '100 sessions per month',
        'Basic triage features',
        'Email support'
      ],
      monthlySessionLimit: 100,
      maxUsers: 1
    },
    {
      id: 'pro_plan',
      tier: SubscriptionTier.PRO,
      name: 'Pro',
      price: 2900, // $29.00 in cents
      currency: 'usd',
      features: [
        'Unlimited sessions',
        'Priority support',
        'Advanced analytics',
        'Export capabilities'
      ],
      monthlySessionLimit: null,
      maxUsers: 1,
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID
    },
    {
      id: 'team_plan',
      tier: SubscriptionTier.TEAM,
      name: 'Team',
      price: 9900, // $99.00 in cents
      currency: 'usd',
      features: [
        'Everything in Pro',
        'Up to 5 users',
        'Team collaboration',
        'Admin dashboard',
        'Team analytics'
      ],
      monthlySessionLimit: null,
      maxUsers: 5,
      stripePriceId: process.env.STRIPE_TEAM_PRICE_ID
    },
    {
      id: 'enterprise_plan',
      tier: SubscriptionTier.ENTERPRISE,
      name: 'Enterprise',
      price: 0, // Custom pricing
      currency: 'usd',
      features: [
        'Everything in Team',
        'Unlimited users',
        'SSO integration',
        'SLA guarantee',
        'Dedicated support',
        'Custom integrations'
      ],
      monthlySessionLimit: null,
      maxUsers: -1, // Unlimited
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
    }
  ];

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Initialize Stripe SDK with publishable key
   * Must be called before any other payment operations
   * Handles different environments (dev, staging, prod)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Stripe with the publishable key from environment
      // This establishes secure connection to Stripe's servers
      const { error } = await initStripe({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        setUrlSchemeOnAndroid: true, // Required for Android deep linking
        enableGooglePay: true, // Enable Google Pay for Android
        googlePayConfig: {
          testEnv: process.env.APP_ENV !== 'production',
          merchantName: 'RapidTriage',
          countryCode: 'US',
          billingAddressConfig: {
            format: 'FULL',
            isRequired: true,
          },
        },
      });

      if (error) {
        console.error('Stripe initialization error:', error);
        throw new Error(`Failed to initialize Stripe: ${error.message}`);
      }

      this.isInitialized = true;
      console.log('Stripe SDK initialized successfully');
    } catch (error) {
      console.error('Payment service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription for a user
   * Handles the complete subscription creation flow including payment
   * 
   * @param userId - User ID for the subscription
   * @param planId - Selected subscription plan ID
   * @param paymentMethodId - Optional payment method ID for paid plans
   * @param trialDays - Optional trial period in days
   */
  async createSubscription(
    userId: string, 
    planId: string, 
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<UserSubscription> {
    await this.ensureInitialized();

    try {
      const selectedPlan = this.subscriptionPlans.find(plan => plan.id === planId);
      if (!selectedPlan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      // For paid plans, payment method is required unless in trial
      if (selectedPlan.price > 0 && !paymentMethodId && !trialDays) {
        throw new Error('Payment method required for paid subscriptions');
      }

      // Call backend API to create subscription
      // Backend handles Stripe subscription creation and webhook processing
      const subscriptionData = await this.apiService.post('/subscriptions', {
        userId,
        planId,
        paymentMethodId,
        trialDays
      });

      return subscriptionData;
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Update existing subscription to a different plan
   * Handles upgrades, downgrades, and proration calculations
   * 
   * @param subscriptionId - Current subscription ID
   * @param newPlanId - Target plan ID
   * @param prorationBehavior - How to handle proration ('immediate' or 'next_cycle')
   */
  async updateSubscription(
    subscriptionId: string, 
    newPlanId: string,
    prorationBehavior: 'immediate' | 'next_cycle' = 'immediate'
  ): Promise<UserSubscription> {
    await this.ensureInitialized();

    try {
      const newPlan = this.subscriptionPlans.find(plan => plan.id === newPlanId);
      if (!newPlan) {
        throw new Error(`Invalid plan ID: ${newPlanId}`);
      }

      // Backend handles subscription modification through Stripe
      const updatedSubscription = await this.apiService.put(`/subscriptions/${subscriptionId}`, {
        planId: newPlanId,
        prorationBehavior
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Subscription update failed:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription with optional immediate or end-of-period cancellation
   * Provides options for retention offers and feedback collection
   * 
   * @param subscriptionId - Subscription ID to cancel
   * @param cancelImmediately - Whether to cancel immediately or at period end
   * @param cancellationReason - Optional reason for analytics
   */
  async cancelSubscription(
    subscriptionId: string, 
    cancelImmediately: boolean = false,
    cancellationReason?: string
  ): Promise<UserSubscription> {
    await this.ensureInitialized();

    try {
      const canceledSubscription = await this.apiService.post(`/subscriptions/${subscriptionId}/cancel`, {
        cancelImmediately,
        cancellationReason
      });

      return canceledSubscription;
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Add a new payment method for a user
   * Handles secure tokenization through Stripe and stores reference
   * 
   * @param userId - User ID to associate payment method with
   * @param type - Type of payment method (card, Apple Pay, Google Pay)
   * @param setAsDefault - Whether to set this as the default payment method
   */
  async addPaymentMethod(
    userId: string, 
    type: PaymentMethodType,
    setAsDefault: boolean = false
  ): Promise<PaymentMethod> {
    await this.ensureInitialized();

    try {
      let paymentMethodResult;

      // Handle different payment method types
      switch (type) {
        case PaymentMethodType.CARD:
          // For cards, use Stripe's payment method creation
          paymentMethodResult = await createPaymentMethod({
            paymentMethodType: 'Card',
          });
          break;
        case PaymentMethodType.APPLE_PAY:
          // Apple Pay integration would be handled here
          throw new Error('Apple Pay not yet implemented');
        case PaymentMethodType.GOOGLE_PAY:
          // Google Pay integration would be handled here
          throw new Error('Google Pay not yet implemented');
        default:
          throw new Error(`Unsupported payment method type: ${type}`);
      }

      if (paymentMethodResult.error) {
        throw new Error(paymentMethodResult.error.message);
      }

      // Save payment method reference to backend
      const savedPaymentMethod = await this.apiService.post('/payment-methods', {
        userId,
        stripePaymentMethodId: paymentMethodResult.paymentMethod?.id,
        type,
        setAsDefault
      });

      return savedPaymentMethod;
    } catch (error) {
      console.error('Payment method addition failed:', error);
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  /**
   * Remove a payment method from a user's account
   * Ensures default payment method is updated appropriately
   * 
   * @param paymentMethodId - Payment method ID to remove
   * @param userId - User ID for verification
   */
  async removePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      await this.apiService.delete(`/payment-methods/${paymentMethodId}`, {
        data: { userId }
      });
    } catch (error) {
      console.error('Payment method removal failed:', error);
      throw new Error(`Failed to remove payment method: ${error.message}`);
    }
  }

  /**
   * Get all payment methods for a user
   * Returns formatted payment method list for UI display
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    await this.ensureInitialized();

    try {
      const paymentMethods = await this.apiService.get(`/users/${userId}/payment-methods`);
      return paymentMethods;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  /**
   * Get current subscription for a user
   * Returns null if user has no active subscription (free tier)
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const subscription = await this.apiService.get(`/users/${userId}/subscription`);
      return subscription;
    } catch (error) {
      // If no subscription exists, user is on free tier
      if (error.status === 404) {
        return null;
      }
      console.error('Failed to fetch user subscription:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for one-time payments
   * Used for subscription upgrades or additional charges
   * 
   * @param amount - Payment amount in cents
   * @param currency - Currency code (default: USD)
   * @param paymentMethodId - Optional payment method ID
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    paymentMethodId?: string
  ): Promise<PaymentIntentData> {
    await this.ensureInitialized();

    try {
      const paymentIntent = await this.apiService.post('/payment-intents', {
        amount,
        currency,
        paymentMethodId
      });

      return paymentIntent;
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm a payment with Stripe
   * Handles the secure payment confirmation flow
   * 
   * @param paymentIntentClientSecret - Client secret from payment intent
   * @param paymentMethodId - Payment method to use for confirmation
   */
  async confirmPayment(
    paymentIntentClientSecret: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: string }> {
    await this.ensureInitialized();

    try {
      const { error, paymentIntent } = await confirmPayment(
        paymentIntentClientSecret,
        {
          paymentMethodType: 'Card',
          paymentMethodId
        }
      );

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: paymentIntent?.status === 'succeeded'
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get subscription plan by ID
   * Helper method for plan information retrieval
   */
  getPlanById(planId: string): SubscriptionPlan | undefined {
    return this.subscriptionPlans.find(plan => plan.id === planId);
  }

  /**
   * Get subscription plan by tier
   * Helper method for tier-based plan retrieval
   */
  getPlanByTier(tier: SubscriptionTier): SubscriptionPlan | undefined {
    return this.subscriptionPlans.find(plan => plan.tier === tier);
  }

  /**
   * Check if user can upgrade to a specific tier
   * Validates upgrade path and payment requirements
   */
  canUpgradeTo(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
    const tierOrder = [
      SubscriptionTier.FREE,
      SubscriptionTier.PRO,
      SubscriptionTier.TEAM,
      SubscriptionTier.ENTERPRISE
    ];

    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(targetTier);

    return targetIndex > currentIndex;
  }

  /**
   * Ensure Stripe is initialized before operations
   * Internal helper method for initialization checking
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService(new ApiService());
export default paymentService;