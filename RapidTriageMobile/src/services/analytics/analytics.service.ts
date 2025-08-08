import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { SubscriptionTier } from '../payment/payment.service';
import { UsageEventType } from '../usage/usage.service';
import { ENABLE_ANALYTICS } from '@env';

/**
 * Analytics event categories for organized tracking
 */
export enum AnalyticsEventCategory {
  MONETIZATION = 'monetization',
  USER_BEHAVIOR = 'user_behavior',
  FEATURE_USAGE = 'feature_usage',
  CONVERSION = 'conversion',
  ENGAGEMENT = 'engagement',
  ERROR = 'error',
  PERFORMANCE = 'performance'
}

/**
 * Conversion funnel stages for tracking user journey
 */
export enum ConversionFunnelStage {
  AWARENESS = 'awareness',
  INTEREST = 'interest',
  CONSIDERATION = 'consideration',
  PURCHASE = 'purchase',
  RETENTION = 'retention',
  ADVOCACY = 'advocacy'
}

/**
 * Analytics event structure
 * Standardized format for all tracked events
 */
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  eventName: string;
  category: AnalyticsEventCategory;
  timestamp: Date;
  properties: Record<string, any>;
  userProperties?: Record<string, any>;
  deviceInfo?: {
    platform: string;
    version: string;
    model: string;
    screenResolution: string;
  };
  appInfo?: {
    version: string;
    buildNumber: string;
    environment: string;
  };
  synced: boolean;
}

/**
 * Conversion event specific structure
 * Tracks monetization and upgrade funnel events
 */
export interface ConversionEvent extends AnalyticsEvent {
  conversionType: 'subscription_started' | 'subscription_upgraded' | 'subscription_cancelled' | 
                  'paywall_shown' | 'paywall_dismissed' | 'upgrade_clicked' | 'trial_started';
  funnelStage: ConversionFunnelStage;
  revenue?: number; // In cents
  subscriptionTier?: SubscriptionTier;
  previousTier?: SubscriptionTier;
  triggeredBy?: UsageEventType;
  experimentVariant?: string; // For A/B testing
}

/**
 * User journey tracking for conversion optimization
 */
export interface UserJourney {
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  touchpoints: Array<{
    timestamp: Date;
    event: string;
    properties: Record<string, any>;
  }>;
  conversionEvents: ConversionEvent[];
  finalOutcome?: 'converted' | 'churned' | 'active';
}

/**
 * A/B test configuration for conversion optimization
 */
export interface ExperimentConfig {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number; // Percentage allocation
    config: Record<string, any>;
  }>;
  targetAudience?: {
    subscriptionTiers?: SubscriptionTier[];
    usageLevel?: 'low' | 'medium' | 'high';
    daysSinceRegistration?: number;
  };
  isActive: boolean;
}

/**
 * Analytics configuration options
 */
export interface AnalyticsConfig {
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  batchSize: number;
  flushInterval: number; // milliseconds
  enableDebugLogging: boolean;
  enableOfflineQueuing: boolean;
  maxQueueSize: number;
  enableUserJourneyTracking: boolean;
  enableConversionTracking: boolean;
}

/**
 * Comprehensive analytics service for conversion tracking and user behavior analysis
 * 
 * Key features:
 * - Conversion funnel tracking with detailed attribution
 * - A/B testing framework for optimization experiments
 * - User journey mapping for behavior analysis
 * - Revenue tracking and subscription analytics
 * - Offline event queuing with batch sync
 * - Privacy-compliant data collection
 * - Real-time experiment delivery
 * - Custom event tracking with rich metadata
 */
class AnalyticsService {
  private apiService: ApiService;
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private currentExperiments: Map<string, ExperimentConfig> = new Map();
  private userJourney: UserJourney | null = null;
  private isEnabled: boolean;

