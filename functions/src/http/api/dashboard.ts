/**
 * Dashboard API Endpoints
 * Provides dashboard stats and user data for the mobile/web app
 */

import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { PRICING_PLANS, SubscriptionTier, stripeService } from '../../services/stripe.service.js';

const db = admin.firestore();

// Plan scan limits
const PLAN_LIMITS: Record<string, number | null> = {
  free: 10,
  user: 100,
  team: 500,
  enterprise: null, // unlimited
};

/**
 * Dashboard Stats Response Interface
 */
interface DashboardStatsResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      displayName: string | null;
    };
    subscription: {
      tier: string;
      status: string;
      scansUsed: number;
      scansLimit: number | null;
      scansRemaining: number | null;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
    };
    recentAudits: Array<{
      id: string;
      url: string;
      status: 'pending' | 'completed' | 'failed';
      scores: {
        performance: number | null;
        accessibility: number | null;
        seo: number | null;
        bestPractices: number | null;
      } | null;
      createdAt: string;
      completedAt: string | null;
    }>;
    usageHistory: {
      thisMonth: number;
      lastMonth: number;
      trend: 'up' | 'down' | 'stable';
    };
    planInfo: typeof PRICING_PLANS[0];
  };
}

/**
 * Get dashboard stats for authenticated user
 */
export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const email = req.user?.email;

  if (!userId || !email) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    logger.info('Fetching dashboard stats', { userId });

    // Get user document
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // Get subscription document
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const subData = subDoc.exists ? subDoc.data() : null;

    // Determine tier
    const tier = subData?.tier || userData?.subscriptionTier || SubscriptionTier.FREE;
    const scansLimit = PLAN_LIMITS[tier] ?? 10;

    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get usage document for this month
    const usageDocId = `${userId}_${now.getFullYear()}_${now.getMonth() + 1}`;
    const usageDoc = await db.collection('usage').doc(usageDocId).get();
    const scansUsed = usageDoc.exists ? (usageDoc.data()?.scansCount || 0) : 0;

    // Get last month's usage
    const lastMonthUsageDocId = `${userId}_${startOfLastMonth.getFullYear()}_${startOfLastMonth.getMonth() + 1}`;
    const lastMonthUsageDoc = await db.collection('usage').doc(lastMonthUsageDocId).get();
    const lastMonthScans = lastMonthUsageDoc.exists ? (lastMonthUsageDoc.data()?.scansCount || 0) : 0;

    // Get recent audits/sessions
    const auditsQuery = await db
      .collection('sessions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentAudits = auditsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        url: data.url || data.origin || 'Unknown',
        status: data.status || (data.endedAt ? 'completed' : 'pending'),
        scores: data.scores || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        completedAt: data.endedAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (scansUsed > lastMonthScans * 1.1) trend = 'up';
    else if (scansUsed < lastMonthScans * 0.9) trend = 'down';

    // Get plan info
    const planInfo = PRICING_PLANS.find(p => p.tier === tier) || PRICING_PLANS[0];

    const response: DashboardStatsResponse = {
      success: true,
      data: {
        user: {
          id: userId,
          email: email,
          displayName: userData?.displayName || null,
        },
        subscription: {
          tier,
          status: subData?.status || 'active',
          scansUsed,
          scansLimit,
          scansRemaining: scansLimit === null ? null : Math.max(scansLimit - scansUsed, 0),
          currentPeriodStart: subData?.currentPeriodStart?.toDate?.()?.toISOString() || null,
          currentPeriodEnd: subData?.currentPeriodEnd?.toDate?.()?.toISOString() || null,
          cancelAtPeriodEnd: subData?.cancelAtPeriodEnd || false,
        },
        recentAudits,
        usageHistory: {
          thisMonth: scansUsed,
          lastMonth: lastMonthScans,
          trend,
        },
        planInfo,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    logger.error('Failed to fetch dashboard stats', {
      userId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error.message,
    });
  }
}

/**
 * Check if user can perform a scan (usage limit check)
 */
export async function checkScanAllowed(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    // Get subscription
    const subDoc = await db.collection('subscriptions').doc(userId).get();
    const subData = subDoc.data();
    const tier = subData?.tier || SubscriptionTier.FREE;
    const scansLimit = PLAN_LIMITS[tier];

    // Unlimited plan
    if (scansLimit === null) {
      res.status(200).json({
        success: true,
        allowed: true,
        scansUsed: 0,
        scansLimit: null,
        scansRemaining: null,
      });
      return;
    }

    // Get current month's usage
    const now = new Date();
    const usageDocId = `${userId}_${now.getFullYear()}_${now.getMonth() + 1}`;
    const usageDoc = await db.collection('usage').doc(usageDocId).get();
    const scansUsed = usageDoc.exists ? (usageDoc.data()?.scansCount || 0) : 0;

    const allowed = scansUsed < scansLimit;
    const scansRemaining = Math.max(scansLimit - scansUsed, 0);

    res.status(200).json({
      success: true,
      allowed,
      scansUsed,
      scansLimit,
      scansRemaining,
      tier,
      ...(allowed ? {} : {
        upgradeUrl: 'https://rapidtriage.me/pricing',
        message: 'You have reached your monthly scan limit. Upgrade to continue.',
      }),
    });
  } catch (error: any) {
    logger.error('Failed to check scan allowance', {
      userId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to check scan allowance',
    });
  }
}

/**
 * Increment usage counter after a scan
 */
export async function incrementUsage(userId: string): Promise<{ success: boolean; newCount: number }> {
  const now = new Date();
  const usageDocId = `${userId}_${now.getFullYear()}_${now.getMonth() + 1}`;

  try {
    const usageRef = db.collection('usage').doc(usageDocId);
    
    await db.runTransaction(async (transaction) => {
      const usageDoc = await transaction.get(usageRef);
      
      if (usageDoc.exists) {
        transaction.update(usageRef, {
          scansCount: admin.firestore.FieldValue.increment(1),
          lastScanAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        transaction.set(usageRef, {
          userId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          scansCount: 1,
          lastScanAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    const updatedDoc = await usageRef.get();
    const newCount = updatedDoc.data()?.scansCount || 1;

    logger.info('Incremented usage', { userId, newCount });
    return { success: true, newCount };
  } catch (error: any) {
    logger.error('Failed to increment usage', { userId, error: error.message });
    return { success: false, newCount: 0 };
  }
}

/**
 * Get billing history for authenticated user
 */
export async function getBillingHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const limit = parseInt(req.query.limit as string || '10', 10);
    const history = await stripeService.getBillingHistory(userId, Math.min(limit, 50));

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    logger.error('Failed to fetch billing history', {
      userId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing history',
    });
  }
}

/**
 * Get upcoming invoice for authenticated user
 */
export async function getUpcomingInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  try {
    const upcomingInvoice = await stripeService.getUpcomingInvoice(userId);

    res.status(200).json({
      success: true,
      data: upcomingInvoice,
    });
  } catch (error: any) {
    logger.error('Failed to fetch upcoming invoice', {
      userId,
      error: error.message,
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming invoice',
    });
  }
}

export default {
  getDashboardStats,
  checkScanAllowed,
  incrementUsage,
  getBillingHistory,
  getUpcomingInvoice,
};
