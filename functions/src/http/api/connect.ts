/**
 * Stripe Connect API Endpoints
 *
 * Handles all Stripe Connect operations:
 * - Account creation and onboarding
 * - Product management
 * - Storefront and checkout
 * - Subscription management for connected accounts
 */

import { Request, Response } from 'express';
import { logger } from 'firebase-functions';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { connectService } from '../../services/connect.service.js';

/**
 * Create a new connected account
 * POST /api/connect/accounts
 */
export async function createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const { displayName, contactEmail, country } = req.body;

  if (!displayName || !contactEmail) {
    res.status(400).json({
      success: false,
      error: 'displayName and contactEmail are required',
    });
    return;
  }

  try {
    // Check if user already has a connected account
    const existingAccountId = await connectService.getAccountByUserId(userId);
    if (existingAccountId) {
      res.status(400).json({
        success: false,
        error: 'User already has a connected account',
        accountId: existingAccountId,
      });
      return;
    }

    const { accountId, account } = await connectService.createConnectedAccount(
      displayName,
      contactEmail,
      userId,
      country || 'us'
    );

    res.status(201).json({
      success: true,
      data: {
        accountId,
        displayName,
        contactEmail,
        country: country || 'us',
      },
    });
  } catch (error: any) {
    logger.error('Failed to create connected account', { userId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create connected account',
      message: error.message,
    });
  }
}

/**
 * Get account onboarding link
 * POST /api/connect/accounts/:accountId/onboarding
 */
export async function getOnboardingLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { accountId } = req.params;
  const { returnUrl, refreshUrl } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!accountId) {
    res.status(400).json({ success: false, error: 'accountId is required' });
    return;
  }

  // Default URLs if not provided
  const baseUrl = process.env.APP_URL || 'https://rapidtriage.me';
  const finalReturnUrl = returnUrl || `${baseUrl}/dashboard/connect`;
  const finalRefreshUrl = refreshUrl || `${baseUrl}/dashboard/connect/refresh`;

  try {
    const { url } = await connectService.createAccountLink(
      accountId,
      finalReturnUrl,
      finalRefreshUrl
    );

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error: any) {
    logger.error('Failed to get onboarding link', { accountId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create onboarding link',
      message: error.message,
    });
  }
}

/**
 * Get account status
 * GET /api/connect/accounts/:accountId/status
 */
export async function getAccountStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { accountId } = req.params;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!accountId) {
    res.status(400).json({ success: false, error: 'accountId is required' });
    return;
  }

  try {
    const status = await connectService.getAccountStatus(accountId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('Failed to get account status', { accountId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get account status',
      message: error.message,
    });
  }
}

/**
 * Get current user's connected account
 * GET /api/connect/my-account
 */
export async function getMyAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const accountId = await connectService.getAccountByUserId(userId);

    if (!accountId) {
      res.status(404).json({
        success: false,
        error: 'No connected account found',
      });
      return;
    }

    const status = await connectService.getAccountStatus(accountId);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('Failed to get my account', { userId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get account',
      message: error.message,
    });
  }
}

/**
 * Create a product on connected account
 * POST /api/connect/accounts/:accountId/products
 */
export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { accountId } = req.params;
  const { name, description, priceInCents, currency, imageUrl } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!accountId || !name || !priceInCents) {
    res.status(400).json({
      success: false,
      error: 'accountId, name, and priceInCents are required',
    });
    return;
  }

  try {
    const product = await connectService.createProduct(
      accountId,
      name,
      description || '',
      priceInCents,
      currency || 'usd',
      imageUrl
    );

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    logger.error('Failed to create product', { accountId, name, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message,
    });
  }
}

/**
 * List products for a connected account (storefront)
 * GET /api/connect/storefront/:accountId/products
 *
 * NOTE: In production, use a different identifier than accountId
 * (e.g., a slug or custom storefront ID) for public-facing URLs.
 */
export async function listProducts(req: Request, res: Response): Promise<void> {
  const { accountId } = req.params;
  const limit = parseInt(req.query.limit as string || '20', 10);

  if (!accountId) {
    res.status(400).json({ success: false, error: 'accountId is required' });
    return;
  }

  try {
    const products = await connectService.listProducts(accountId, limit);

    res.status(200).json({
      success: true,
      data: {
        products,
        accountId,
        // TODO: Replace accountId with a merchant name/slug in production
      },
    });
  } catch (error: any) {
    logger.error('Failed to list products', { accountId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list products',
      message: error.message,
    });
  }
}

/**
 * Create checkout session for a product purchase
 * POST /api/connect/storefront/:accountId/checkout
 */
export async function createCheckout(req: Request, res: Response): Promise<void> {
  const { accountId } = req.params;
  const { priceId, quantity, successUrl, cancelUrl } = req.body;

  if (!accountId || !priceId) {
    res.status(400).json({
      success: false,
      error: 'accountId and priceId are required',
    });
    return;
  }

  // Default URLs
  const baseUrl = process.env.APP_URL || 'https://rapidtriage.me';
  const finalSuccessUrl = successUrl || `${baseUrl}/checkout/success`;
  const finalCancelUrl = cancelUrl || `${baseUrl}/storefront/${accountId}`;

  try {
    const session = await connectService.createCheckoutSession(
      accountId,
      priceId,
      quantity || 1,
      finalSuccessUrl,
      finalCancelUrl
    );

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('Failed to create checkout', { accountId, priceId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

/**
 * Create subscription checkout for platform subscription
 * POST /api/connect/accounts/:accountId/subscribe
 */
export async function createSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { accountId } = req.params;
  const { priceId, successUrl, cancelUrl } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!accountId || !priceId) {
    res.status(400).json({
      success: false,
      error: 'accountId and priceId are required',
    });
    return;
  }

  const baseUrl = process.env.APP_URL || 'https://rapidtriage.me';
  const finalSuccessUrl = successUrl || `${baseUrl}/dashboard/subscription/success`;
  const finalCancelUrl = cancelUrl || `${baseUrl}/dashboard/connect`;

  try {
    const session = await connectService.createSubscriptionCheckout(
      accountId,
      priceId,
      finalSuccessUrl,
      finalCancelUrl
    );

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    logger.error('Failed to create subscription', { accountId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription checkout',
      message: error.message,
    });
  }
}

/**
 * Get billing portal URL
 * POST /api/connect/accounts/:accountId/billing-portal
 */
export async function getBillingPortal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { accountId } = req.params;
  const { returnUrl } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!accountId) {
    res.status(400).json({ success: false, error: 'accountId is required' });
    return;
  }

  const baseUrl = process.env.APP_URL || 'https://rapidtriage.me';
  const finalReturnUrl = returnUrl || `${baseUrl}/dashboard/connect`;

  try {
    const { url } = await connectService.createBillingPortalSession(accountId, finalReturnUrl);

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error: any) {
    logger.error('Failed to get billing portal', { accountId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create billing portal session',
      message: error.message,
    });
  }
}

export default {
  createAccount,
  getOnboardingLink,
  getAccountStatus,
  getMyAccount,
  createProduct,
  listProducts,
  createCheckout,
  createSubscription,
  getBillingPortal,
};
