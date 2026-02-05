/**
 * Token Usage API Endpoints
 *
 * Manages token-based usage tracking:
 * - Get token balance
 * - Check operation allowance
 * - Get usage history
 */

import { Response } from 'express';
import { logger } from 'firebase-functions';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { tokenService, TOKEN_COSTS, TOKEN_LIMITS, TokenOperation } from '../../services/token.service.js';

/**
 * Get current token balance
 * GET /api/tokens/balance
 */
export async function getTokenBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const balance = await tokenService.getTokenBalance(userId);

    res.status(200).json({
      success: true,
      data: {
        ...balance,
        // Include token costs for reference
        tokenCosts: TOKEN_COSTS,
        tierLimits: TOKEN_LIMITS,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get token balance', { userId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get token balance',
    });
  }
}

/**
 * Check if an operation is allowed (token check)
 * GET /api/tokens/check/:operation
 */
export async function checkOperation(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { operation } = req.params;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!operation || !(operation in TOKEN_COSTS)) {
    res.status(400).json({
      success: false,
      error: 'Invalid operation',
      validOperations: Object.keys(TOKEN_COSTS),
    });
    return;
  }

  try {
    const result = await tokenService.canPerformOperation(userId, operation as TokenOperation);

    res.status(200).json({
      success: true,
      data: {
        operation,
        ...result,
      },
    });
  } catch (error: any) {
    logger.error('Failed to check operation', { userId, operation, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to check operation allowance',
    });
  }
}

/**
 * Consume tokens for an operation
 * POST /api/tokens/consume
 *
 * This is typically called internally after an operation completes,
 * but exposed for flexibility.
 */
export async function consumeTokens(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { operation, multiplier } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!operation || !(operation in TOKEN_COSTS)) {
    res.status(400).json({
      success: false,
      error: 'Invalid operation',
      validOperations: Object.keys(TOKEN_COSTS),
    });
    return;
  }

  try {
    const result = await tokenService.consumeTokens(
      userId,
      operation as TokenOperation,
      multiplier || 1
    );

    if (!result.success) {
      res.status(403).json({
        success: false,
        error: result.message || 'Token limit exceeded',
        data: result,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to consume tokens', { userId, operation, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to consume tokens',
    });
  }
}

/**
 * Get token usage history
 * GET /api/tokens/history
 */
export async function getUsageHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const months = parseInt(req.query.months as string || '6', 10);

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const history = await tokenService.getUsageHistory(userId, Math.min(months, 12));

    res.status(200).json({
      success: true,
      data: {
        history,
        tokenCosts: TOKEN_COSTS,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get usage history', { userId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get usage history',
    });
  }
}

/**
 * Get token pricing info (public endpoint)
 * GET /api/tokens/pricing
 */
export async function getTokenPricing(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: {
      tokenCosts: TOKEN_COSTS,
      tierLimits: TOKEN_LIMITS,
      description: {
        free: '1,000 tokens/month - Perfect for trying out RapidTriage',
        user: '8,000 tokens/month - For individual developers',
        team: '25,000 tokens/month - For development teams',
        enterprise: 'Unlimited tokens - For large organizations',
      },
    },
  });
}

export default {
  getTokenBalance,
  checkOperation,
  consumeTokens,
  getUsageHistory,
  getTokenPricing,
};
