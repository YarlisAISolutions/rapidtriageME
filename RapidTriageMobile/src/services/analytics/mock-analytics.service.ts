/**
 * Mock Analytics Service
 * Provides mock analytics functionality for testing and development
 * Simulates user behavior tracking, performance metrics, and reporting
 */

import { TestUtils } from '../../utils/test-config';

/**
 * Analytics event structure
 * Defines the format for tracking user interactions and system events
 */
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * User properties for analytics segmentation
 * Tracks user characteristics for targeted analysis
 */
export interface UserProperties {
  userId: string;
  email?: string;
  subscriptionTier?: string;
  registrationDate?: string;
  lastActiveDate?: string;
  totalScans?: number;
}

/**
 * Performance metrics tracking
 * Monitors app performance and user experience indicators
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: Record<string, any>;
}

/**
 * Mock Analytics Service Implementation
 * Provides comprehensive analytics simulation for testing
 */
export class MockAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private userProperties: UserProperties | null = null;
  private sessionId: string;
  private isInitialized = false;

  constructor() {
    this.sessionId = 'session-' + Date.now();
    console.log('🧪 Mock Analytics Service initialized with session:', this.sessionId);
  }

  /**
   * Initialize analytics service
   * Sets up mock analytics tracking and configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🧪 Initializing Mock Analytics');
    await TestUtils.createMockDelay('api');

    // Simulate analytics SDK initialization
    this.isInitialized = true;
    
    // Track initialization event
    await this.trackEvent('analytics_initialized', {
      version: '1.0.0',
      platform: 'mobile',
      testMode: true
    });

    console.log('🧪 Mock Analytics initialized successfully');
  }

  /**
   * Track user event
   * Records user interactions and behaviors for analysis
   */
  async trackEvent(eventName: string, parameters?: Record<string, any>): Promise<void> {
    if (!TestUtils.isTestMode()) {
      // In production, this would send to real analytics service
      return;
    }

    const event: AnalyticsEvent = {
      name: eventName,
      parameters: {
        ...parameters,
        sessionId: this.sessionId,
        testMode: true,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      userId: this.userProperties?.userId,
      sessionId: this.sessionId
    };

    this.events.push(event);
    
    console.log('🧪 Mock Analytics Event:', {
      event: eventName,
      parameters: parameters,
      sessionId: this.sessionId
    });

    // Simulate network delay
    await TestUtils.createMockDelay('api');
  }

  /**
   * Set user properties
   * Updates user characteristics for analytics segmentation
   */
  async setUserProperties(properties: Partial<UserProperties>): Promise<void> {
    this.userProperties = {
      ...this.userProperties,
      ...properties
    } as UserProperties;

    console.log('🧪 Mock Analytics User Properties Updated:', properties);

    await this.trackEvent('user_properties_updated', {
      updatedProperties: Object.keys(properties)
    });
  }

  /**
   * Track screen view
   * Records navigation and screen engagement
   */
  async trackScreenView(screenName: string, screenClass?: string): Promise<void> {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
      previous_screen: this.getPreviousScreen()
    });
  }

  /**
   * Track user login
   * Records authentication events and user sessions
   */
  async trackLogin(method: string, userId: string): Promise<void> {
    await this.setUserProperties({ userId, lastActiveDate: new Date().toISOString() });
    
    await this.trackEvent('login', {
      method,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track user logout
   * Records session end and cleanup
   */
  async trackLogout(userId: string): Promise<void> {
    await this.trackEvent('logout', {
      userId,
      sessionDuration: this.getSessionDuration(),
      timestamp: new Date().toISOString()
    });

    // Clear user properties on logout
    this.userProperties = null;
  }

  /**
   * Track scan initiation
   * Records when users start website scans
   */
  async trackScanStarted(url: string, scanType?: string): Promise<void> {
    await this.trackEvent('scan_started', {
      url,
      scan_type: scanType || 'full',
      user_tier: this.userProperties?.subscriptionTier || 'free'
    });
  }

  /**
   * Track scan completion
   * Records successful scan results and performance
   */
  async trackScanCompleted(url: string, duration: number, results: any): Promise<void> {
    await this.trackEvent('scan_completed', {
      url,
      duration_ms: duration,
      performance_score: results?.performance?.score,
      accessibility_score: results?.accessibility?.score,
      seo_score: results?.seo?.score,
      best_practices_score: results?.bestPractices?.score,
      success: true
    });
  }

  /**
   * Track scan failure
   * Records failed scans for debugging and improvement
   */
  async trackScanFailed(url: string, error: string, duration?: number): Promise<void> {
    await this.trackEvent('scan_failed', {
      url,
      error_message: error,
      duration_ms: duration,
      success: false
    });
  }

  /**
   * Track subscription events
   * Records subscription changes and upgrade flows
   */
  async trackSubscriptionEvent(event: 'upgraded' | 'downgraded' | 'cancelled' | 'renewed', tier: string): Promise<void> {
    await this.trackEvent('subscription_' + event, {
      tier,
      timestamp: new Date().toISOString(),
      user_id: this.userProperties?.userId
    });
  }

  /**
   * Track feature usage
   * Records which app features are being used
   */
  async trackFeatureUsage(feature: string, action: string, context?: Record<string, any>): Promise<void> {
    await this.trackEvent('feature_used', {
      feature,
      action,
      ...context
    });
  }

  /**
   * Track performance metrics
   * Records app performance data for optimization
   */
  async trackPerformance(metric: PerformanceMetric): Promise<void> {
    await this.trackEvent('performance_metric', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit,
      ...metric.context
    });
  }

  /**
   * Track error events
   * Records application errors for debugging
   */
  async trackError(error: Error, context?: Record<string, any>): Promise<void> {
    await this.trackEvent('error_occurred', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context
    });
  }

  /**
   * Track conversion events
   * Records key business metrics and user conversions
   */
  async trackConversion(conversionType: string, value?: number, currency?: string): Promise<void> {
    await this.trackEvent('conversion', {
      conversion_type: conversionType,
      value,
      currency,
      user_tier: this.userProperties?.subscriptionTier
    });
  }

  /**
   * Get analytics summary
   * Returns summary of tracked events for debugging
   */
  getAnalyticsSummary(): {
    totalEvents: number;
    uniqueEventTypes: string[];
    sessionDuration: number;
    userProperties: UserProperties | null;
    recentEvents: AnalyticsEvent[];
  } {
    const uniqueEventTypes = [...new Set(this.events.map(e => e.name))];
    const recentEvents = this.events.slice(-10); // Last 10 events

    return {
      totalEvents: this.events.length,
      uniqueEventTypes,
      sessionDuration: this.getSessionDuration(),
      userProperties: this.userProperties,
      recentEvents
    };
  }

  /**
   * Export analytics data
   * Returns all tracked data for testing and debugging
   */
  exportAnalyticsData(): {
    events: AnalyticsEvent[];
    userProperties: UserProperties | null;
    sessionId: string;
    sessionStartTime: string;
  } {
    return {
      events: this.events,
      userProperties: this.userProperties,
      sessionId: this.sessionId,
      sessionStartTime: new Date().toISOString()
    };
  }

  /**
   * Clear analytics data
   * Resets all tracked data (useful for testing)
   */
  clearAnalyticsData(): void {
    console.log('🧪 Clearing Mock Analytics Data');
    this.events = [];
    this.userProperties = null;
    this.sessionId = 'session-' + Date.now();
  }

  /**
   * Simulate batch upload
   * Mimics real analytics service batch processing
   */
  async uploadEvents(): Promise<void> {
    if (this.events.length === 0) {
      return;
    }

    console.log(`🧪 Mock Analytics: Uploading ${this.events.length} events`);
    await TestUtils.createMockDelay('api');

    // In mock mode, we just log the upload
    console.log('🧪 Mock Analytics: Events uploaded successfully');
  }

  // Private helper methods

  private getPreviousScreen(): string | undefined {
    const screenViews = this.events
      .filter(e => e.name === 'screen_view')
      .slice(-2);
    
    return screenViews.length > 1 ? screenViews[0].parameters?.screen_name : undefined;
  }

  private getSessionDuration(): number {
    // Calculate session duration in milliseconds
    const sessionStart = new Date(this.sessionId.replace('session-', ''));
    return Date.now() - sessionStart.getTime();
  }
}

// Export singleton instance
export const mockAnalyticsService = new MockAnalyticsService();