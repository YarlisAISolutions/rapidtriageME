import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { analyticsService, AnalyticsEventCategory, ConversionFunnelStage } from '../analytics/analytics.service';
import { SubscriptionTier } from '../payment/payment.service';
import { UsageEventType } from '../usage/usage.service';

/**
 * Upgrade prompt event types for analytics tracking
 */
export enum UpgradePromptEventType {
  PROMPT_SHOWN = 'upgrade_prompt_shown',
  PROMPT_CLICKED = 'upgrade_prompt_clicked',
  PROMPT_DISMISSED = 'upgrade_prompt_dismissed',
  PROMPT_SNOOZED = 'upgrade_prompt_snoozed',
  LIMIT_REACHED = 'usage_limit_reached',
  FEATURE_BLOCKED = 'feature_blocked',
  SUCCESSFUL_CONVERSION = 'prompt_conversion_successful'
}

/**
 * Upgrade prompt trigger types
 */
export enum PromptTriggerType {
  USAGE_LIMIT = 'usage_limit',
  FEATURE_HOVER = 'feature_hover',
  TIME_BASED = 'time_based',
  ENGAGEMENT_HIGH = 'engagement_high',
  MILESTONE_REACHED = 'milestone_reached',
  TRIAL_ENDING = 'trial_ending',
  COMPETITOR_COMPARISON = 'competitor_comparison',
  VALUE_DEMONSTRATION = 'value_demonstration'
}

/**
 * Prompt display positions and styles
 */
export enum PromptPosition {
  BANNER_TOP = 'banner_top',
  BANNER_BOTTOM = 'banner_bottom',
  MODAL_CENTER = 'modal_center',
  SLIDE_UP = 'slide_up',
  TOOLTIP = 'tooltip',
  INLINE = 'inline',
  FULLSCREEN = 'fullscreen'
}

/**
 * A/B test variant configuration
 */
export interface PromptVariant {
  id: string;
  name: string;
  weight: number; // Percentage allocation
  config: {
    position: PromptPosition;
    style: 'urgent' | 'friendly' | 'professional' | 'playful';
    title: string;
    message: string;
    ctaText: string;
    secondaryCtaText?: string;
    showDiscount?: boolean;
    discountPercentage?: number;
    urgencyTimer?: boolean;
    socialProof?: boolean;
    benefits?: string[];
    imagery?: string;
  };
}

/**
 * Upgrade prompt configuration
 */
export interface UpgradePromptConfig {
  trigger: PromptTriggerType;
  targetTiers: SubscriptionTier[];
  excludeTiers: SubscriptionTier[];
  conditions: {
    minDaysSinceSignup?: number;
    maxDaysSinceSignup?: number;
    minUsageSessions?: number;
    requiredFeatureInteractions?: string[];
    userSegments?: string[];
    timeOfDay?: { start: number; end: number }; // 24-hour format
    dayOfWeek?: number[]; // 0-6, Sunday-Saturday
  };
  frequency: {
    maxPerDay: number;
    maxPerWeek: number;
    cooldownHours: number;
    maxLifetimeShows: number;
  };
  variants: PromptVariant[];
  isActive: boolean;
}

/**
 * User interaction with upgrade prompts
 */
export interface PromptInteraction {
  id: string;
  userId: string;
  promptConfigId: string;
  variantId: string;
  trigger: PromptTriggerType;
  position: PromptPosition;
  
  // Interaction data
  shownAt: string;
  action: 'clicked' | 'dismissed' | 'snoozed' | 'converted' | 'timeout';
  actionAt?: string;
  timeToAction?: number; // milliseconds
  
  // Context
  context: {
    currentTier: SubscriptionTier;
    usageLevel: number;
    feature?: string;
    screen?: string;
    triggerData?: any;
  };
  
  // Conversion tracking
  convertedAt?: string;
  conversionValue?: number;
  selectedTier?: SubscriptionTier;
}

/**
 * Smart timing configuration
 */
export interface SmartTimingRule {
  name: string;
  condition: (context: any) => boolean;
  delay?: number; // milliseconds to wait before showing
  probability: number; // 0-1, chance to show when condition is met
  priority: number; // Higher number = higher priority
}

/**
 * Upgrade prompt analytics data
 */
export interface PromptAnalytics {
  promptId: string;
  variantId: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  avgTimeToAction: number;
  topTriggers: Array<{ trigger: PromptTriggerType; count: number }>;
  performance: {
    byTier: Record<SubscriptionTier, any>;
    byTime: Array<{ hour: number; performance: any }>;
    byDay: Array<{ day: number; performance: any }>;
  };
}

