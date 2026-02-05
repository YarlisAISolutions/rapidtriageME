/**
 * Token Usage Service for RapidTriageME
 *
 * Manages token-based usage tracking for the platform.
 * - Free tier: 1000 tokens/month
 * - Paid subscriptions: 8000 tokens/month
 *
 * Tokens are consumed by various operations:
 * - Screenshot capture: 10 tokens
 * - Lighthouse audit: 50 tokens
 * - Console log capture: 1 token
 * - Network log capture: 1 token
 * - Full triage report: 100 tokens
 */

import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { SubscriptionTier } from './stripe.service.js';

const db = admin.firestore();

/**
 * Token allocation per subscription tier
 */
export const TOKEN_LIMITS: Record<string, number> = {
  free: 1000,        // Free tier: 1000 tokens/month
  user: 8000,        // User plan: 8000 tokens/month
  team: 25000,       // Team plan: 25000 tokens/month
  enterprise: -1,    // Enterprise: unlimited (-1)
};

/**
 * Token costs for different operations
 */
export const TOKEN_COSTS = {
  screenshot: 10,
  lighthouseAudit: 50,
  consoleLog: 1,
  networkLog: 1,
  triageReport: 100,
  accessibilityAudit: 30,
  performanceAudit: 30,
  seoAudit: 30,
  bestPracticesAudit: 30,
  elementInspection: 5,
  jsExecution: 20,
} as const;

export type TokenOperation = keyof typeof TOKEN_COSTS;

/**
 * Token usage record stored in Firestore
 */
export interface TokenUsageRecord {
  userId: string;
  year: number;
  month: number;
  tokensUsed: number;
  tokensLimit: number;
  tier: string;
  operations: Record<string, number>; // Count per operation type
  lastUsedAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Token balance response
 */
export interface TokenBalance {
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
  isUnlimited: boolean;
  tier: string;
  periodStart: string;
  periodEnd: string;
  operations: Record<string, number>;
}

/**
 * Token Service Class
 */
class TokenService {
  /**
   * Get the current month's usage document ID
   */
  private getUsageDocId(userId: string, date: Date = new Date()): string {
    return `${userId}_${date.getFullYear()}_${date.getMonth() + 1}`;
  }

  /**
   * Get token limit for a tier
   */
  getTokenLimit(tier: string): number {
    return TOKEN_LIMITS[tier] ?? TOKEN_LIMITS.free;
  }

  /**
   * Get user's current token balance
   */
  async getTokenBalance(userId: string): Promise<TokenBalance> {
    const now = new Date();
    const usageDocId = this.getUsageDocId(userId, now);

    // Get subscription tier
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const tier = subDoc.exists ? (subDoc.data()?.tier || SubscriptionTier.FREE) : SubscriptionTier.FREE;

    // Get current usage
    const usageDoc = await db.collection('token_usage').doc(usageDocId).get();
    const usageData = usageDoc.exists ? usageDoc.data() as TokenUsageRecord : null;

    const tokensLimit = this.getTokenLimit(tier);
    const tokensUsed = usageData?.tokensUsed || 0;
    const isUnlimited = tokensLimit === -1;

    // Calculate period dates
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return {
      tokensUsed,
      tokensLimit: isUnlimited ? -1 : tokensLimit,
      tokensRemaining: isUnlimited ? -1 : Math.max(tokensLimit - tokensUsed, 0),
      isUnlimited,
      tier,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      operations: usageData?.operations || {},
    };
  }

  /**
   * Check if user has enough tokens for an operation
   */
  async canPerformOperation(userId: string, operation: TokenOperation): Promise<{
    allowed: boolean;
    tokensRequired: number;
    tokensRemaining: number;
    message?: string;
  }> {
    const balance = await this.getTokenBalance(userId);
    const tokensRequired = TOKEN_COSTS[operation];

    // Unlimited tier always allowed
    if (balance.isUnlimited) {
      return {
        allowed: true,
        tokensRequired,
        tokensRemaining: -1,
      };
    }

    const allowed = balance.tokensRemaining >= tokensRequired;

    return {
      allowed,
      tokensRequired,
      tokensRemaining: balance.tokensRemaining,
      message: allowed
        ? undefined
        : `Insufficient tokens. Required: ${tokensRequired}, Available: ${balance.tokensRemaining}. Upgrade your plan for more tokens.`,
    };
  }

