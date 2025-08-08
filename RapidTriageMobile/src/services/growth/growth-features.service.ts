import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { analyticsService, AnalyticsEventCategory } from '../analytics/analytics.service';
import { SubscriptionTier } from '../payment/payment.service';

/**
 * Growth feature event types for analytics tracking
 */
export enum GrowthFeatureEventType {
  PUSH_NOTIFICATION_SENT = 'push_notification_sent',
  PUSH_NOTIFICATION_OPENED = 'push_notification_opened',
  IN_APP_MESSAGE_SHOWN = 'in_app_message_shown',
  IN_APP_MESSAGE_CLICKED = 'in_app_message_clicked',
  NPS_SURVEY_SHOWN = 'nps_survey_shown',
  NPS_SURVEY_COMPLETED = 'nps_survey_completed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  TOOLTIP_SHOWN = 'tooltip_shown',
  PRODUCT_TOUR_STARTED = 'product_tour_started',
  PRODUCT_TOUR_COMPLETED = 'product_tour_completed'
}

/**
 * Push notification configuration
 */
export interface PushNotificationCampaign {
  id: string;
  name: string;
  type: 'promotional' | 'educational' | 'transactional' | 'engagement' | 'win_back';
  
  // Targeting
  targetSegment: {
    subscriptionTiers?: SubscriptionTier[];
    lastActiveRange?: { start: string; end: string };
    engagementLevel?: 'low' | 'medium' | 'high';
    hasCompletedAction?: string;
    customCriteria?: Record<string, any>;
  };
  
  // Content
  title: string;
  body: string;
  icon?: string;
  image?: string;
  sound?: string;
  badge?: number;
  
  // Behavior
  actionButtons?: Array<{
    id: string;
    title: string;
    action: 'open_app' | 'deep_link' | 'external_url';
    target?: string;
  }>;
  deepLink?: string;
  externalUrl?: string;
  
  // Scheduling
  schedule: {
    type: 'immediate' | 'scheduled' | 'recurring' | 'trigger_based';
    sendDate?: string;
    recurringPattern?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string; // HH:MM format
      daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    };
    triggerEvent?: string;
    timezone?: string;
  };
  
  // Settings
  isActive: boolean;
  expiresAt?: string;
  
  // Metrics
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    dismissed: number;
    conversions: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * In-app message configuration
 */
export interface InAppMessage {
  id: string;
  name: string;
  type: 'banner' | 'modal' | 'tooltip' | 'card' | 'fullscreen';
  
  // Targeting
  targetPages?: string[];
  targetUserSegment: {
    subscriptionTiers?: SubscriptionTier[];
    minDaysSinceSignup?: number;
    hasCompletedOnboarding?: boolean;
    hasUsedFeature?: string;
    customCriteria?: Record<string, any>;
  };
  
  // Display rules
  displayRules: {
    frequency: 'once' | 'session' | 'daily' | 'weekly' | 'always';
    priority: number; // Higher number = higher priority
    position: 'top' | 'center' | 'bottom' | 'corner';
    trigger: 'page_load' | 'scroll_percentage' | 'time_on_page' | 'user_action' | 'exit_intent';
    triggerValue?: number | string;
  };
  
  // Content
  title: string;
  message: string;
  imageUrl?: string;
  backgroundColor: string;
  textColor: string;
  
  // Actions
  actions: Array<{
    id: string;
    text: string;
    type: 'primary' | 'secondary' | 'dismiss';
    action: 'close' | 'deep_link' | 'external_url' | 'custom';
    target?: string;
    trackingId?: string;
  }>;
  
  // Settings
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  
  // Metrics
  metrics: {
    shown: number;
    clicked: number;
    dismissed: number;
    conversions: number;
    conversionRate: number;
  };
}

/**
 * NPS survey configuration
 */
export interface NPSSurvey {
  id: string;
  name: string;
  
