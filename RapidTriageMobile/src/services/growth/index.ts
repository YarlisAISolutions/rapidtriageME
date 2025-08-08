/**
 * Growth features service exports
 * Centralized export for all growth-related services and types
 */

// Core Services
export { default as trialService } from '../trial/trial.service';
export { default as referralService } from '../referral/referral.service';
export { default as onboardingService } from '../onboarding/onboarding.service';
export { default as upgradePromptsService } from '../upgrade-prompts/upgrade-prompts.service';
export { default as emailMarketingService } from '../email-marketing/email-marketing.service';
export { default as growthFeaturesService } from './growth-features.service';
export { default as growthAnalyticsService } from '../growth-analytics/growth-analytics.service';

// Type Exports - Trial Service
export type {
  TrialConfig,
  TrialStatus,
  TrialWarning,
  ConversionOffer
} from '../trial/trial.service';

export {
  TrialEventType
} from '../trial/trial.service';

// Type Exports - Referral Service
export type {
  ReferralConfig,
  Referral,
  ReferralStats,
  ShareConfig
} from '../referral/referral.service';

export {
  ReferralEventType,
  ReferralRewardType
} from '../referral/referral.service';

// Type Exports - Onboarding Service
export type {
  OnboardingStep,
  UserPersonalization,
  OnboardingProgress,
  TutorialStep,
  OnboardingConfig
} from '../onboarding/onboarding.service';

export {
  OnboardingEventType
} from '../onboarding/onboarding.service';

// Type Exports - Upgrade Prompts Service
export type {
  UpgradePromptConfig,
  PromptVariant,
  PromptInteraction,
  SmartTimingRule,
  PromptAnalytics
} from '../upgrade-prompts/upgrade-prompts.service';

export {
  UpgradePromptEventType,
  PromptTriggerType,
  PromptPosition
} from '../upgrade-prompts/upgrade-prompts.service';

// Type Exports - Email Marketing Service
export type {
  EmailPreferences,
  EmailCampaign,
  DripSequence,
  EmailCapturePoint,
  EmailInteraction,
  EmailMarketingAnalytics
} from '../email-marketing/email-marketing.service';

export {
  EmailMarketingEventType
} from '../email-marketing/email-marketing.service';

// Type Exports - Growth Features Service
export type {
  PushNotificationCampaign,
  InAppMessage,
  NPSSurvey,
  Achievement,
  UserAchievement,
  ProductTour,
  Tooltip
} from './growth-features.service';

export {
  GrowthFeatureEventType
} from './growth-features.service';

// Type Exports - Growth Analytics Service
export type {
  GrowthMetrics,
  UserSegment,
  ABTestResult
} from '../growth-analytics/growth-analytics.service';

export {
  GrowthAnalyticsEvents
} from '../growth-analytics/growth-analytics.service';

/**
 * Growth service facade for easy integration
 * Provides a unified interface for all growth features
 */
export class GrowthServiceFacade {
  /**
   * Initialize all growth services
   */
  static async initialize(userId: string): Promise<void> {
    try {
      // Initialize services that need user-specific setup
      await Promise.all([
        // Check for active trial
        trialService.getTrialStatus(userId),
        // Load referral code if exists
        referralService.getUserReferralCode(userId),
        // Get onboarding progress
        onboardingService.getProgress(userId),
        // Load email preferences
        emailMarketingService.getEmailPreferences(userId)
      ]);
    } catch (error) {
      console.error('Failed to initialize growth services:', error);
    }
  }

