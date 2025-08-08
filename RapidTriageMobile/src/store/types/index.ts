/**
 * TypeScript type definitions for the application store
 * Defines the shape of our application state
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  subscription: SubscriptionInfo;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInfo {
  tierId: 'free' | 'pro' | 'team' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trial?: {
    isTrialing: boolean;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    hasExtended: boolean;
    extensionOffered: boolean;
    originalTier?: string;
  };
  usage: {
    scansUsed: number;
    scansLimit: number;
  };
}

export interface TriageReport {
  id: string;
  url: string;
  status: 'pending' | 'completed' | 'failed';
  results?: {
    performance: PerformanceMetrics;
    accessibility: AccessibilityResults;
    seo: SEOResults;
    bestPractices: BestPracticesResults;
  };
  createdAt: string;
  completedAt?: string;
}

export interface PerformanceMetrics {
  score: number; // 0-100
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
    speedIndex: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    savings: number;
  }>;
}

export interface AccessibilityResults {
  score: number; // 0-100
  violations: Array<{
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    help: string;
    helpUrl: string;
    nodes: number;
  }>;
}

export interface SEOResults {
  score: number; // 0-100
  audits: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    displayValue?: string;
  }>;
}

export interface BestPracticesResults {
  score: number; // 0-100
  audits: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
  }>;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    reportComplete: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
  };
}

// Store interfaces
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TriageState {
  reports: TriageReport[];
  currentScan: TriageReport | null;
  isScanning: boolean;
  error: string | null;
}

export interface AppState {
  settings: AppSettings;
  isOnboardingComplete: boolean;
  networkStatus: 'connected' | 'disconnected' | 'unknown';
}

export interface ReferralProgram {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedRewards: Array<{
    id: string;
    type: 'free_month' | 'discount';
    value: number;
    earnedAt: string;
    referredUserId: string;
    status: 'pending' | 'applied' | 'expired';
  }>;
  referredBy?: {
    code: string;
    userId: string;
    discountApplied: boolean;
  };
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  skippedSteps: string[];
  personalizations: {
    industry?: string;
    teamSize?: string;
    primaryGoals?: string[];
    experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  };
  tutorialProgress: {
    completedTutorials: string[];
    currentTutorial?: string;
  };
}

export interface GrowthFeatures {
  referral: ReferralProgram;
  onboarding: OnboardingState;
  emailMarketing: {
    isSubscribed: boolean;
    preferences: {
      weeklyTips: boolean;
      productUpdates: boolean;
      promotions: boolean;
    };
    campaigns: Array<{
      id: string;
      type: string;
      status: 'sent' | 'opened' | 'clicked' | 'converted';
      sentAt: string;
    }>;
  };
  upgradePrompts: {
    dismissedPrompts: string[];
    lastPromptShown?: string;
    conversionAttempts: number;
    testVariant?: string;
  };
}

export interface RootState {
  auth: AuthState;
  triage: TriageState;
  app: AppState;
  growth: GrowthFeatures;
}