  // Targeting
  targetSegment: {
    subscriptionTiers?: SubscriptionTier[];
    minDaysSinceSignup?: number;
    minUsageSessions?: number;
    hasNotRespondedRecently?: boolean;
  };
  
  // Content
  question: string;
  followUpQuestions: {
    promoter: string; // For scores 9-10
    passive: string;  // For scores 7-8
    detractor: string; // For scores 0-6
  };
  
  // Display
  displayTrigger: 'time_based' | 'action_based' | 'milestone_based';
  triggerValue?: string | number;
  
  // Settings
  isActive: boolean;
  frequency: number; // Days between surveys for same user
  
  // Metrics
  metrics: {
    sent: number;
    responses: number;
    responseRate: number;
    averageScore: number;
    npsScore: number; // Net Promoter Score
    promoters: number;
    passives: number;
    detractors: number;
  };
}

/**
 * Achievement/gamification configuration
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'usage' | 'social' | 'milestone' | 'feature' | 'streak';
  
  // Requirements
  requirements: {
    type: 'count' | 'streak' | 'time_based' | 'conditional';
    target: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
    conditions?: Record<string, any>;
  };
  
  // Visual
  iconUrl: string;
  badgeColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  
  // Rewards
  rewards?: {
    type: 'badge' | 'discount' | 'feature_unlock' | 'premium_trial';
    value?: string | number;
    duration?: number; // days
  };
  
  // Settings
  isActive: boolean;
  isHidden: boolean; // Secret achievements
  
  // Metrics
  metrics: {
    unlocked: number;
    uniqueUsers: number;
    averageDaysToUnlock: number;
  };
}

/**
 * User achievement progress
 */
export interface UserAchievement {
  userId: string;
  achievementId: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  currentStreak?: number;
  lastActivityAt?: string;
}

/**
 * Product tour configuration
 */
export interface ProductTour {
  id: string;
  name: string;
  
  // Targeting
  targetPages: string[];
  targetUserSegment: {
    isNewUser?: boolean;
    hasNotCompletedOnboarding?: boolean;
    hasNotUsedFeature?: string;
    subscriptionTiers?: SubscriptionTier[];
  };
  
  // Steps
  steps: Array<{
    id: string;
    title: string;
    description: string;
    targetElement?: string; // CSS selector
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: 'highlight' | 'click' | 'input' | 'wait';
    waitTime?: number; // milliseconds
    nextTrigger: 'click' | 'auto' | 'manual';
  }>;
  
  // Display
  triggerEvent: 'page_load' | 'feature_hover' | 'manual' | 'first_visit';
  
  // Settings
  isActive: boolean;
  canSkip: boolean;
  canRepeat: boolean;
  
  // Metrics
  metrics: {
    started: number;
    completed: number;
    completionRate: number;
    averageStepsCompleted: number;
    skipRate: number;
  };
}

/**
 * Tooltip configuration for contextual help
 */
export interface Tooltip {
  id: string;
  targetElement: string; // CSS selector or component identifier
  
  // Content
  title?: string;
  content: string;
  
  // Display
  position: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger: 'hover' | 'click' | 'focus' | 'auto' | 'first_visit';
  
  // Behavior
  autoHide: boolean;
  hideDelay?: number; // milliseconds
  showOnce: boolean;
  
  // Targeting
  targetUserSegment?: {
    isNewUser?: boolean;
    subscriptionTiers?: SubscriptionTier[];
    hasNotUsedFeature?: string;
  };
  
  // Settings
  isActive: boolean;
  
  // Metrics
  metrics: {
    shown: number;
    clicked: number;
    helpfulness: number; // Average rating if feedback enabled
  };
}

/**
 * Comprehensive growth features service for user engagement and retention
 * 
 * Key Features:
 * - Push notification campaigns with targeting
 * - In-app messaging system
 * - NPS surveys and feedback collection
 * - Achievement and gamification system
 * - Product tours and tooltips
 * - User segmentation for targeted campaigns
 * - A/B testing support
 * - Analytics integration for optimization
 */