/**
 * Comprehensive upgrade prompts service for conversion optimization
 * 
 * Key Features:
 * - Contextual prompt triggers based on user behavior
 * - A/B testing framework for optimization
 * - Smart timing to avoid prompt fatigue
 * - Usage-based and engagement-based targeting
 * - Personalized messaging and offers
 * - Anti-annoyance measures and frequency capping
 * - Conversion tracking and attribution
 * - Dynamic pricing and discount offers
 */
class UpgradePromptsService {
  private apiService: ApiService;
  private promptConfigs: Map<string, UpgradePromptConfig> = new Map();
  private userInteractions: Map<string, PromptInteraction[]> = new Map();
  private smartTimingRules: SmartTimingRule[] = [];

  // Storage keys for offline persistence
  private readonly STORAGE_KEYS = {
    INTERACTIONS: 'upgrade_prompt_interactions',
    CONFIGS: 'upgrade_prompt_configs',
    DISMISSED_PROMPTS: 'dismissed_prompts',
    USER_PREFERENCES: 'prompt_user_preferences'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.initializeDefaultConfigs();
    this.initializeSmartTimingRules();
  }

  /**
   * Initialize default prompt configurations
   */
  private initializeDefaultConfigs(): void {
    // Usage Limit Prompt
    this.promptConfigs.set('usage_limit_basic', {
      trigger: PromptTriggerType.USAGE_LIMIT,
      targetTiers: [SubscriptionTier.FREE],
      excludeTiers: [],
      conditions: {
        minDaysSinceSignup: 1,
      },
      frequency: {
        maxPerDay: 2,
        maxPerWeek: 5,
        cooldownHours: 4,
        maxLifetimeShows: 50
      },
      variants: [
        {
          id: 'usage_limit_urgent',
          name: 'Urgent Style',
          weight: 40,
          config: {
            position: PromptPosition.MODAL_CENTER,
            style: 'urgent',
            title: 'You\'ve Reached Your Limit!',
            message: 'Upgrade to Pro to continue analyzing websites and unlock unlimited scans.',
            ctaText: 'Upgrade to Pro',
            secondaryCtaText: 'Maybe Later',
            showDiscount: true,
            discountPercentage: 20,
            benefits: ['Unlimited scans', 'Advanced analytics', 'Priority support']
          }
        },
        {
          id: 'usage_limit_friendly',
          name: 'Friendly Style',
          weight: 60,
          config: {
            position: PromptPosition.SLIDE_UP,
            style: 'friendly',
            title: 'Ready for More?',
            message: 'You\'re making great progress! Upgrade to Pro and keep the momentum going with unlimited scans.',
            ctaText: 'Let\'s Upgrade',
            secondaryCtaText: 'Not Now',
            socialProof: true,
            benefits: ['Join 10k+ Pro users', 'Unlimited everything', 'Priority support']
          }
        }
      ],
      isActive: true
    });

    // Feature Hover Prompt
    this.promptConfigs.set('feature_hover_pro', {
      trigger: PromptTriggerType.FEATURE_HOVER,
      targetTiers: [SubscriptionTier.FREE],
      excludeTiers: [],
      conditions: {
        requiredFeatureInteractions: ['advanced_analytics_hover'],
        minDaysSinceSignup: 2,
      },
      frequency: {
        maxPerDay: 1,
        maxPerWeek: 3,
        cooldownHours: 24,
        maxLifetimeShows: 10
      },
      variants: [
        {
          id: 'feature_tooltip',
          name: 'Tooltip Style',
          weight: 100,
          config: {
            position: PromptPosition.TOOLTIP,
            style: 'professional',
            title: 'Advanced Analytics',
            message: 'Get detailed performance insights and historical data with Pro.',
            ctaText: 'Unlock Pro Features',
            showDiscount: false,
            benefits: ['Historical data', 'Custom reports', 'API access']
          }
        }
      ],
      isActive: true
    });

    // Time-based Engagement Prompt
    this.promptConfigs.set('high_engagement_conversion', {
      trigger: PromptTriggerType.ENGAGEMENT_HIGH,
      targetTiers: [SubscriptionTier.FREE],
      excludeTiers: [],
      conditions: {
        minUsageSessions: 5,
        minDaysSinceSignup: 3,
        timeOfDay: { start: 9, end: 17 } // Business hours
      },
      frequency: {
        maxPerDay: 1,
        maxPerWeek: 2,
        cooldownHours: 48,
        maxLifetimeShows: 5
      },
      variants: [
        {
          id: 'engagement_success',
          name: 'Success Message',
          weight: 50,
          config: {
            position: PromptPosition.BANNER_TOP,
            style: 'friendly',
            title: 'You\'re on Fire! 🔥',
            message: 'You\'ve completed 5 scans! Ready to unlock the full power of RapidTriage?',
            ctaText: 'Upgrade Now',
            secondaryCtaText: 'Keep Free Plan',
            showDiscount: true,
            discountPercentage: 30,
            socialProof: true
          }
        },
        {
          id: 'engagement_value',
          name: 'Value Proposition',
          weight: 50,
          config: {
            position: PromptPosition.MODAL_CENTER,
            style: 'professional',
            title: 'Maximize Your Results',
            message: 'You\'re clearly serious about website optimization. Pro features will help you achieve even better results.',
            ctaText: 'See Pro Features',
            secondaryCtaText: 'Continue Free',
            benefits: ['Advanced monitoring', 'Team collaboration', 'Custom integrations']
          }
        }
      ],
      isActive: true
    });
  }

