import { analyticsService, AnalyticsEventCategory, ConversionFunnelStage } from '../analytics/analytics.service';
import { SubscriptionTier } from '../payment/payment.service';

/**
 * Growth-specific analytics events
 */
export enum GrowthAnalyticsEvents {
  // Trial Events
  TRIAL_STARTED = 'trial_started',
  TRIAL_EXTENDED = 'trial_extended',
  TRIAL_EXPIRED = 'trial_expired',
  TRIAL_CONVERTED = 'trial_converted',
  TRIAL_CANCELLED = 'trial_cancelled',
  
  // Referral Events
  REFERRAL_CODE_GENERATED = 'referral_code_generated',
  REFERRAL_SHARED = 'referral_shared',
  REFERRAL_CLICKED = 'referral_clicked',
  REFERRAL_SIGNUP = 'referral_signup',
  REFERRAL_CONVERTED = 'referral_converted',
  REFERRAL_REWARD_EARNED = 'referral_reward_earned',
  
  // Onboarding Events
  ONBOARDING_STARTED = 'onboarding_started',
  ONBOARDING_STEP_COMPLETED = 'onboarding_step_completed',
  ONBOARDING_STEP_SKIPPED = 'onboarding_step_skipped',
  ONBOARDING_COMPLETED = 'onboarding_completed',
  ONBOARDING_ABANDONED = 'onboarding_abandoned',
  
  // Upgrade Prompt Events
  UPGRADE_PROMPT_SHOWN = 'upgrade_prompt_shown',
  UPGRADE_PROMPT_CLICKED = 'upgrade_prompt_clicked',
  UPGRADE_PROMPT_DISMISSED = 'upgrade_prompt_dismissed',
  UPGRADE_PROMPT_CONVERTED = 'upgrade_prompt_converted',
  
  // Email Marketing Events
  EMAIL_CAPTURED = 'email_captured',
  EMAIL_CAMPAIGN_SENT = 'email_campaign_sent',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  EMAIL_UNSUBSCRIBED = 'email_unsubscribed',
  EMAIL_CONVERTED = 'email_converted',
  
  // Growth Feature Events
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  NPS_SURVEY_SHOWN = 'nps_survey_shown',
  NPS_SURVEY_COMPLETED = 'nps_survey_completed',
  PUSH_NOTIFICATION_SENT = 'push_notification_sent',
  PUSH_NOTIFICATION_OPENED = 'push_notification_opened',
  IN_APP_MESSAGE_SHOWN = 'in_app_message_shown',
  IN_APP_MESSAGE_CLICKED = 'in_app_message_clicked',
  
  // User Lifecycle Events
  USER_ACTIVATION = 'user_activation',
  USER_RETENTION_CHECK = 'user_retention_check',
  USER_CHURN_RISK = 'user_churn_risk',
  USER_WIN_BACK = 'user_win_back'
}

/**
 * Growth metrics calculation interface
 */
export interface GrowthMetrics {
  // Acquisition Metrics
  acquisition: {
    signups: number;
    signupRate: number;
    sourceBreakdown: Record<string, number>;
    organicSignups: number;
    referralSignups: number;
    paidSignups: number;
  };
  
  // Activation Metrics
  activation: {
    activatedUsers: number;
    activationRate: number;
    timeToActivation: number; // average days
    onboardingCompletionRate: number;
    firstScanCompletionRate: number;
  };
  
  // Retention Metrics
  retention: {
    day1: number;
    day7: number;
    day30: number;
    cohortRetention: Array<{
      cohort: string;
      day1: number;
      day7: number;
      day30: number;
    }>;
  };
  
  // Revenue Metrics
  revenue: {
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    lifetimeValue: number;
    churnRate: number;
    conversionRate: number;
    upgradeRate: number;
  };
  
  // Referral Metrics
  referral: {
    totalReferrals: number;
    referralConversionRate: number;
    referralRevenue: number;
    topReferrers: Array<{
      userId: string;
      referrals: number;
      conversions: number;
    }>;
  };
  
  // Trial Metrics
  trial: {
    trialStarts: number;
    trialToConversionRate: number;
    trialExtensionRate: number;
    averageTrialDuration: number;
    trialRevenue: number;
  };
  
  // Email Marketing Metrics
  email: {
    subscribers: number;
    subscriberGrowthRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    unsubscribeRate: number;
  };
  
