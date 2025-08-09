import { paymentService, SubscriptionTier, PaymentMethodType } from '../../services/payment/payment.service';
import { ApiService } from '../../services/api/api.service';
import { initStripe, createPaymentMethod, confirmPayment } from '@stripe/stripe-react-native';

// Mock dependencies
jest.mock('@stripe/stripe-react-native', () => ({
  initStripe: jest.fn(),
  createPaymentMethod: jest.fn(),
  confirmPayment: jest.fn(),
}));

jest.mock('../../services/api/api.service');
jest.mock('@env', () => ({
  STRIPE_PUBLISHABLE_KEY: 'pk_test_mock_key',
  APP_ENV: 'test',
}));

/**
 * Unit tests for PaymentService
 * Tests critical payment flows, subscription management, and error handling
 * 
 * Test coverage:
 * - Payment service initialization
 * - Subscription creation and management
 * - Payment method handling
 * - Error scenarios and edge cases
 * - Data validation and security
 */
describe('PaymentService', () => {
  let mockApiService: jest.Mocked<ApiService>;
  let mockInitStripe: jest.MockedFunction<typeof initStripe>;
  let mockCreatePaymentMethod: jest.MockedFunction<typeof createPaymentMethod>;
  let mockConfirmPayment: jest.MockedFunction<typeof confirmPayment>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock API service
    mockApiService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Mock Stripe functions
    mockInitStripe = initStripe as jest.MockedFunction<typeof initStripe>;
    mockCreatePaymentMethod = createPaymentMethod as jest.MockedFunction<typeof createPaymentMethod>;
    mockConfirmPayment = confirmPayment as jest.MockedFunction<typeof confirmPayment>;

    // Replace the API service instance
    (paymentService as any).apiService = mockApiService;
  });

  describe('Service Initialization', () => {
    test('should initialize Stripe SDK successfully', async () => {
      mockInitStripe.mockResolvedValueOnce({ error: null } as any);

      await paymentService.initialize();

      expect(mockInitStripe).toHaveBeenCalledWith({
        publishableKey: 'pk_test_mock_key',
        setUrlSchemeOnAndroid: true,
        enableGooglePay: true,
        googlePayConfig: {
          testEnv: true,
          merchantName: 'RapidTriage',
          countryCode: 'US',
          billingAddressConfig: {
            format: 'FULL',
            isRequired: true,
          },
        },
      });
    });

    test('should handle Stripe initialization failure', async () => {
      const error = new Error('Stripe initialization failed');
      mockInitStripe.mockResolvedValueOnce({ error } as any);

      await expect(paymentService.initialize()).rejects.toThrow(
        'Failed to initialize Stripe: Stripe initialization failed'
      );
    });

    test('should have correct subscription plans configuration', () => {
      const plans = paymentService.subscriptionPlans;

      expect(plans).toHaveLength(4);
      expect(plans.map(p => p.tier)).toEqual([
        SubscriptionTier.FREE,
        SubscriptionTier.PRO,
        SubscriptionTier.TEAM,
        SubscriptionTier.ENTERPRISE,
      ]);

      // Verify free plan
      const freePlan = plans.find(p => p.tier === SubscriptionTier.FREE);
      expect(freePlan).toMatchObject({
        price: 0,
        monthlySessionLimit: 100,
        maxUsers: 1,
      });

      // Verify pro plan
      const proPlan = plans.find(p => p.tier === SubscriptionTier.PRO);
      expect(proPlan).toMatchObject({
        price: 2900,
        monthlySessionLimit: null,
        maxUsers: 1,
      });
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      mockInitStripe.mockResolvedValueOnce({ error: null } as any);
      await paymentService.initialize();
    });

    test('should create free subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        plan: { tier: SubscriptionTier.FREE },
        status: 'active',
      };

      mockApiService.post.mockResolvedValueOnce(mockSubscription);

      const result = await paymentService.createSubscription(
        'user_123',
        'free_plan'
      );

      expect(mockApiService.post).toHaveBeenCalledWith('/subscriptions', {
        userId: 'user_123',
        planId: 'free_plan',
        paymentMethodId: undefined,
        trialDays: undefined,
      });

      expect(result).toEqual(mockSubscription);
    });

    test('should create paid subscription with payment method', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        plan: { tier: SubscriptionTier.PRO },
        status: 'active',
      };

      mockApiService.post.mockResolvedValueOnce(mockSubscription);

      const result = await paymentService.createSubscription(
        'user_123',
        'pro_plan',
        'pm_123'
      );

      expect(mockApiService.post).toHaveBeenCalledWith('/subscriptions', {
        userId: 'user_123',
        planId: 'pro_plan',
        paymentMethodId: 'pm_123',
        trialDays: undefined,
      });

      expect(result).toEqual(mockSubscription);
    });

    test('should require payment method for paid plans without trial', async () => {
      await expect(
        paymentService.createSubscription('user_123', 'pro_plan')
      ).rejects.toThrow('Payment method required for paid subscriptions');

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    test('should handle invalid plan ID', async () => {
      await expect(
        paymentService.createSubscription('user_123', 'invalid_plan')
      ).rejects.toThrow('Invalid plan ID: invalid_plan');

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    test('should update subscription successfully', async () => {
      const mockUpdatedSubscription = {
        id: 'sub_123',
        plan: { tier: SubscriptionTier.TEAM },
        status: 'active',
      };

      mockApiService.put.mockResolvedValueOnce(mockUpdatedSubscription);

      const result = await paymentService.updateSubscription(
        'sub_123',
        'team_plan'
      );

      expect(mockApiService.put).toHaveBeenCalledWith('/subscriptions/sub_123', {
        planId: 'team_plan',
        prorationBehavior: 'immediate',
      });

      expect(result).toEqual(mockUpdatedSubscription);
    });

    test('should cancel subscription with end-of-period cancellation', async () => {
      const mockCancelledSubscription = {
        id: 'sub_123',
        status: 'cancelled',
        cancelAtPeriodEnd: true,
      };

      mockApiService.post.mockResolvedValueOnce(mockCancelledSubscription);

      const result = await paymentService.cancelSubscription(
        'sub_123',
        false,
        'user_requested'
      );

      expect(mockApiService.post).toHaveBeenCalledWith('/subscriptions/sub_123/cancel', {
        cancelImmediately: false,
        cancellationReason: 'user_requested',
      });

      expect(result).toEqual(mockCancelledSubscription);
    });
  });

  describe('Payment Methods', () => {
    beforeEach(async () => {
      mockInitStripe.mockResolvedValueOnce({ error: null } as any);
      await paymentService.initialize();
    });

    test('should add card payment method successfully', async () => {
      const mockPaymentMethod = {
        id: 'pm_123',
        type: PaymentMethodType.CARD,
        last4: '4242',
        brand: 'visa',
        isDefault: false,
      };

      mockCreatePaymentMethod.mockResolvedValueOnce({
        paymentMethod: { id: 'pm_stripe_123' },
        error: null,
      } as any);

      mockApiService.post.mockResolvedValueOnce(mockPaymentMethod);

      const result = await paymentService.addPaymentMethod(
        'user_123',
        PaymentMethodType.CARD,
        false
      );

      expect(mockCreatePaymentMethod).toHaveBeenCalledWith({
        paymentMethodType: 'Card',
      });

      expect(mockApiService.post).toHaveBeenCalledWith('/payment-methods', {
        userId: 'user_123',
        stripePaymentMethodId: 'pm_stripe_123',
        type: PaymentMethodType.CARD,
        setAsDefault: false,
      });

      expect(result).toEqual(mockPaymentMethod);
    });

    test('should handle payment method creation error', async () => {
      const error = { message: 'Invalid card number' };
      mockCreatePaymentMethod.mockResolvedValueOnce({
        paymentMethod: null,
        error,
      } as any);

      await expect(
        paymentService.addPaymentMethod('user_123', PaymentMethodType.CARD)
      ).rejects.toThrow('Invalid card number');

      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    test('should remove payment method successfully', async () => {
      mockApiService.delete.mockResolvedValueOnce({});

      await paymentService.removePaymentMethod('pm_123', 'user_123');

      expect(mockApiService.delete).toHaveBeenCalledWith('/payment-methods/pm_123', {
        data: { userId: 'user_123' },
      });
    });

    test('should get user payment methods', async () => {
      const mockPaymentMethods = [
        {
          id: 'pm_123',
          type: PaymentMethodType.CARD,
          last4: '4242',
          brand: 'visa',
          isDefault: true,
        },
        {
          id: 'pm_456',
          type: PaymentMethodType.CARD,
          last4: '1234',
          brand: 'mastercard',
          isDefault: false,
        },
      ];

      mockApiService.get.mockResolvedValueOnce(mockPaymentMethods);

      const result = await paymentService.getPaymentMethods('user_123');

      expect(mockApiService.get).toHaveBeenCalledWith('/users/user_123/payment-methods');
      expect(result).toEqual(mockPaymentMethods);
    });

    test('should handle unsupported payment method types', async () => {
      await expect(
        paymentService.addPaymentMethod('user_123', PaymentMethodType.APPLE_PAY)
      ).rejects.toThrow('Apple Pay not yet implemented');

      await expect(
        paymentService.addPaymentMethod('user_123', PaymentMethodType.GOOGLE_PAY)
      ).rejects.toThrow('Google Pay not yet implemented');
    });
  });

  describe('Payment Intents', () => {
    beforeEach(async () => {
      mockInitStripe.mockResolvedValueOnce({ error: null } as any);
      await paymentService.initialize();
    });

    test('should create payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        amount: 2900,
        currency: 'usd',
        status: 'requires_payment_method',
        clientSecret: 'pi_123_secret',
      };

      mockApiService.post.mockResolvedValueOnce(mockPaymentIntent);

      const result = await paymentService.createPaymentIntent(2900, 'usd');

      expect(mockApiService.post).toHaveBeenCalledWith('/payment-intents', {
        amount: 2900,
        currency: 'usd',
        paymentMethodId: undefined,
      });

      expect(result).toEqual(mockPaymentIntent);
    });

    test('should confirm payment successfully', async () => {
      mockConfirmPayment.mockResolvedValueOnce({
        paymentIntent: { status: 'succeeded' },
        error: null,
      } as any);

      const result = await paymentService.confirmPayment(
        'pi_123_secret',
        'pm_123'
      );

      expect(mockConfirmPayment).toHaveBeenCalledWith('pi_123_secret', {
        paymentMethodType: 'Card',
        paymentMethodId: 'pm_123',
      });

      expect(result).toEqual({ success: true });
    });

    test('should handle payment confirmation failure', async () => {
      const error = { message: 'Your card was declined' };
      mockConfirmPayment.mockResolvedValueOnce({
        paymentIntent: null,
        error,
      } as any);

      const result = await paymentService.confirmPayment('pi_123_secret');

      expect(result).toEqual({
        success: false,
        error: 'Your card was declined',
      });
    });
  });

  describe('Subscription Queries', () => {
    test('should get user subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        plan: { tier: SubscriptionTier.PRO },
        status: 'active',
      };

      mockApiService.get.mockResolvedValueOnce(mockSubscription);

      const result = await paymentService.getUserSubscription('user_123');

      expect(mockApiService.get).toHaveBeenCalledWith('/users/user_123/subscription');
      expect(result).toEqual(mockSubscription);
    });

    test('should return null for user without subscription', async () => {
      const error = { status: 404 };
      mockApiService.get.mockRejectedValueOnce(error);

      const result = await paymentService.getUserSubscription('user_123');

      expect(result).toBeNull();
    });

    test('should throw error for other API failures', async () => {
      const error = { status: 500, message: 'Server error' };
      mockApiService.get.mockRejectedValueOnce(error);

      await expect(
        paymentService.getUserSubscription('user_123')
      ).rejects.toEqual(error);
    });
  });

  describe('Plan Utilities', () => {
    test('should get plan by ID', () => {
      const plan = paymentService.getPlanById('pro_plan');

      expect(plan).toBeDefined();
      expect(plan?.tier).toBe(SubscriptionTier.PRO);
      expect(plan?.price).toBe(2900);
    });

    test('should return undefined for invalid plan ID', () => {
      const plan = paymentService.getPlanById('invalid_plan');

      expect(plan).toBeUndefined();
    });

    test('should get plan by tier', () => {
      const plan = paymentService.getPlanByTier(SubscriptionTier.TEAM);

      expect(plan).toBeDefined();
      expect(plan?.tier).toBe(SubscriptionTier.TEAM);
      expect(plan?.maxUsers).toBe(5);
    });

    test('should check upgrade eligibility correctly', () => {
      expect(paymentService.canUpgradeTo(SubscriptionTier.FREE, SubscriptionTier.PRO)).toBe(true);
      expect(paymentService.canUpgradeTo(SubscriptionTier.PRO, SubscriptionTier.TEAM)).toBe(true);
      expect(paymentService.canUpgradeTo(SubscriptionTier.TEAM, SubscriptionTier.ENTERPRISE)).toBe(true);

      expect(paymentService.canUpgradeTo(SubscriptionTier.PRO, SubscriptionTier.FREE)).toBe(false);
      expect(paymentService.canUpgradeTo(SubscriptionTier.TEAM, SubscriptionTier.PRO)).toBe(false);
      expect(paymentService.canUpgradeTo(SubscriptionTier.PRO, SubscriptionTier.PRO)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      mockInitStripe.mockResolvedValueOnce({ error: null } as any);
      await paymentService.initialize();
    });

    test('should handle API service errors gracefully', async () => {
      const apiError = new Error('Network error');
      mockApiService.post.mockRejectedValueOnce(apiError);

      await expect(
        paymentService.createSubscription('user_123', 'pro_plan', 'pm_123')
      ).rejects.toThrow('Failed to create subscription: Network error');
    });

    test('should handle missing user ID', async () => {
      await expect(
        paymentService.createSubscription('', 'pro_plan')
      ).rejects.toThrow();
    });

    test('should require initialization before operations', async () => {
      // Create a new service instance without initialization
      const uninitializedService = Object.create(paymentService);
      (uninitializedService as any).isInitialized = false;

      await expect(
        uninitializedService.createSubscription('user_123', 'pro_plan')
      ).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(async () => {
      mockInitStripe.mockResolvedValueOnce({ error: null } as any);
      await paymentService.initialize();
    });

    test('should handle complete upgrade flow', async () => {
      // Step 1: Add payment method
      const mockPaymentMethod = {
        id: 'pm_123',
        type: PaymentMethodType.CARD,
        isDefault: true,
      };

      mockCreatePaymentMethod.mockResolvedValueOnce({
        paymentMethod: { id: 'pm_stripe_123' },
        error: null,
      } as any);

      mockApiService.post.mockResolvedValueOnce(mockPaymentMethod);

      const paymentMethod = await paymentService.addPaymentMethod(
        'user_123',
        PaymentMethodType.CARD,
        true
      );

      // Step 2: Create subscription
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        plan: { tier: SubscriptionTier.PRO },
        status: 'active',
      };

      mockApiService.post.mockResolvedValueOnce(mockSubscription);

      const subscription = await paymentService.createSubscription(
        'user_123',
        'pro_plan',
        paymentMethod.id
      );

      expect(subscription.plan.tier).toBe(SubscriptionTier.PRO);
      expect(subscription.status).toBe('active');
    });

    test('should handle downgrade with cancellation', async () => {
      // Current subscription
      const mockCurrentSubscription = {
        id: 'sub_123',
        plan: { tier: SubscriptionTier.PRO },
        status: 'active',
      };

      // Cancel current subscription
      mockApiService.post.mockResolvedValueOnce({
        ...mockCurrentSubscription,
        status: 'cancelled',
        cancelAtPeriodEnd: true,
      });

      const cancelledSubscription = await paymentService.cancelSubscription(
        'sub_123',
        false,
        'downgrade_requested'
      );

      expect(cancelledSubscription.status).toBe('cancelled');
      expect(cancelledSubscription.cancelAtPeriodEnd).toBe(true);
    });
  });
});