  /**
   * Start free trial for user
   */
  static async startTrial(userId: string): Promise<boolean> {
    try {
      const trialStatus = await trialService.startTrial(userId);
      
      // Track trial start
      await growthAnalyticsService.trackTrialEvent('started', userId, {
        trialDuration: 14,
        startDate: trialStatus.startDate.toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to start trial:', error);
      return false;
    }
  }

  /**
   * Generate and share referral code
   */
  static async generateReferralCode(userId: string): Promise<string | null> {
    try {
      const code = await referralService.generateReferralCode(userId);
      
      // Track referral code generation
      await growthAnalyticsService.trackReferralEvent('code_generated', userId, {
        referralCode: code
      });

      return code;
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      return null;
    }
  }

  /**
   * Complete onboarding step
   */
  static async completeOnboardingStep(
    userId: string,
    stepId: string,
    stepData?: any
  ): Promise<boolean> {
    try {
      const progress = await onboardingService.completeStep(userId, stepId, stepData);
      
      if (progress) {
        // Track step completion
        await growthAnalyticsService.trackOnboardingEvent('step_completed', userId, {
          stepId,
          currentStep: progress.currentStep,
          totalSteps: progress.totalSteps,
          completionRate: progress.currentStep / progress.totalSteps
        });

        // Check if onboarding is complete
        if (progress.isComplete) {
          await growthAnalyticsService.trackOnboardingEvent('completed', userId, {
            totalSteps: progress.totalSteps,
            completedSteps: progress.completedSteps.length,
            timeSpent: progress.timeSpent
          });
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to complete onboarding step:', error);
      return false;
    }
  }

  /**
   * Show upgrade prompt
   */
  static async showUpgradePrompt(
    userId: string,
    trigger: PromptTriggerType,
    context: any
  ): Promise<string | null> {
    try {
      // Check if prompt should be shown
      const result = await upgradePromptsService.shouldShowPrompt(userId, trigger, context);
      
      if (result.shouldShow && result.config && result.variant) {
        // Show the prompt
        const interactionId = await upgradePromptsService.showPrompt(
          userId,
          result.config,
          result.variant,
          context
        );

        // Track prompt shown
        await growthAnalyticsService.trackUpgradePromptEvent('shown', userId, {
          promptId: result.config.trigger,
          promptType: trigger,
          triggerContext: context,
          variant: result.variant.id
        });

        return interactionId;
      }

      return null;
    } catch (error) {
      console.error('Failed to show upgrade prompt:', error);
      return null;
    }
  }

  /**
   * Capture email for marketing
   */
  static async captureEmail(
    userId: string,
    email: string,
    capturePoint: string,
    preferences?: any
  ): Promise<boolean> {
    try {
      const success = await emailMarketingService.captureEmail(
        email,
        userId,
        capturePoint,
        preferences
      );

      if (success) {
        // Track email capture
        await growthAnalyticsService.trackEmailEvent('captured', userId, {
          email,
          capturePoint,
          preferences
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to capture email:', error);
      return false;
    }
  }

  /**
   * Check and update achievement progress
   */
  static async checkAchievements(
    userId: string,
    eventType: string,
    eventData?: any
  ): Promise<string[]> {
    try {
      const unlockedAchievements = await growthFeaturesService.checkAchievementProgress(
        userId,
        eventType,
        eventData
      );

      // Track each unlocked achievement
      for (const achievementId of unlockedAchievements) {
        await growthAnalyticsService.trackAchievementUnlocked(userId, {
          achievementId,
          achievementName: achievementId, // Would be replaced with actual name
          category: 'general',
          rarity: 'common',
          ...eventData
        });
      }

      return unlockedAchievements;
    } catch (error) {
      console.error('Failed to check achievements:', error);
      return [];
    }
  }

  /**
   * Get comprehensive growth dashboard data
   */
  static async getDashboardData(userId: string): Promise<{
    trial: any;
    referral: any;
    onboarding: any;
    achievements: any[];
    metrics: any;
  }> {
    try {
      const [
        trialStatus,
        referralStats,
        onboardingProgress,
        // achievements would be fetched here
        // metrics would be fetched here
      ] = await Promise.all([
        trialService.getTrialStatus(userId),
        referralService.getReferralStats(userId),
        onboardingService.getProgress(userId),
        // Additional data fetching calls
      ]);

      return {
        trial: trialStatus,
        referral: referralStats,
        onboarding: onboardingProgress,
        achievements: [], // Placeholder
        metrics: {} // Placeholder
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      throw error;
    }
  }
}

// Export the facade as default
export default GrowthServiceFacade;