  // Engagement Metrics
  engagement: {
    monthlyActiveUsers: number;
    weeklyActiveUsers: number;
    dailyActiveUsers: number;
    sessionDuration: number;
    pageViews: number;
    featureAdoption: Record<string, number>;
  };
}

/**
 * User segment definitions for analytics
 */
export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    subscriptionTiers?: SubscriptionTier[];
    signupDateRange?: { start: string; end: string };
    usageLevel?: 'low' | 'medium' | 'high';
    lastActiveRange?: { start: string; end: string };
    hasCompletedOnboarding?: boolean;
    customProperties?: Record<string, any>;
  };
  userCount: number;
  conversionRate: number;
  lifetimeValue: number;
}

/**
 * A/B test result interface
 */
export interface ABTestResult {
  testId: string;
  testName: string;
  variants: Array<{
    id: string;
    name: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    significance: number; // Statistical significance
    isWinner?: boolean;
  }>;
  startDate: string;
  endDate?: string;
  status: 'running' | 'completed' | 'paused';
  primaryMetric: string;
  secondaryMetrics: string[];
}

/**
 * Growth analytics service that integrates with the main analytics system
 * 
 * Key Features:
 * - Comprehensive growth metrics tracking
 * - User segmentation and cohort analysis
 * - A/B test result tracking
 * - Conversion funnel analysis
 * - Revenue attribution
 * - Retention and churn analysis
 * - Integration with all growth features
 */
class GrowthAnalyticsService {
  /**
   * Track trial lifecycle events
   */
  async trackTrialEvent(
    eventType: 'started' | 'extended' | 'converted' | 'expired' | 'cancelled',
    userId: string,
    properties: {
      trialDuration?: number;
      extensionDays?: number;
      selectedTier?: SubscriptionTier;
      conversionValue?: number;
      cancellationReason?: string;
      daysUsed?: number;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      started: GrowthAnalyticsEvents.TRIAL_STARTED,
      extended: GrowthAnalyticsEvents.TRIAL_EXTENDED,
      converted: GrowthAnalyticsEvents.TRIAL_CONVERTED,
      expired: GrowthAnalyticsEvents.TRIAL_EXPIRED,
      cancelled: GrowthAnalyticsEvents.TRIAL_CANCELLED
    };

    const funnelStageMap = {
      started: ConversionFunnelStage.INTEREST,
      extended: ConversionFunnelStage.CONSIDERATION,
      converted: ConversionFunnelStage.PURCHASE,
      expired: ConversionFunnelStage.RETENTION,
      cancelled: ConversionFunnelStage.RETENTION
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.CONVERSION,
      {
        userId,
        eventType,
        ...properties
      }
    );

    // Track as conversion event for purchase events
    if (eventType === 'converted') {
      await analyticsService.trackConversion(
        'trial_conversion',
        funnelStageMap[eventType],
        {
          userId,
          revenue: properties.conversionValue,
          subscriptionTier: properties.selectedTier,
          trialDuration: properties.trialDuration,
          ...properties
        }
      );
    }
  }

  /**
   * Track referral program events
   */
  async trackReferralEvent(
    eventType: 'code_generated' | 'shared' | 'clicked' | 'signup' | 'converted' | 'reward_earned',
    userId: string,
    properties: {
      referralCode?: string;
      referredUserId?: string;
      referredEmail?: string;
      shareChannel?: string;
      rewardType?: string;
      rewardValue?: number;
      conversionValue?: number;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      code_generated: GrowthAnalyticsEvents.REFERRAL_CODE_GENERATED,
      shared: GrowthAnalyticsEvents.REFERRAL_SHARED,
      clicked: GrowthAnalyticsEvents.REFERRAL_CLICKED,
      signup: GrowthAnalyticsEvents.REFERRAL_SIGNUP,
      converted: GrowthAnalyticsEvents.REFERRAL_CONVERTED,
      reward_earned: GrowthAnalyticsEvents.REFERRAL_REWARD_EARNED
    };

    const funnelStageMap = {
      code_generated: ConversionFunnelStage.AWARENESS,
      shared: ConversionFunnelStage.AWARENESS,
      clicked: ConversionFunnelStage.INTEREST,
      signup: ConversionFunnelStage.CONSIDERATION,
      converted: ConversionFunnelStage.PURCHASE,
      reward_earned: ConversionFunnelStage.RETENTION
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.CONVERSION,
      {
        userId,
        eventType,
        ...properties
      }
    );

    // Track conversion events
    if (eventType === 'converted') {
      await analyticsService.trackConversion(
        'referral_conversion',
        funnelStageMap[eventType],
        {
          userId,
          referrerUserId: userId,
          referredUserId: properties.referredUserId,
          revenue: properties.conversionValue,
          ...properties
        }
      );
    }
  }