  /**
   * Initialize smart timing rules
   */
  private initializeSmartTimingRules(): void {
    this.smartTimingRules = [
      {
        name: 'avoid_immediate_after_scan',
        condition: (context) => {
          return Date.now() - context.lastScanCompleted > 60000; // Wait 1 minute after scan
        },
        probability: 1.0,
        priority: 10
      },
      {
        name: 'boost_after_successful_scan',
        condition: (context) => {
          return context.lastScanSuccess && context.scanScore > 80;
        },
        delay: 3000, // 3 second delay
        probability: 0.8,
        priority: 8
      },
      {
        name: 'reduce_during_onboarding',
        condition: (context) => {
          return !context.onboardingComplete;
        },
        probability: 0.3, // 30% chance during onboarding
        priority: 9
      },
      {
        name: 'boost_power_users',
        condition: (context) => {
          return context.dailyUsage > 10; // High usage day
        },
        probability: 0.9,
        priority: 7
      }
    ];
  }

  /**
   * Check if a prompt should be shown based on trigger and context
   */
  async shouldShowPrompt(
    userId: string,
    trigger: PromptTriggerType,
    context: any
  ): Promise<{ shouldShow: boolean; config?: UpgradePromptConfig; variant?: PromptVariant }> {
    try {
      // Get applicable prompt configs for this trigger
      const applicableConfigs = Array.from(this.promptConfigs.values()).filter(config =>
        config.trigger === trigger && 
        config.isActive &&
        this.meetsTargetingCriteria(config, context)
      );

      if (applicableConfigs.length === 0) {
        return { shouldShow: false };
      }

      // Check frequency limits and smart timing
      for (const config of applicableConfigs) {
        const canShow = await this.checkFrequencyLimits(userId, config) &&
                       await this.checkSmartTiming(context);

        if (canShow) {
          // Select variant based on A/B test weights
          const variant = this.selectVariant(config.variants);
          return { shouldShow: true, config, variant };
        }
      }

      return { shouldShow: false };
    } catch (error) {
      console.error('Error checking if prompt should show:', error);
      return { shouldShow: false };
    }
  }