class GrowthFeaturesService {
  private apiService: ApiService;
  private activeCampaigns: Map<string, PushNotificationCampaign> = new Map();
  private inAppMessages: Map<string, InAppMessage> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement[]> = new Map();

  // Storage keys for offline persistence
  private readonly STORAGE_KEYS = {
    PUSH_CAMPAIGNS: 'push_campaigns',
    IN_APP_MESSAGES: 'in_app_messages',
    USER_ACHIEVEMENTS: 'user_achievements',
    TOOLTIPS_SHOWN: 'tooltips_shown',
    TOURS_COMPLETED: 'tours_completed'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.initializeDefaultAchievements();
  }

  /**
   * Initialize default achievements
   */
  private initializeDefaultAchievements(): void {
    // First scan achievement
    this.achievements.set('first_scan', {
      id: 'first_scan',
      name: 'Getting Started',
      description: 'Complete your first website scan',
      category: 'milestone',
      requirements: {
        type: 'count',
        target: 1,
        timeframe: 'all_time'
      },
      iconUrl: 'achievement_first_scan.png',
      badgeColor: '#10B981',
      rarity: 'common',
      isActive: true,
      isHidden: false,
      metrics: {
        unlocked: 0,
        uniqueUsers: 0,
        averageDaysToUnlock: 0
      }
    });

    // Power user achievement
    this.achievements.set('power_user', {
      id: 'power_user',
      name: 'Power User',
      description: 'Complete 100 scans',
      category: 'usage',
      requirements: {
        type: 'count',
        target: 100,
        timeframe: 'all_time'
      },
      iconUrl: 'achievement_power_user.png',
      badgeColor: '#3B82F6',
      rarity: 'rare',
      rewards: {
        type: 'discount',
        value: 25,
        duration: 30
      },
      isActive: true,
      isHidden: false,
      metrics: {
        unlocked: 0,
        uniqueUsers: 0,
        averageDaysToUnlock: 0
      }
    });

    // Streak achievement
    this.achievements.set('weekly_warrior', {
      id: 'weekly_warrior',
      name: 'Weekly Warrior',
      description: 'Use RapidTriage for 7 days in a row',
      category: 'streak',
      requirements: {
        type: 'streak',
        target: 7,
        timeframe: 'daily'
      },
      iconUrl: 'achievement_streak.png',
      badgeColor: '#F59E0B',
      rarity: 'epic',
      rewards: {
        type: 'premium_trial',
        duration: 3
      },
      isActive: true,
      isHidden: false,
      metrics: {
        unlocked: 0,
        uniqueUsers: 0,
        averageDaysToUnlock: 7
      }
    });
  }

