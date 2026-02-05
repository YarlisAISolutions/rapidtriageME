/**
 * Stripe Gateway - Centralized Stripe API Integration
 *
 * This module serves as the single point of entry for all Stripe API interactions.
 * It provides:
 * - Singleton Stripe client initialization
 * - Centralized webhook signature verification
 * - Standardized error handling
 * - Type-safe configuration
 *
 * All other services should use this gateway instead of directly instantiating Stripe.
 */

import Stripe from 'stripe';
import { logger } from 'firebase-functions';

/**
 * Stripe configuration interface
 */
export interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
  connectWebhookSecret?: string;
  apiVersion: string;
}

/**
 * Stripe error types for standardized error handling
 */
export enum StripeErrorType {
  AUTHENTICATION = 'authentication_error',
  CARD_ERROR = 'card_error',
  INVALID_REQUEST = 'invalid_request_error',
  RATE_LIMIT = 'rate_limit_error',
  API_CONNECTION = 'api_connection_error',
  API_ERROR = 'api_error',
  WEBHOOK_SIGNATURE = 'webhook_signature_error',
  CONFIGURATION = 'configuration_error',
}

/**
 * Standardized Stripe error response
 */
export interface StripeErrorResponse {
  type: StripeErrorType;
  message: string;
  code?: string;
  param?: string;
  statusCode: number;
}

/**
 * Webhook event types for type safety
 */
export const WebhookEventTypes = {
  // Checkout events
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  CHECKOUT_SESSION_EXPIRED: 'checkout.session.expired',

  // Subscription events
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',

  // Invoice events
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_UPCOMING: 'invoice.upcoming',

  // Customer events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',

  // Payment method events
  PAYMENT_METHOD_ATTACHED: 'payment_method.attached',
  PAYMENT_METHOD_DETACHED: 'payment_method.detached',

  // V2 Account events (Connect)
  V2_ACCOUNT_REQUIREMENTS_UPDATED: 'v2.core.account[requirements].updated',
  V2_MERCHANT_CAPABILITY_UPDATED: 'v2.core.account[configuration.merchant].capability_status_updated',
  V2_CUSTOMER_CAPABILITY_UPDATED: 'v2.core.account[configuration.customer].capability_status_updated',
  V2_RECIPIENT_CAPABILITY_UPDATED: 'v2.core.account[configuration.recipient].capability_status_updated',
} as const;

export type WebhookEventType = (typeof WebhookEventTypes)[keyof typeof WebhookEventTypes];

/**
 * Singleton Stripe client instance
 */
let stripeClientInstance: Stripe | null = null;

/**
 * Get the Stripe configuration from environment variables
 */
function getConfig(): StripeConfig {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable not set. ' +
        'Run: firebase functions:secrets:set STRIPE_SECRET_KEY'
    );
  }

  return {
    secretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    connectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    apiVersion: '2024-12-18.acacia',
  };
}

/**
 * Get or create the Stripe client singleton
 *
 * This is the primary method for obtaining a Stripe client instance.
 * It ensures only one client is created per function invocation.
 */
export function getStripeClient(): Stripe {
  if (!stripeClientInstance) {
    const config = getConfig();
    stripeClientInstance = new Stripe(config.secretKey);
    logger.debug('Stripe client initialized');
  }
  return stripeClientInstance;
}

/**
 * Reset the Stripe client (for testing purposes)
 */
export function resetStripeClient(): void {
  stripeClientInstance = null;
}

/**
 * Verify a standard webhook signature and parse the event
 *
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @param webhookSecret - Optional override for webhook secret
 * @returns Parsed Stripe event
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret?: string
): Stripe.Event {
  const stripe = getStripeClient();
  const config = getConfig();

  const secret = webhookSecret || config.webhookSecret;
  if (!secret) {
    throw new StripeGatewayError(
      StripeErrorType.CONFIGURATION,
      'STRIPE_WEBHOOK_SECRET environment variable not set',
      500
    );
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed', { error: err.message });
    throw new StripeGatewayError(
      StripeErrorType.WEBHOOK_SIGNATURE,
      `Webhook signature verification failed: ${err.message}`,
      400
    );
  }
}

/**
 * Verify a V2 thin event webhook signature
 *
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @param webhookSecret - Optional override for webhook secret
 * @returns Parsed thin event
 */