  /**
   * Consume tokens for an operation
   */
  async consumeTokens(
    userId: string,
    operation: TokenOperation,
    multiplier: number = 1
  ): Promise<{
    success: boolean;
    tokensConsumed: number;
    newBalance: number;
    message?: string;
  }> {
    const now = new Date();
    const usageDocId = this.getUsageDocId(userId, now);
    const tokensToConsume = TOKEN_COSTS[operation] * multiplier;

    // Get tier first to check limits
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const tier = subDoc.exists ? (subDoc.data()?.tier || SubscriptionTier.FREE) : SubscriptionTier.FREE;
    const tokensLimit = this.getTokenLimit(tier);
    const isUnlimited = tokensLimit === -1;

    const usageRef = db.collection('token_usage').doc(usageDocId);

    try {
      const result = await db.runTransaction(async (transaction) => {
        const usageDoc = await transaction.get(usageRef);
        const currentUsage = usageDoc.exists ? (usageDoc.data()?.tokensUsed || 0) : 0;
        const currentOperations = usageDoc.exists ? (usageDoc.data()?.operations || {}) : {};

        // Check if allowed (unless unlimited)
        if (!isUnlimited && currentUsage + tokensToConsume > tokensLimit) {
          return {
            success: false,
            tokensConsumed: 0,
            newBalance: Math.max(tokensLimit - currentUsage, 0),
            message: 'Token limit exceeded. Upgrade your plan for more tokens.',
          };
        }

        const newUsage = currentUsage + tokensToConsume;
        const updatedOperations = {
          ...currentOperations,
          [operation]: (currentOperations[operation] || 0) + multiplier,
        };

        if (usageDoc.exists) {
          transaction.update(usageRef, {
            tokensUsed: newUsage,
            operations: updatedOperations,
            lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          transaction.set(usageRef, {
            userId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            tokensUsed: newUsage,
            tokensLimit,
            tier,
            operations: updatedOperations,
            lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        return {
          success: true,
          tokensConsumed: tokensToConsume,
          newBalance: isUnlimited ? -1 : Math.max(tokensLimit - newUsage, 0),
        };
      });

      logger.info('Tokens consumed', {
        userId,
        operation,
        tokensConsumed: result.tokensConsumed,
        newBalance: result.newBalance,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to consume tokens', { userId, operation, error: error.message });
      return {
        success: false,
        tokensConsumed: 0,
        newBalance: 0,
        message: 'Failed to process token consumption',
      };
    }
  }

  /**
   * Get token usage history for a user
   */
  async getUsageHistory(userId: string, months: number = 6): Promise<Array<{
    period: string;
    tokensUsed: number;
    tokensLimit: number;
    operations: Record<string, number>;
  }>> {
    const history: Array<{
      period: string;
      tokensUsed: number;
      tokensLimit: number;
      operations: Record<string, number>;
    }> = [];

    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const usageDocId = this.getUsageDocId(userId, date);
      const usageDoc = await db.collection('token_usage').doc(usageDocId).get();

      if (usageDoc.exists) {
        const data = usageDoc.data() as TokenUsageRecord;
        history.push({
          period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          tokensUsed: data.tokensUsed,
          tokensLimit: data.tokensLimit,
          operations: data.operations,
        });
      } else {
        history.push({
          period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          tokensUsed: 0,
          tokensLimit: TOKEN_LIMITS.free,
          operations: {},
        });
      }
    }

    return history;
  }

  /**
   * Reset token usage (for testing or admin purposes)
   */
  async resetUsage(userId: string): Promise<boolean> {
    const now = new Date();
    const usageDocId = this.getUsageDocId(userId, now);

    try {
      await db.collection('token_usage').doc(usageDocId).delete();
      logger.info('Token usage reset', { userId });
      return true;
    } catch (error) {
      logger.error('Failed to reset token usage', { userId, error });
      return false;
    }
  }

  /**
   * Update token limits when subscription changes
   */
  async updateLimitsForTier(userId: string, tier: string): Promise<void> {
    const now = new Date();
    const usageDocId = this.getUsageDocId(userId, now);
    const newLimit = this.getTokenLimit(tier);

    try {
      await db.collection('token_usage').doc(usageDocId).set({
        tokensLimit: newLimit,
        tier,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      logger.info('Token limits updated', { userId, tier, newLimit });
    } catch (error) {
      logger.error('Failed to update token limits', { userId, tier, error });
    }
  }
}

// Export singleton instance
export const tokenService = new TokenService();
export default tokenService;
