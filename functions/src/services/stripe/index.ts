/**
 * Stripe Services Module
 *
 * Central export point for all Stripe-related services and utilities.
 *
 * Architecture:
 * - stripe-gateway.ts: Centralized Stripe client, webhook verification, error handling
 * - ../stripe.service.ts: Subscription management service
 * - ../connect.service.ts: Stripe Connect V2 service
 */

// Export gateway utilities
export {
  getStripeClient,
  resetStripeClient,
  verifyWebhookSignature,
  verifyConnectWebhookSignature,
  fetchV2Event,
  handleStripeError,
  executeStripeOperation,
  connectedAccountOptions,
  StripeGatewayError,
  StripeErrorType,
  WebhookEventTypes,
} from './stripe-gateway.js';

// Export types
export type {
  StripeConfig,
  StripeErrorResponse,
  WebhookEventType,
} from './stripe-gateway.js';