export function verifyConnectWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret?: string
): any {
  const stripe = getStripeClient();
  const config = getConfig();

  const secret = webhookSecret || config.connectWebhookSecret;
  if (!secret) {
    throw new StripeGatewayError(
      StripeErrorType.CONFIGURATION,
      'STRIPE_CONNECT_WEBHOOK_SECRET environment variable not set',
      500
    );
  }

  try {
    // Parse thin event for V2 webhooks
    return (stripe as any).parseThinEvent(payload, signature, secret);
  } catch (err: any) {
    logger.error('Connect webhook signature verification failed', { error: err.message });
    throw new StripeGatewayError(
      StripeErrorType.WEBHOOK_SIGNATURE,
      `Webhook signature verification failed: ${err.message}`,
      400
    );
  }
}

/**
 * Fetch a V2 event by ID
 *
 * @param eventId - The event ID to retrieve
 * @returns Full V2 event
 */
export async function fetchV2Event(eventId: string): Promise<any> {
  const stripe = getStripeClient();
  return (stripe as any).v2.core.events.retrieve(eventId);
}

/**
 * Custom error class for Stripe gateway errors
 */
export class StripeGatewayError extends Error {
  public type: StripeErrorType;
  public statusCode: number;
  public code?: string;
  public param?: string;

  constructor(
    type: StripeErrorType,
    message: string,
    statusCode: number,
    code?: string,
    param?: string
  ) {
    super(message);
    this.name = 'StripeGatewayError';
    this.type = type;
    this.statusCode = statusCode;
    this.code = code;
    this.param = param;
  }

  toResponse(): StripeErrorResponse {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      param: this.param,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Handle Stripe API errors and convert to standardized format
 *
 * @param error - The error to handle
 * @returns Standardized error response
 */
export function handleStripeError(error: any): StripeErrorResponse {
  if (error instanceof StripeGatewayError) {
    return error.toResponse();
  }

  // Handle Stripe-specific errors
  if (error.type) {
    const errorMap: Record<string, { type: StripeErrorType; statusCode: number }> = {
      authentication_error: {
        type: StripeErrorType.AUTHENTICATION,
        statusCode: 401,
      },
      card_error: {
        type: StripeErrorType.CARD_ERROR,
        statusCode: 402,
      },
      invalid_request_error: {
        type: StripeErrorType.INVALID_REQUEST,
        statusCode: 400,
      },
      rate_limit_error: {
        type: StripeErrorType.RATE_LIMIT,
        statusCode: 429,
      },
      api_connection_error: {
        type: StripeErrorType.API_CONNECTION,
        statusCode: 503,
      },
      api_error: {
        type: StripeErrorType.API_ERROR,
        statusCode: 500,
      },
    };

    const mapped = errorMap[error.type] || {
      type: StripeErrorType.API_ERROR,
      statusCode: 500,
    };

    return {
      type: mapped.type,
      message: error.message || 'An error occurred',
      code: error.code,
      param: error.param,
      statusCode: mapped.statusCode,
    };
  }

  // Generic error
  return {
    type: StripeErrorType.API_ERROR,
    message: error.message || 'An unexpected error occurred',
    statusCode: 500,
  };
}

/**
 * Execute a Stripe API call with standardized error handling
 *
 * @param operation - The Stripe API operation to execute
 * @param context - Optional context for logging
 * @returns The result of the operation
 */
export async function executeStripeOperation<T>(
  operation: () => Promise<T>,
  context?: { operation: string; metadata?: Record<string, any> }
): Promise<T> {
  try {
    const result = await operation();
    if (context) {
      logger.debug(`Stripe operation succeeded: ${context.operation}`, context.metadata);
    }
    return result;
  } catch (error: any) {
    const errorResponse = handleStripeError(error);
    logger.error(`Stripe operation failed: ${context?.operation || 'unknown'}`, {
      ...context?.metadata,
      error: errorResponse,
    });
    throw new StripeGatewayError(
      errorResponse.type,
      errorResponse.message,
      errorResponse.statusCode,
      errorResponse.code,
      errorResponse.param
    );
  }
}

/**
 * Create request options for connected account operations
 *
 * @param accountId - The connected account ID
 * @returns Stripe request options
 */
export function connectedAccountOptions(accountId: string): Stripe.RequestOptions {
  return {
    stripeAccount: accountId,
  };
}

// Export default instance getter for convenience
export default {
  getClient: getStripeClient,
  verifyWebhook: verifyWebhookSignature,
  verifyConnectWebhook: verifyConnectWebhookSignature,
  handleError: handleStripeError,
  execute: executeStripeOperation,
  connectedAccountOptions,
  WebhookEventTypes,
};