  /**
   * Track onboarding events
   */
  async trackOnboardingEvent(
    eventType: 'started' | 'step_completed' | 'step_skipped' | 'completed' | 'abandoned',
    userId: string,
    properties: {
      currentStep?: number;
      totalSteps?: number;
      stepId?: string;
      stepType?: string;
      timeSpent?: number;
      skipReason?: string;
      completionRate?: number;
      personalizationData?: Record<string, any>;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      started: GrowthAnalyticsEvents.ONBOARDING_STARTED,
      step_completed: GrowthAnalyticsEvents.ONBOARDING_STEP_COMPLETED,
      step_skipped: GrowthAnalyticsEvents.ONBOARDING_STEP_SKIPPED,
      completed: GrowthAnalyticsEvents.ONBOARDING_COMPLETED,
      abandoned: GrowthAnalyticsEvents.ONBOARDING_ABANDONED
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.USER_BEHAVIOR,
      {
        userId,
        eventType,
        ...properties
      }
    );

    // Track user activation when onboarding is completed
    if (eventType === 'completed') {
      await this.trackUserActivation(userId, {
        activationTrigger: 'onboarding_completed',
        ...properties
      });
    }
  }

  /**
   * Track upgrade prompt events
   */
  async trackUpgradePromptEvent(
    eventType: 'shown' | 'clicked' | 'dismissed' | 'converted',
    userId: string,
    properties: {
      promptId?: string;
      promptType?: string;
      triggerContext?: string;
      selectedTier?: SubscriptionTier;
      conversionValue?: number;
      timeToAction?: number;
      variant?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      shown: GrowthAnalyticsEvents.UPGRADE_PROMPT_SHOWN,
      clicked: GrowthAnalyticsEvents.UPGRADE_PROMPT_CLICKED,
      dismissed: GrowthAnalyticsEvents.UPGRADE_PROMPT_DISMISSED,
      converted: GrowthAnalyticsEvents.UPGRADE_PROMPT_CONVERTED
    };

    const funnelStageMap = {
      shown: ConversionFunnelStage.AWARENESS,
      clicked: ConversionFunnelStage.CONSIDERATION,
      dismissed: ConversionFunnelStage.CONSIDERATION,
      converted: ConversionFunnelStage.PURCHASE
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.CONVERSION,
      {
        userId,
        eventType,
        ...properties
      }
    );

    // Track conversion for converted events
    if (eventType === 'converted') {
      await analyticsService.trackConversion(
        'upgrade_prompt_conversion',
        funnelStageMap[eventType],
        {
          userId,
          revenue: properties.conversionValue,
          subscriptionTier: properties.selectedTier,
          promptId: properties.promptId,
          variant: properties.variant,
          ...properties
        }
      );
    }
  }

  /**
   * Track email marketing events
   */
  async trackEmailEvent(
    eventType: 'captured' | 'sent' | 'opened' | 'clicked' | 'unsubscribed' | 'converted',
    userId: string,
    properties: {
      email?: string;
      campaignId?: string;
      campaignType?: string;
      subject?: string;
      linkUrl?: string;
      conversionValue?: number;
      unsubscribeReason?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      captured: GrowthAnalyticsEvents.EMAIL_CAPTURED,
      sent: GrowthAnalyticsEvents.EMAIL_CAMPAIGN_SENT,
      opened: GrowthAnalyticsEvents.EMAIL_OPENED,
      clicked: GrowthAnalyticsEvents.EMAIL_CLICKED,
      unsubscribed: GrowthAnalyticsEvents.EMAIL_UNSUBSCRIBED,
      converted: GrowthAnalyticsEvents.EMAIL_CONVERTED
    };

    const funnelStageMap = {
      captured: ConversionFunnelStage.AWARENESS,
      sent: ConversionFunnelStage.AWARENESS,
      opened: ConversionFunnelStage.INTEREST,
      clicked: ConversionFunnelStage.CONSIDERATION,
      unsubscribed: ConversionFunnelStage.RETENTION,
      converted: ConversionFunnelStage.PURCHASE
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.CONVERSION,
      {
        userId,
        eventType,
        ...properties
      }
    );

    // Track conversion for converted events
    if (eventType === 'converted') {
      await analyticsService.trackConversion(
        'email_conversion',
        funnelStageMap[eventType],
        {
          userId,
          revenue: properties.conversionValue,
          campaignId: properties.campaignId,
          campaignType: properties.campaignType,
          ...properties
        }
      );
    }
  }

