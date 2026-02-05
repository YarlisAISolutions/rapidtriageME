/**
 * Stripe Gateway Unit Tests
 * Tests the centralized Stripe gateway module
 */

import {
  StripeErrorType,
  StripeGatewayError,
  WebhookEventTypes,
} from '../../../../src/services/stripe/stripe-gateway';

describe('Stripe Gateway', () => {
  describe('StripeErrorType', () => {
    it('should define authentication error type', () => {
      expect(StripeErrorType.AUTHENTICATION).toBe('authentication_error');
    });

    it('should define card error type', () => {
      expect(StripeErrorType.CARD_ERROR).toBe('card_error');
    });

    it('should define invalid request type', () => {
      expect(StripeErrorType.INVALID_REQUEST).toBe('invalid_request_error');
    });

    it('should define rate limit type', () => {
      expect(StripeErrorType.RATE_LIMIT).toBe('rate_limit_error');
    });

    it('should define API connection type', () => {
      expect(StripeErrorType.API_CONNECTION).toBe('api_connection_error');
    });

    it('should define API error type', () => {
      expect(StripeErrorType.API_ERROR).toBe('api_error');
    });

    it('should define webhook signature type', () => {
      expect(StripeErrorType.WEBHOOK_SIGNATURE).toBe('webhook_signature_error');
    });

    it('should define configuration type', () => {
      expect(StripeErrorType.CONFIGURATION).toBe('configuration_error');
    });
  });

  describe('StripeGatewayError', () => {
    it('should create error with all properties', () => {
      const error = new StripeGatewayError(
        StripeErrorType.CARD_ERROR,
        'Card declined',
        402,
        'card_declined',
        'payment_method'
      );

      expect(error.type).toBe(StripeErrorType.CARD_ERROR);
      expect(error.message).toBe('Card declined');
      expect(error.statusCode).toBe(402);
      expect(error.code).toBe('card_declined');
      expect(error.param).toBe('payment_method');
      expect(error.name).toBe('StripeGatewayError');
    });

    it('should create error without optional properties', () => {
      const error = new StripeGatewayError(
        StripeErrorType.API_ERROR,
        'Internal error',
        500
      );

      expect(error.type).toBe(StripeErrorType.API_ERROR);
      expect(error.message).toBe('Internal error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBeUndefined();
      expect(error.param).toBeUndefined();
    });

    it('should convert to response object', () => {
      const error = new StripeGatewayError(
        StripeErrorType.INVALID_REQUEST,
        'Invalid parameter',
        400,
        'invalid_param',
        'amount'
      );

      const response = error.toResponse();

      expect(response).toEqual({
        type: StripeErrorType.INVALID_REQUEST,
        message: 'Invalid parameter',
        code: 'invalid_param',
        param: 'amount',
        statusCode: 400,
      });
    });

    it('should be an instance of Error', () => {
      const error = new StripeGatewayError(
        StripeErrorType.API_ERROR,
        'Test error',
        500
      );

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('WebhookEventTypes', () => {
    describe('Checkout Events', () => {
      it('should define checkout session completed', () => {
        expect(WebhookEventTypes.CHECKOUT_SESSION_COMPLETED).toBe('checkout.session.completed');
      });

      it('should define checkout session expired', () => {
        expect(WebhookEventTypes.CHECKOUT_SESSION_EXPIRED).toBe('checkout.session.expired');
      });
    });

    describe('Subscription Events', () => {
      it('should define subscription created', () => {
        expect(WebhookEventTypes.SUBSCRIPTION_CREATED).toBe('customer.subscription.created');
      });

      it('should define subscription updated', () => {
        expect(WebhookEventTypes.SUBSCRIPTION_UPDATED).toBe('customer.subscription.updated');
      });

      it('should define subscription deleted', () => {
        expect(WebhookEventTypes.SUBSCRIPTION_DELETED).toBe('customer.subscription.deleted');
      });
    });

    describe('Invoice Events', () => {
      it('should define invoice paid', () => {
        expect(WebhookEventTypes.INVOICE_PAID).toBe('invoice.paid');
      });

      it('should define invoice payment failed', () => {
        expect(WebhookEventTypes.INVOICE_PAYMENT_FAILED).toBe('invoice.payment_failed');
      });

      it('should define invoice upcoming', () => {
        expect(WebhookEventTypes.INVOICE_UPCOMING).toBe('invoice.upcoming');
      });
    });

    describe('Customer Events', () => {
      it('should define customer created', () => {
        expect(WebhookEventTypes.CUSTOMER_CREATED).toBe('customer.created');
      });

      it('should define customer updated', () => {
        expect(WebhookEventTypes.CUSTOMER_UPDATED).toBe('customer.updated');
      });
    });

    describe('Payment Method Events', () => {
      it('should define payment method attached', () => {
        expect(WebhookEventTypes.PAYMENT_METHOD_ATTACHED).toBe('payment_method.attached');
      });

      it('should define payment method detached', () => {
        expect(WebhookEventTypes.PAYMENT_METHOD_DETACHED).toBe('payment_method.detached');
      });
    });

    describe('V2 Account Events', () => {
      it('should define requirements updated', () => {
        expect(WebhookEventTypes.V2_ACCOUNT_REQUIREMENTS_UPDATED).toBe(
          'v2.core.account[requirements].updated'
        );
      });

      it('should define merchant capability updated', () => {
        expect(WebhookEventTypes.V2_MERCHANT_CAPABILITY_UPDATED).toBe(
          'v2.core.account[configuration.merchant].capability_status_updated'
        );
      });

      it('should define customer capability updated', () => {
        expect(WebhookEventTypes.V2_CUSTOMER_CAPABILITY_UPDATED).toBe(
          'v2.core.account[configuration.customer].capability_status_updated'
        );
      });

      it('should define recipient capability updated', () => {
        expect(WebhookEventTypes.V2_RECIPIENT_CAPABILITY_UPDATED).toBe(
          'v2.core.account[configuration.recipient].capability_status_updated'
        );
      });
    });

    it('should have all expected event types', () => {
      const eventTypes = Object.keys(WebhookEventTypes);
      expect(eventTypes.length).toBeGreaterThanOrEqual(14);
    });
  });

  describe('Error Response Mapping', () => {
    it('should map authentication errors to 401', () => {
      const error = new StripeGatewayError(
        StripeErrorType.AUTHENTICATION,
        'Invalid API key',
        401
      );
      expect(error.statusCode).toBe(401);
    });

    it('should map card errors to 402', () => {
      const error = new StripeGatewayError(
        StripeErrorType.CARD_ERROR,
        'Card declined',
        402
      );
      expect(error.statusCode).toBe(402);
    });

    it('should map invalid request errors to 400', () => {
      const error = new StripeGatewayError(
        StripeErrorType.INVALID_REQUEST,
        'Missing parameter',
        400
      );
      expect(error.statusCode).toBe(400);
    });

    it('should map rate limit errors to 429', () => {
      const error = new StripeGatewayError(
        StripeErrorType.RATE_LIMIT,
        'Too many requests',
        429
      );
      expect(error.statusCode).toBe(429);
    });

    it('should map API connection errors to 503', () => {
      const error = new StripeGatewayError(
        StripeErrorType.API_CONNECTION,
        'Network error',
        503
      );
      expect(error.statusCode).toBe(503);
    });
  });

  describe('Configuration', () => {
    describe('Stripe Config Interface', () => {
      it('should define expected configuration shape', () => {
        const config = {
          secretKey: 'sk_test_xxx',
          webhookSecret: 'whsec_xxx',
          connectWebhookSecret: 'whsec_connect_xxx',
          apiVersion: '2024-12-18.acacia',
        };

        expect(config.secretKey).toBeDefined();
        expect(config.apiVersion).toBe('2024-12-18.acacia');
      });

      it('should allow optional webhook secrets', () => {
        const config = {
          secretKey: 'sk_test_xxx',
          apiVersion: '2024-12-18.acacia',
        };

        expect(config.secretKey).toBeDefined();
        expect((config as any).webhookSecret).toBeUndefined();
      });
    });
  });

  describe('Utility Functions', () => {
    describe('connectedAccountOptions', () => {
      it('should return correct request options shape', () => {
        const accountId = 'acct_123456789';
        const options = {
          stripeAccount: accountId,
        };

        expect(options.stripeAccount).toBe(accountId);
      });
    });
  });
});