  // Storage keys for offline persistence
  private readonly STORAGE_KEYS = {
    EVENT_QUEUE: 'analytics_event_queue',
    SESSION_ID: 'analytics_session_id',
    USER_PROPERTIES: 'analytics_user_properties',
    EXPERIMENTS: 'analytics_experiments',
    JOURNEY: 'analytics_user_journey'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.isEnabled = ENABLE_ANALYTICS === 'true';
    
    // Default configuration
    this.config = {
      enableAnalytics: this.isEnabled,
      enableCrashReporting: true,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      enableDebugLogging: __DEV__,
      enableOfflineQueuing: true,
      maxQueueSize: 1000,
      enableUserJourneyTracking: true,
      enableConversionTracking: true
    };

    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  /**
   * Initialize analytics service
   * Sets up offline queuing, session tracking, and experiment loading
   */
  private async initializeAnalytics(): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      // Load queued events from storage
      await this.loadQueuedEvents();
      
      // Start session tracking
      this.startSession();
      
      // Load active experiments
      await this.loadExperiments();
      
      // Start periodic flush timer
      this.startFlushTimer();
      
      // Track app session start
      this.track('app_session_start', AnalyticsEventCategory.USER_BEHAVIOR, {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });

      console.log('Analytics service initialized successfully');
    } catch (error) {
      console.error('Analytics initialization error:', error);
    }
  }

  /**
   * Track a general analytics event
   * 
   * @param eventName - Name of the event
   * @param category - Event category for organization
   * @param properties - Event-specific properties
   * @param userProperties - User-level properties to update
   */
  async track(
    eventName: string,
    category: AnalyticsEventCategory,
    properties: Record<string, any> = {},
    userProperties?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      const event: AnalyticsEvent = {
        id: this.generateEventId(),
        userId: properties.userId,
        sessionId: this.sessionId,
        eventName,
        category,
        timestamp: new Date(),
        properties: {
          ...properties,
          sessionId: this.sessionId
        },
        userProperties,
        deviceInfo: await this.getDeviceInfo(),
        appInfo: this.getAppInfo(),
        synced: false
      };

      // Add to queue
      this.eventQueue.push(event);
      
      // Update user journey if enabled
      if (this.config.enableUserJourneyTracking) {
        this.updateUserJourney(event);
      }

      // Log in debug mode
      if (this.config.enableDebugLogging) {
        console.log('Analytics Event:', eventName, properties);
      }

      // Flush immediately for critical events
      const criticalEvents = ['subscription_started', 'payment_failed', 'app_crash'];
      if (criticalEvents.includes(eventName)) {
        await this.flush();
      }

      // Auto-flush if queue is large
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flush();
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Track conversion events specifically
   * Specialized tracking for monetization and subscription events
   * 
   * @param conversionType - Type of conversion event
   * @param funnelStage - Stage in the conversion funnel
   * @param properties - Event properties
   */
  async trackConversion(
    conversionType: ConversionEvent['conversionType'],
    funnelStage: ConversionFunnelStage,
    properties: {
      revenue?: number;
      subscriptionTier?: SubscriptionTier;
      previousTier?: SubscriptionTier;
      triggeredBy?: UsageEventType;
      experimentVariant?: string;
      [key: string]: any;
    } = {}
  ): Promise<void> {
    if (!this.config.enableConversionTracking) return;

    const conversionEvent: ConversionEvent = {
      id: this.generateEventId(),
      userId: properties.userId,
      sessionId: this.sessionId,
      eventName: `conversion_${conversionType}`,
      category: AnalyticsEventCategory.CONVERSION,
      timestamp: new Date(),
      properties,
      conversionType,
      funnelStage,
      revenue: properties.revenue,
      subscriptionTier: properties.subscriptionTier,
      previousTier: properties.previousTier,
      triggeredBy: properties.triggeredBy,
      experimentVariant: properties.experimentVariant,
      deviceInfo: await this.getDeviceInfo(),
      appInfo: this.getAppInfo(),
      synced: false
    };

    this.eventQueue.push(conversionEvent);

    // Update user journey with conversion event
    if (this.userJourney) {
      this.userJourney.conversionEvents.push(conversionEvent);
      await this.saveUserJourney();
    }

    // Log conversion in debug mode
    if (this.config.enableDebugLogging) {
      console.log('Conversion Event:', conversionType, funnelStage, properties);
    }

    // Flush conversion events immediately for real-time tracking
    await this.flush();
  }

  /**
   * Track paywall interactions for optimization
   */
  async trackPaywallInteraction(
    action: 'shown' | 'dismissed' | 'upgrade_clicked' | 'plan_selected',
    properties: {
      triggeredBy?: UsageEventType;
      currentTier: SubscriptionTier;
      selectedTier?: SubscriptionTier;
      position?: string; // Where the paywall was shown
      variant?: string; // A/B test variant
      timeToAction?: number; // Milliseconds
      [key: string]: any;
    }
  ): Promise<void> {
    await this.track(
      `paywall_${action}`,
      AnalyticsEventCategory.CONVERSION,
      {
        ...properties,
        event_type: 'paywall_interaction'
      }
    );

    // Track as conversion event if it's an upgrade click
    if (action === 'upgrade_clicked') {
      await this.trackConversion(
        'upgrade_clicked',
        ConversionFunnelStage.CONSIDERATION,
        properties
      );
    }
  }

  /**
   * Track subscription lifecycle events
   */
  async trackSubscriptionEvent(
    eventType: 'started' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed' | 'expired',
    properties: {
      subscriptionTier: SubscriptionTier;
      previousTier?: SubscriptionTier;
      revenue?: number;
      paymentMethod?: string;
      isTrialToSubscription?: boolean;
      cancellationReason?: string;
      [key: string]: any;
    }
  ): Promise<void> {
    const funnelStageMap = {
      started: ConversionFunnelStage.PURCHASE,
      upgraded: ConversionFunnelStage.PURCHASE,
      downgraded: ConversionFunnelStage.RETENTION,
      cancelled: ConversionFunnelStage.RETENTION,
      renewed: ConversionFunnelStage.RETENTION,
      expired: ConversionFunnelStage.RETENTION
    };

    await this.trackConversion(
      `subscription_${eventType}` as ConversionEvent['conversionType'],
      funnelStageMap[eventType],
      properties
    );
  }

  /**
   * Track feature usage for product insights
   */
  async trackFeatureUsage(
    featureName: string,
    action: 'accessed' | 'blocked' | 'completed' | 'abandoned',
    properties: {
      subscriptionTier: SubscriptionTier;
      usageLimit?: number;
      currentUsage?: number;
      timeSpent?: number;
      success?: boolean;
      [key: string]: any;
    }
  ): Promise<void> {
    await this.track(
      `feature_${action}`,
      AnalyticsEventCategory.FEATURE_USAGE,
      {
        ...properties,
        feature_name: featureName
      }
    );

    // Track blocked features as potential conversion opportunities
    if (action === 'blocked') {
      await this.track(
        'conversion_opportunity',
        AnalyticsEventCategory.CONVERSION,
        {
          ...properties,
          feature_name: featureName,
          reason: 'feature_blocked'
        }
      );
    }
  }

  /**
   * Set user properties for segmentation
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PROPERTIES,
        JSON.stringify(properties)
      );

      // Include user properties in next event
      this.track('user_properties_updated', AnalyticsEventCategory.USER_BEHAVIOR, {}, properties);
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Start or update user journey tracking
   */
  async startUserJourney(userId: string): Promise<void> {
    if (!this.config.enableUserJourneyTracking) return;

    this.userJourney = {
      userId,
      sessionId: this.sessionId,
      startTime: new Date(),
      touchpoints: [],
      conversionEvents: [],
    };

    await this.saveUserJourney();
  }

  /**
   * End user journey with outcome
   */
  async endUserJourney(outcome: 'converted' | 'churned' | 'active'): Promise<void> {
    if (!this.userJourney) return;

    this.userJourney.endTime = new Date();
    this.userJourney.finalOutcome = outcome;

    // Track journey completion
    await this.track(
      'user_journey_completed',
      AnalyticsEventCategory.USER_BEHAVIOR,
      {
        userId: this.userJourney.userId,
        duration: this.userJourney.endTime.getTime() - this.userJourney.startTime.getTime(),
        touchpoints: this.userJourney.touchpoints.length,
        conversions: this.userJourney.conversionEvents.length,
        outcome
      }
    );

    await this.saveUserJourney();
  }

  /**
   * Get experiment variant for A/B testing
   */
  async getExperimentVariant(experimentId: string, userId?: string): Promise<string | null> {
    const experiment = this.currentExperiments.get(experimentId);
    if (!experiment || !experiment.isActive) {
      return null;
    }

    try {
      // Check if user is in target audience
      if (experiment.targetAudience && userId) {
        const isEligible = await this.checkExperimentEligibility(experiment, userId);
        if (!isEligible) {
          return null;
        }
      }

      // Assign variant based on weights
      const random = Math.random() * 100;
      let cumulativeWeight = 0;

      for (const variant of experiment.variants) {
        cumulativeWeight += variant.weight;
        if (random <= cumulativeWeight) {
          // Track experiment exposure
          await this.track(
            'experiment_exposure',
            AnalyticsEventCategory.CONVERSION,
            {
              experimentId,
              variantId: variant.id,
              userId
            }
          );

          return variant.id;
        }
      }

      return null;
    } catch (error) {
      console.error('Experiment variant assignment error:', error);
      return null;
    }
  }

  /**
   * Flush queued events to server
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];

      // Send events to server
      await this.apiService.post('/analytics/events', {
        events: eventsToFlush,
        sessionId: this.sessionId
      });

      // Mark events as synced
      eventsToFlush.forEach(event => {
        event.synced = true;
      });

      if (this.config.enableDebugLogging) {
        console.log(`Flushed ${eventsToFlush.length} analytics events`);
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      
      // Re-queue events if flush failed
      this.eventQueue.unshift(...this.eventQueue);
      
      // Save to storage for offline support
      if (this.config.enableOfflineQueuing) {
        await this.saveQueuedEvents();
      }
    }
  }

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean): void {
    this.config.enableAnalytics = enabled;
    
    if (!enabled) {
      // Clear queued events and stop timer
      this.eventQueue = [];
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
    } else {
      // Restart analytics
      this.initializeAnalytics();
    }
  }

  // Private helper methods

  private async updateUserJourney(event: AnalyticsEvent): Promise<void> {
    if (!this.userJourney) return;

    this.userJourney.touchpoints.push({
      timestamp: event.timestamp,
      event: event.eventName,
      properties: event.properties
    });

    // Limit touchpoints to prevent excessive memory usage
    if (this.userJourney.touchpoints.length > 100) {
      this.userJourney.touchpoints = this.userJourney.touchpoints.slice(-100);
    }

    await this.saveUserJourney();
  }

  private async saveUserJourney(): Promise<void> {
    if (!this.userJourney) return;

    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.JOURNEY,
        JSON.stringify(this.userJourney)
      );
    } catch (error) {
      console.error('Failed to save user journey:', error);
    }
  }

  private async loadQueuedEvents(): Promise<void> {
    if (!this.config.enableOfflineQueuing) return;

    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.EVENT_QUEUE);
      if (stored) {
        this.eventQueue = JSON.parse(stored);
        console.log(`Loaded ${this.eventQueue.length} queued events`);
      }
    } catch (error) {
      console.error('Failed to load queued events:', error);
    }
  }

  private async saveQueuedEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.EVENT_QUEUE,
        JSON.stringify(this.eventQueue)
      );
    } catch (error) {
      console.error('Failed to save queued events:', error);
    }
  }

  private async loadExperiments(): Promise<void> {
    try {
      const experiments = await this.apiService.get('/analytics/experiments');
      
      experiments.forEach((experiment: ExperimentConfig) => {
        this.currentExperiments.set(experiment.id, experiment);
      });

      console.log(`Loaded ${experiments.length} active experiments`);
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  private async checkExperimentEligibility(
    experiment: ExperimentConfig, 
    userId: string
  ): Promise<boolean> {
    // Implementation would check user properties against target audience
    // This is a simplified version
    return true;
  }

  private startSession(): void {
    this.sessionId = this.generateSessionId();
    
    // Save session ID
    AsyncStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this.sessionId);
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceInfo(): Promise<any> {
    // This would typically use react-native-device-info
    // For now, return basic info
    return {
      platform: 'react-native',
      version: '1.0.0',
      model: 'unknown',
      screenResolution: 'unknown'
    };
  }

  private getAppInfo(): any {
    return {
      version: '1.0.0',
      buildNumber: '1',
      environment: __DEV__ ? 'development' : 'production'
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(new (require('../api/api.service').ApiService)());
export default analyticsService;