  /**
   * Track user activation
   */
  async trackUserActivation(
    userId: string,
    properties: {
      activationTrigger: string;
      timeToActivation?: number;
      activationActions?: string[];
      [key: string]: any;
    }
  ): Promise<void> {
    await analyticsService.track(
      GrowthAnalyticsEvents.USER_ACTIVATION,
      AnalyticsEventCategory.USER_BEHAVIOR,
      {
        userId,
        ...properties
      }
    );
  }

  /**
   * Track user retention check
   */
  async trackRetentionCheck(
    userId: string,
    properties: {
      daysSinceSignup: number;
      retentionPeriod: 'day1' | 'day7' | 'day30';
      isRetained: boolean;
      lastActiveDate?: string;
      activityScore?: number;
      [key: string]: any;
    }
  ): Promise<void> {
    await analyticsService.track(
      GrowthAnalyticsEvents.USER_RETENTION_CHECK,
      AnalyticsEventCategory.USER_BEHAVIOR,
      {
        userId,
        ...properties
      }
    );
  }

  /**
   * Track churn risk identification
   */
  async trackChurnRisk(
    userId: string,
    properties: {
      riskLevel: 'low' | 'medium' | 'high';
      riskFactors: string[];
      daysSinceLastActivity: number;
      engagementScore: number;
      interventionTriggered?: boolean;
      [key: string]: any;
    }
  ): Promise<void> {
    await analyticsService.track(
      GrowthAnalyticsEvents.USER_CHURN_RISK,
      AnalyticsEventCategory.USER_BEHAVIOR,
      {
        userId,
        ...properties
      }
    );
  }

  /**
   * Track achievement unlocked
   */
  async trackAchievementUnlocked(
    userId: string,
    properties: {
      achievementId: string;
      achievementName: string;
      category: string;
      rarity: string;
      timeToUnlock?: number;
      rewardType?: string;
      rewardValue?: any;
      [key: string]: any;
    }
  ): Promise<void> {
    await analyticsService.track(
      GrowthAnalyticsEvents.ACHIEVEMENT_UNLOCKED,
      AnalyticsEventCategory.ENGAGEMENT,
      {
        userId,
        ...properties
      }
    );
  }

  /**
   * Track NPS survey events
   */
  async trackNPSEvent(
    eventType: 'shown' | 'completed',
    userId: string,
    properties: {
      surveyId: string;
      score?: number;
      userType?: 'promoter' | 'passive' | 'detractor';
      feedback?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      shown: GrowthAnalyticsEvents.NPS_SURVEY_SHOWN,
      completed: GrowthAnalyticsEvents.NPS_SURVEY_COMPLETED
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.ENGAGEMENT,
      {
        userId,
        eventType,
        ...properties
      }
    );
  }

  /**
   * Track push notification events
   */
  async trackPushNotificationEvent(
    eventType: 'sent' | 'opened',
    userId: string,
    properties: {
      campaignId: string;
      notificationType: string;
      title?: string;
      deepLink?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      sent: GrowthAnalyticsEvents.PUSH_NOTIFICATION_SENT,
      opened: GrowthAnalyticsEvents.PUSH_NOTIFICATION_OPENED
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.ENGAGEMENT,
      {
        userId,
        eventType,
        ...properties
      }
    );
  }

  /**
   * Track in-app message events
   */
  async trackInAppMessageEvent(
    eventType: 'shown' | 'clicked',
    userId: string,
    properties: {
      messageId: string;
      messageType: string;
      actionId?: string;
      conversionTracked?: boolean;
      [key: string]: any;
    }
  ): Promise<void> {
    const eventMap = {
      shown: GrowthAnalyticsEvents.IN_APP_MESSAGE_SHOWN,
      clicked: GrowthAnalyticsEvents.IN_APP_MESSAGE_CLICKED
    };

    await analyticsService.track(
      eventMap[eventType],
      AnalyticsEventCategory.ENGAGEMENT,
      {
        userId,
        eventType,
        ...properties
      }
    );
  }

