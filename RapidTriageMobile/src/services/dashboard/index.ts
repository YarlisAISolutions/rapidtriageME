/**
 * Dashboard Service
 * Handles API calls for dashboard stats, usage tracking, and subscription management
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Types
export interface DashboardStats {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  subscription: {
    tier: 'free' | 'user' | 'team' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
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
  planInfo: PricingPlan;
}

export interface PricingPlan {
  id: string;
  tier: 'free' | 'user' | 'team' | 'enterprise';
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  monthlyScans: number | null;
  maxUsers: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface ScanAllowedResponse {
  allowed: boolean;
  scansUsed: number;
  scansLimit: number | null;
  scansRemaining: number | null;
  tier: string;
  upgradeUrl?: string;
  message?: string;
}

export interface SubscriptionResponse {
  subscription: {
    userId: string;
    tier: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  tier: string;
  pricingPlans: PricingPlan[];
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

// API Base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://us-central1-rapidtriageme.cloudfunctions.net';

/**
 * Get auth token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data.data;
}

/**
 * Dashboard Service
 */
export const dashboardService = {
  /**
   * Get dashboard stats for current user
   */
  async getStats(): Promise<DashboardStats> {
    return apiRequest<DashboardStats>('/dashboard/stats');
  },

  /**
   * Check if user can perform a scan
   */
  async checkScanAllowed(): Promise<ScanAllowedResponse> {
    return apiRequest<ScanAllowedResponse>('/dashboard/check-scan');
  },

  /**
   * Get current subscription and available plans
   */
  async getSubscription(): Promise<SubscriptionResponse> {
    const functions = getFunctions();
    const getSubscriptionFn = httpsCallable<void, SubscriptionResponse>(functions, 'getSubscription');
    const result = await getSubscriptionFn();
    return result.data;
  },

  /**
   * Create Stripe checkout session for upgrade
   */
  async createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> {
    const functions = getFunctions();
    const createCheckoutFn = httpsCallable<
      { priceId: string; successUrl: string; cancelUrl: string },
      CheckoutSession
    >(functions, 'createCheckoutSession');
    
    const result = await createCheckoutFn({ priceId, successUrl, cancelUrl });
    return result.data;
  },

  /**
   * Create Stripe customer portal session
   */
  async createPortalSession(returnUrl: string): Promise<PortalSession> {
    const functions = getFunctions();
    const createPortalFn = httpsCallable<
      { returnUrl: string },
      PortalSession
    >(functions, 'createPortalSession');
    
    const result = await createPortalFn({ returnUrl });
    return result.data;
  },

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(): Promise<void> {
    const functions = getFunctions();
    const cancelFn = httpsCallable(functions, 'cancelSubscription');
    await cancelFn();
  },

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(): Promise<void> {
    const functions = getFunctions();
    const reactivateFn = httpsCallable(functions, 'reactivateSubscription');
    await reactivateFn();
  },
};

export default dashboardService;