  /**
   * Send push notification to user
   */
  async sendPushNotification(
    userId: string,
    campaignId: string,
    personalizedContent?: {
      title?: string;
      body?: string;
    }
  ): Promise<boolean> {
    try {
      const campaign = this.activeCampaigns.get(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check if user should receive this notification
      const shouldSend = await this.shouldSendNotification(userId, campaign);
      if (!shouldSend) {
        return false;
      }

      // Send notification
      const notificationData = {
        title: personalizedContent?.title || campaign.title,
        body: personalizedContent?.body || campaign.body,
        icon: campaign.icon,
        image: campaign.image,
        sound: campaign.sound,
        badge: campaign.badge,
        data: {
          campaignId,
          deepLink: campaign.deepLink,
          externalUrl: campaign.externalUrl
        }
      };

      await this.apiService.post('/push-notifications/send', {
        userId,
        campaignId,
        notification: notificationData,
        timestamp: new Date().toISOString()
      });

      // Track notification sent
      await analyticsService.track(
        GrowthFeatureEventType.PUSH_NOTIFICATION_SENT,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          campaignId,
          notificationType: campaign.type
        }
      );

      // Update campaign metrics
      campaign.metrics.sent++;

      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Show in-app message to user
   */
  async showInAppMessage(
    userId: string,
    messageId: string,
    context?: any
  ): Promise<string | null> {
    try {
      const message = this.inAppMessages.get(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Check if message should be shown
      const shouldShow = await this.shouldShowInAppMessage(userId, message, context);
      if (!shouldShow) {
        return null;
      }

      // Track message shown
      await analyticsService.track(
        GrowthFeatureEventType.IN_APP_MESSAGE_SHOWN,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          messageId,
          messageType: message.type,
          context
        }
      );

      // Update message metrics
      message.metrics.shown++;

      // Return message data for display
      return messageId;
    } catch (error) {
      console.error('Failed to show in-app message:', error);
      return null;
    }
  }

  /**
   * Handle in-app message interaction
   */
  async handleInAppMessageInteraction(
    userId: string,
    messageId: string,
    actionId: string,
    context?: any
  ): Promise<void> {
    try {
      const message = this.inAppMessages.get(messageId);
      if (!message) return;

      const action = message.actions.find(a => a.id === actionId);
      if (!action) return;

      // Track interaction
      await analyticsService.track(
        GrowthFeatureEventType.IN_APP_MESSAGE_CLICKED,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          messageId,
          actionId,
          actionType: action.type,
          context
        }
      );

      // Update message metrics
      message.metrics.clicked++;

      // Handle action
      if (action.trackingId) {
        // Track conversion if applicable
        message.metrics.conversions++;
        message.metrics.conversionRate = (message.metrics.conversions / message.metrics.shown) * 100;
      }

      // Send to backend
      await this.apiService.post('/in-app-messages/interaction', {
        userId,
        messageId,
        actionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to handle in-app message interaction:', error);
    }
  }

  /**
   * Show NPS survey to user
   */
  async showNPSSurvey(userId: string, surveyId: string): Promise<boolean> {
    try {
      // Check if user should see survey
      const shouldShow = await this.shouldShowNPSSurvey(userId, surveyId);
      if (!shouldShow) {
        return false;
      }

      // Track survey shown
      await analyticsService.track(
        GrowthFeatureEventType.NPS_SURVEY_SHOWN,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          surveyId
        }
      );

      // Send to backend
      await this.apiService.post('/nps-surveys/show', {
        userId,
        surveyId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to show NPS survey:', error);
      return false;
    }
  }

  /**
   * Submit NPS survey response
   */
  async submitNPSResponse(
    userId: string,
    surveyId: string,
    score: number,
    feedback?: string
  ): Promise<boolean> {
    try {
      // Validate score
      if (score < 0 || score > 10) {
        throw new Error('Invalid NPS score');
      }

      // Determine user type
      let userType: 'detractor' | 'passive' | 'promoter';
      if (score <= 6) {
        userType = 'detractor';
      } else if (score <= 8) {
        userType = 'passive';
      } else {
        userType = 'promoter';
      }

      // Track response
      await analyticsService.track(
        GrowthFeatureEventType.NPS_SURVEY_COMPLETED,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          surveyId,
          score,
          userType,
          hasFeedback: !!feedback
        }
      );

      // Submit to backend
      await this.apiService.post('/nps-surveys/submit', {
        userId,
        surveyId,
        score,
        feedback,
        userType,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to submit NPS response:', error);
      return false;
    }
  }

  /**
   * Check achievement progress for user
   */
  async checkAchievementProgress(
    userId: string,
    eventType: string,
    eventData?: any
  ): Promise<string[]> {
    try {
      const unlockedAchievements: string[] = [];
      const userAchievements = await this.getUserAchievements(userId);

      for (const [achievementId, achievement] of this.achievements) {
        if (!achievement.isActive) continue;

        let userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
        if (!userAchievement) {
          userAchievement = {
            userId,
            achievementId,
            progress: 0,
            target: achievement.requirements.target,
            isUnlocked: false,
            currentStreak: 0
          };
          userAchievements.push(userAchievement);
        }

        if (userAchievement.isUnlocked) continue;

        // Update progress based on event
        const progressUpdated = await this.updateAchievementProgress(
          userAchievement,
          achievement,
          eventType,
          eventData
        );

        if (progressUpdated && userAchievement.progress >= userAchievement.target) {
          // Achievement unlocked!
          userAchievement.isUnlocked = true;
          userAchievement.unlockedAt = new Date().toISOString();
          
          unlockedAchievements.push(achievementId);

          // Track achievement unlock
          await analyticsService.track(
            GrowthFeatureEventType.ACHIEVEMENT_UNLOCKED,
            AnalyticsEventCategory.ENGAGEMENT,
            {
              userId,
              achievementId,
              achievementName: achievement.name,
              category: achievement.category,
              rarity: achievement.rarity
            }
          );

          // Apply rewards if any
          if (achievement.rewards) {
            await this.applyAchievementReward(userId, achievement.rewards);
          }
        }
      }

      // Save updated achievements
      await this.saveUserAchievements(userId, userAchievements);

      return unlockedAchievements;
    } catch (error) {
      console.error('Failed to check achievement progress:', error);
      return [];
    }
  }

  /**
   * Start product tour for user
   */
  async startProductTour(
    userId: string,
    tourId: string,
    context?: any
  ): Promise<boolean> {
    try {
      // Check if user should see tour
      const shouldShow = await this.shouldShowProductTour(userId, tourId, context);
      if (!shouldShow) {
        return false;
      }

      // Track tour start
      await analyticsService.track(
        GrowthFeatureEventType.PRODUCT_TOUR_STARTED,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          tourId,
          context
        }
      );

      // Send to backend
      await this.apiService.post('/product-tours/start', {
        userId,
        tourId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to start product tour:', error);
      return false;
    }
  }

  /**
   * Complete product tour
   */
  async completeProductTour(
    userId: string,
    tourId: string,
    stepsCompleted: number,
    totalSteps: number
  ): Promise<void> {
    try {
      // Track tour completion
      await analyticsService.track(
        GrowthFeatureEventType.PRODUCT_TOUR_COMPLETED,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          tourId,
          stepsCompleted,
          totalSteps,
          completionRate: (stepsCompleted / totalSteps) * 100
        }
      );

      // Send to backend
      await this.apiService.post('/product-tours/complete', {
        userId,
        tourId,
        stepsCompleted,
        totalSteps,
        timestamp: new Date().toISOString()
      });

      // Save completed tour
      const completedTours = await this.getCompletedTours(userId);
      completedTours.push({
        tourId,
        completedAt: new Date().toISOString(),
        stepsCompleted,
        totalSteps
      });
      
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.TOURS_COMPLETED}_${userId}`,
        JSON.stringify(completedTours)
      );
    } catch (error) {
      console.error('Failed to complete product tour:', error);
    }
  }

  /**
   * Show tooltip to user
   */
  async showTooltip(
    userId: string,
    tooltipId: string,
    context?: any
  ): Promise<boolean> {
    try {
      // Check if tooltip should be shown
      const shouldShow = await this.shouldShowTooltip(userId, tooltipId);
      if (!shouldShow) {
        return false;
      }

      // Track tooltip shown
      await analyticsService.track(
        GrowthFeatureEventType.TOOLTIP_SHOWN,
        AnalyticsEventCategory.ENGAGEMENT,
        {
          userId,
          tooltipId,
          context
        }
      );

      // Mark tooltip as shown
      const shownTooltips = await this.getShownTooltips(userId);
      if (!shownTooltips.includes(tooltipId)) {
        shownTooltips.push(tooltipId);
        await AsyncStorage.setItem(
          `${this.STORAGE_KEYS.TOOLTIPS_SHOWN}_${userId}`,
          JSON.stringify(shownTooltips)
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to show tooltip:', error);
      return false;
    }
  }

  // Private helper methods

  private async shouldSendNotification(
    userId: string,
    campaign: PushNotificationCampaign
  ): Promise<boolean> {
    // Implementation would check targeting criteria, frequency limits, etc.
    return campaign.isActive;
  }

  private async shouldShowInAppMessage(
    userId: string,
    message: InAppMessage,
    context?: any
  ): Promise<boolean> {
    // Implementation would check targeting criteria, display rules, etc.
    return message.isActive;
  }

  private async shouldShowNPSSurvey(userId: string, surveyId: string): Promise<boolean> {
    // Implementation would check if user is eligible for survey
    return true;
  }

  private async shouldShowProductTour(
    userId: string,
    tourId: string,
    context?: any
  ): Promise<boolean> {
    // Check if tour was already completed
    const completedTours = await this.getCompletedTours(userId);
    return !completedTours.some(tour => tour.tourId === tourId);
  }

  private async shouldShowTooltip(userId: string, tooltipId: string): Promise<boolean> {
    // Check if tooltip was already shown
    const shownTooltips = await this.getShownTooltips(userId);
    return !shownTooltips.includes(tooltipId);
  }

  private async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      if (this.userAchievements.has(userId)) {
        return this.userAchievements.get(userId)!;
      }

      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.USER_ACHIEVEMENTS}_${userId}`);
      if (stored) {
        const achievements = JSON.parse(stored);
        this.userAchievements.set(userId, achievements);
        return achievements;
      }

      return [];
    } catch (error) {
      console.error('Failed to get user achievements:', error);
      return [];
    }
  }

  private async saveUserAchievements(userId: string, achievements: UserAchievement[]): Promise<void> {
    try {
      this.userAchievements.set(userId, achievements);
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.USER_ACHIEVEMENTS}_${userId}`,
        JSON.stringify(achievements)
      );
    } catch (error) {
      console.error('Failed to save user achievements:', error);
    }
  }

  private async updateAchievementProgress(
    userAchievement: UserAchievement,
    achievement: Achievement,
    eventType: string,
    eventData?: any
  ): Promise<boolean> {
    // This would contain logic to update progress based on the event type
    // and achievement requirements. For now, simplified implementation:
    
    if (eventType === 'scan_completed' && achievement.id === 'first_scan') {
      userAchievement.progress = Math.min(userAchievement.progress + 1, userAchievement.target);
      return true;
    }
    
    if (eventType === 'scan_completed' && achievement.id === 'power_user') {
      userAchievement.progress = Math.min(userAchievement.progress + 1, userAchievement.target);
      return true;
    }
    
    if (eventType === 'daily_usage' && achievement.id === 'weekly_warrior') {
      const today = new Date().toDateString();
      const lastActivity = userAchievement.lastActivityAt ? new Date(userAchievement.lastActivityAt).toDateString() : null;
      
      if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActivity === yesterday.toDateString()) {
          // Continue streak
          userAchievement.currentStreak = (userAchievement.currentStreak || 0) + 1;
        } else {
          // Reset streak
          userAchievement.currentStreak = 1;
        }
        
        userAchievement.progress = userAchievement.currentStreak || 0;
        userAchievement.lastActivityAt = new Date().toISOString();
        
        return true;
      }
    }
    
    return false;
  }

  private async applyAchievementReward(
    userId: string,
    reward: Achievement['rewards']
  ): Promise<void> {
    if (!reward) return;

    try {
      await this.apiService.post('/achievements/apply-reward', {
        userId,
        reward,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to apply achievement reward:', error);
    }
  }

  private async getCompletedTours(userId: string): Promise<Array<{
    tourId: string;
    completedAt: string;
    stepsCompleted: number;
    totalSteps: number;
  }>> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.TOURS_COMPLETED}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get completed tours:', error);
      return [];
    }
  }

  private async getShownTooltips(userId: string): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.TOOLTIPS_SHOWN}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get shown tooltips:', error);
      return [];
    }
  }
}

// Export singleton instance
const apiService = new (require('../api/api.service').ApiService)();
export const growthFeaturesService = new GrowthFeaturesService(apiService);
export default growthFeaturesService;