  /**
   * Get comprehensive growth metrics
   */
  async getGrowthMetrics(
    dateRange: { start: string; end: string },
    segment?: string
  ): Promise<GrowthMetrics> {
    try {
      // This would typically query the analytics backend for aggregated metrics
      // For now, return a mock structure showing the interface
      
      return {
        acquisition: {
          signups: 1250,
          signupRate: 3.2,
          sourceBreakdown: {
            organic: 680,
            referral: 320,
            paid: 250
          },
          organicSignups: 680,
          referralSignups: 320,
          paidSignups: 250
        },
        activation: {
          activatedUsers: 875,
          activationRate: 70.0,
          timeToActivation: 2.3,
          onboardingCompletionRate: 65.5,
          firstScanCompletionRate: 78.2
        },
        retention: {
          day1: 85.2,
          day7: 62.8,
          day30: 45.6,
          cohortRetention: [
            { cohort: '2024-01', day1: 87.3, day7: 65.1, day30: 47.2 },
            { cohort: '2024-02', day1: 83.1, day7: 60.5, day30: 44.0 }
          ]
        },
        revenue: {
          monthlyRecurringRevenue: 45600,
          averageRevenuePerUser: 29.99,
          lifetimeValue: 180.50,
          churnRate: 5.2,
          conversionRate: 12.8,
          upgradeRate: 8.5
        },
        referral: {
          totalReferrals: 450,
          referralConversionRate: 25.6,
          referralRevenue: 3420,
          topReferrers: [
            { userId: 'user1', referrals: 12, conversions: 4 },
            { userId: 'user2', referrals: 8, conversions: 3 }
          ]
        },
        trial: {
          trialStarts: 280,
          trialToConversionRate: 18.5,
          trialExtensionRate: 12.3,
          averageTrialDuration: 11.2,
          trialRevenue: 5180
        },
        email: {
          subscribers: 2150,
          subscriberGrowthRate: 8.5,
          openRate: 24.3,
          clickRate: 4.1,
          conversionRate: 1.8,
          unsubscribeRate: 0.5
        },
        engagement: {
          monthlyActiveUsers: 1850,
          weeklyActiveUsers: 1240,
          dailyActiveUsers: 580,
          sessionDuration: 12.5,
          pageViews: 15420,
          featureAdoption: {
            scan: 95.2,
            reports: 78.5,
            dashboard: 65.8,
            settings: 45.2
          }
        }
      };
    } catch (error) {
      console.error('Failed to get growth metrics:', error);
      throw error;
    }
  }

  /**
   * Get user segments
   */
  async getUserSegments(): Promise<UserSegment[]> {
    try {
      // Mock segments for the interface
      return [
        {
          id: 'new_users',
          name: 'New Users',
          description: 'Users who signed up in the last 30 days',
          criteria: {
            signupDateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString()
            }
          },
          userCount: 450,
          conversionRate: 12.5,
          lifetimeValue: 89.50
        },
        {
          id: 'power_users',
          name: 'Power Users',
          description: 'Highly engaged users with frequent usage',
          criteria: {
            usageLevel: 'high',
            subscriptionTiers: [SubscriptionTier.PRO, SubscriptionTier.TEAM]
          },
          userCount: 180,
          conversionRate: 85.2,
          lifetimeValue: 450.00
        },
        {
          id: 'at_risk',
          name: 'At Risk Users',
          description: 'Users who haven\'t been active recently',
          criteria: {
            lastActiveRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          userCount: 220,
          conversionRate: 3.8,
          lifetimeValue: 25.50
        }
      ];
    } catch (error) {
      console.error('Failed to get user segments:', error);
      throw error;
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId?: string): Promise<ABTestResult[]> {
    try {
      // Mock A/B test results
      return [
        {
          testId: 'onboarding_flow_test',
          testName: 'Onboarding Flow Optimization',
          variants: [
            {
              id: 'control',
              name: 'Original Flow',
              participants: 500,
              conversions: 325,
              conversionRate: 65.0,
              revenue: 9750.00,
              significance: 0.95
            },
            {
              id: 'variant_a',
              name: 'Simplified Flow',
              participants: 500,
              conversions: 375,
              conversionRate: 75.0,
              revenue: 11250.00,
              significance: 0.98,
              isWinner: true
            }
          ],
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-02-15T00:00:00Z',
          status: 'completed',
          primaryMetric: 'onboarding_completion_rate',
          secondaryMetrics: ['time_to_first_scan', 'trial_conversion_rate']
        }
      ];
    } catch (error) {
      console.error('Failed to get A/B test results:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const growthAnalyticsService = new GrowthAnalyticsService();
export default growthAnalyticsService;