  /**
   * Show an upgrade prompt to the user
   */
  async showPrompt(
    userId: string,
    config: UpgradePromptConfig,
    variant: PromptVariant,
    context: any
  ): Promise<string> {
    try {
      const interaction: PromptInteraction = {
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        promptConfigId: config.trigger,
        variantId: variant.id,
        trigger: config.trigger,
        position: variant.config.position,
        shownAt: new Date().toISOString(),
        action: 'clicked', // Will be updated when user interacts
        context: {
          currentTier: context.currentTier || SubscriptionTier.FREE,
          usageLevel: context.usageLevel || 0,
          feature: context.feature,
          screen: context.screen,
          triggerData: context.triggerData
        }
      };

      // Save interaction
      await this.saveInteraction(interaction);

      // Track prompt shown
      await analyticsService.track(
        UpgradePromptEventType.PROMPT_SHOWN,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          promptId: config.trigger,
          variantId: variant.id,
          trigger: config.trigger,
          position: variant.config.position,
          context
        }
      );

      // Update backend
      await this.apiService.post('/upgrade-prompts/shown', {
        interactionId: interaction.id,
        userId,
        config,
        variant,
        context,
        timestamp: interaction.shownAt
      });

      return interaction.id;
    } catch (error) {
      console.error('Failed to show upgrade prompt:', error);
      throw error;
    }
  }

  /**
   * Handle user interaction with prompt
   */
  async handlePromptInteraction(
    interactionId: string,
    action: PromptInteraction['action'],
    conversionData?: {
      selectedTier: SubscriptionTier;
      conversionValue: number;
    }
  ): Promise<void> {
    try {
      const interaction = await this.getInteraction(interactionId);
      if (!interaction) {
        throw new Error('Interaction not found');
      }

      const now = new Date().toISOString();
      const timeToAction = Date.now() - new Date(interaction.shownAt).getTime();

      // Update interaction
      interaction.action = action;
      interaction.actionAt = now;
      interaction.timeToAction = timeToAction;

      if (conversionData) {
        interaction.convertedAt = now;
        interaction.selectedTier = conversionData.selectedTier;
        interaction.conversionValue = conversionData.conversionValue;
      }

      // Save updated interaction
      await this.saveInteraction(interaction);

      // Track interaction
      const eventType = {
        'clicked': UpgradePromptEventType.PROMPT_CLICKED,
        'dismissed': UpgradePromptEventType.PROMPT_DISMISSED,
        'snoozed': UpgradePromptEventType.PROMPT_SNOOZED,
        'converted': UpgradePromptEventType.SUCCESSFUL_CONVERSION,
        'timeout': UpgradePromptEventType.PROMPT_DISMISSED
      }[action];

      if (eventType) {
        await analyticsService.track(
          eventType,
          AnalyticsEventCategory.CONVERSION,
          {
            userId: interaction.userId,
            promptId: interaction.promptConfigId,
            variantId: interaction.variantId,
            timeToAction,
            conversionData
          }
        );
      }

      // Track conversion event separately
      if (action === 'converted' && conversionData) {
        await analyticsService.trackConversion(
          'upgrade_prompt_conversion',
          ConversionFunnelStage.PURCHASE,
          {
            userId: interaction.userId,
            promptId: interaction.promptConfigId,
            variantId: interaction.variantId,
            selectedTier: conversionData.selectedTier,
            revenue: conversionData.conversionValue,
            timeToAction
          }
        );
      }

      // Update backend
      await this.apiService.put(`/upgrade-prompts/interaction/${interactionId}`, {
        action,
        actionAt: now,
        timeToAction,
        conversionData
      });
    } catch (error) {
      console.error('Failed to handle prompt interaction:', error);
    }
  }

  /**
   * Get prompt performance analytics
   */
  async getPromptAnalytics(promptId?: string): Promise<PromptAnalytics[]> {
    try {
      const response = await this.apiService.get('/upgrade-prompts/analytics', {
        params: { promptId }
      });
      
      return response.analytics || [];
    } catch (error) {
      console.error('Failed to get prompt analytics:', error);
      return [];
    }
  }

  /**
   * Update prompt configuration (for A/B testing)
   */
  async updatePromptConfig(promptId: string, config: Partial<UpgradePromptConfig>): Promise<void> {
    try {
      const existingConfig = this.promptConfigs.get(promptId);
      if (!existingConfig) {
        throw new Error('Prompt config not found');
      }

      const updatedConfig = { ...existingConfig, ...config };
      this.promptConfigs.set(promptId, updatedConfig);

      // Update backend
      await this.apiService.put(`/upgrade-prompts/config/${promptId}`, updatedConfig);
    } catch (error) {
      console.error('Failed to update prompt config:', error);
      throw error;
    }
  }

  /**
   * Disable prompts for a user (anti-annoyance)
   */
  async disablePromptsForUser(
    userId: string, 
    duration?: number, // hours
    reason?: string
  ): Promise<void> {
    try {
      const disabledUntil = duration 
        ? new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()
        : undefined;

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.USER_PREFERENCES}_${userId}`,
        JSON.stringify({
          promptsDisabled: true,
          disabledUntil,
          reason,
          disabledAt: new Date().toISOString()
        })
      );

      // Update backend
      await this.apiService.post('/upgrade-prompts/disable', {
        userId,
        duration,
        reason,
        disabledAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to disable prompts for user:', error);
    }
  }

  // Private helper methods

  private meetsTargetingCriteria(config: UpgradePromptConfig, context: any): boolean {
    const { conditions } = config;
    const now = new Date();

    // Check target/exclude tiers
    if (!config.targetTiers.includes(context.currentTier)) {
      return false;
    }

    if (config.excludeTiers.includes(context.currentTier)) {
      return false;
    }

    // Check signup date range
    if (conditions.minDaysSinceSignup) {
      const daysSinceSignup = (Date.now() - new Date(context.signupDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSignup < conditions.minDaysSinceSignup) {
        return false;
      }
    }

    if (conditions.maxDaysSinceSignup) {
      const daysSinceSignup = (Date.now() - new Date(context.signupDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSignup > conditions.maxDaysSinceSignup) {
        return false;
      }
    }

    // Check usage sessions
    if (conditions.minUsageSessions && context.usageSessions < conditions.minUsageSessions) {
      return false;
    }

    // Check feature interactions
    if (conditions.requiredFeatureInteractions) {
      const hasRequiredInteractions = conditions.requiredFeatureInteractions.every(interaction =>
        context.featureInteractions?.includes(interaction)
      );
      if (!hasRequiredInteractions) {
        return false;
      }
    }

    // Check time of day
    if (conditions.timeOfDay) {
      const currentHour = now.getHours();
      if (currentHour < conditions.timeOfDay.start || currentHour > conditions.timeOfDay.end) {
        return false;
      }
    }

    // Check day of week
    if (conditions.dayOfWeek) {
      const currentDay = now.getDay();
      if (!conditions.dayOfWeek.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  private async checkFrequencyLimits(userId: string, config: UpgradePromptConfig): Promise<boolean> {
    try {
      const userInteractions = await this.getUserInteractions(userId);
      const configInteractions = userInteractions.filter(i => i.promptConfigId === config.trigger);

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
      const cooldownTime = now - (config.frequency.cooldownHours * 60 * 60 * 1000);

      // Check daily limit
      const dailyShows = configInteractions.filter(i => 
        new Date(i.shownAt).getTime() > oneDayAgo
      ).length;
      if (dailyShows >= config.frequency.maxPerDay) {
        return false;
      }

      // Check weekly limit
      const weeklyShows = configInteractions.filter(i => 
        new Date(i.shownAt).getTime() > oneWeekAgo
      ).length;
      if (weeklyShows >= config.frequency.maxPerWeek) {
        return false;
      }

      // Check cooldown
      const lastShow = configInteractions.reduce((latest, interaction) => {
        const interactionTime = new Date(interaction.shownAt).getTime();
        return interactionTime > latest ? interactionTime : latest;
      }, 0);

      if (lastShow > cooldownTime) {
        return false;
      }

      // Check lifetime limit
      if (configInteractions.length >= config.frequency.maxLifetimeShows) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking frequency limits:', error);
      return false;
    }
  }

  private async checkSmartTiming(context: any): Promise<boolean> {
    // Sort rules by priority (highest first)
    const sortedRules = this.smartTimingRules.sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.condition(context)) {
        // Use this rule's probability
        return Math.random() < rule.probability;
      }
    }

    // Default to showing if no rules match
    return true;
  }

  private selectVariant(variants: PromptVariant[]): PromptVariant {
    const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    return variants[0]; // Fallback
  }

  private async saveInteraction(interaction: PromptInteraction): Promise<void> {
    try {
      const userInteractions = await this.getUserInteractions(interaction.userId);
      const updatedInteractions = userInteractions.filter(i => i.id !== interaction.id);
      updatedInteractions.push(interaction);

      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.INTERACTIONS}_${interaction.userId}`,
        JSON.stringify(updatedInteractions)
      );

      // Update in-memory cache
      this.userInteractions.set(interaction.userId, updatedInteractions);
    } catch (error) {
      console.error('Failed to save interaction:', error);
    }
  }

  private async getInteraction(interactionId: string): Promise<PromptInteraction | null> {
    try {
      // Search through all cached interactions
      for (const [userId, interactions] of this.userInteractions) {
        const interaction = interactions.find(i => i.id === interactionId);
        if (interaction) return interaction;
      }

      // If not in cache, try to load from backend
      const response = await this.apiService.get(`/upgrade-prompts/interaction/${interactionId}`);
      return response.interaction || null;
    } catch (error) {
      console.error('Failed to get interaction:', error);
      return null;
    }
  }

  private async getUserInteractions(userId: string): Promise<PromptInteraction[]> {
    try {
      // Check cache first
      if (this.userInteractions.has(userId)) {
        return this.userInteractions.get(userId)!;
      }

      // Load from storage
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.INTERACTIONS}_${userId}`);
      if (stored) {
        const interactions = JSON.parse(stored);
        this.userInteractions.set(userId, interactions);
        return interactions;
      }

      return [];
    } catch (error) {
      console.error('Failed to get user interactions:', error);
      return [];
    }
  }
}

// Export singleton instance
const apiService = new (require('../api/api.service').ApiService)();
export const upgradePromptsService = new UpgradePromptsService(apiService);
export default upgradePromptsService;