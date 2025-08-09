import { analyticsService, AnalyticsEventCategory, ConversionFunnelStage, SubscriptionTier } from '../../services/analytics/analytics.service';
import { ApiService } from '../../services/api/api.service';
import { UsageEventType } from '../../services/usage/usage.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/api/api.service');
jest.mock('@env', () => ({
  ENABLE_ANALYTICS: 'true',
}));

/**
 * Unit tests for AnalyticsService
 * Tests conversion tracking, event management, and A/B testing
 * 
 * Test coverage:
 * - Event tracking and queuing
 * - Conversion funnel tracking
 * - A/B testing framework
 * - Offline support and sync
 * - User journey tracking
 * - Error handling and edge cases
 */
describe('AnalyticsService', () => {
  let mockApiService: jest.Mocked<ApiService>;
  let mockAsyncStorage: jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock API service
    mockApiService = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Mock AsyncStorage
    mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

    // Replace the API service instance
    (analyticsService as any).apiService = mockApiService;
    
    // Reset analytics service state
    (analyticsService as any).eventQueue = [];
    (analyticsService as any).isEnabled = true;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Service Initialization', () => {
    test('should initialize analytics service successfully', () => {
      expect((analyticsService as any).isEnabled).toBe(true);
      expect((analyticsService as any).config.enableAnalytics).toBe(true);
      expect((analyticsService as any).sessionId).toBeDefined();
    });

    test('should load experiments on initialization', async () => {
      const mockExperiments = [
        {
          id: 'paywall_test_1',
          name: 'Paywall Design Test',
          variants: [
            { id: 'control', name: 'Original', weight: 50, config: {} },
            { id: 'variant_a', name: 'New Design', weight: 50, config: {} },
          ],
          isActive: true,
        },
      ];

      mockApiService.get.mockResolvedValueOnce(mockExperiments);

      await (analyticsService as any).loadExperiments();

      expect(mockApiService.get).toHaveBeenCalledWith('/analytics/experiments');
      expect((analyticsService as any).currentExperiments.size).toBe(1);
    });
  });

  describe('Event Tracking', () => {
    test('should track basic events successfully', async () => {
      await analyticsService.track(
        'button_clicked',
        AnalyticsEventCategory.USER_BEHAVIOR,
        { buttonName: 'upgrade_button', userId: 'user_123' }
      );

      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      
      const event = eventQueue[0];
      expect(event.eventName).toBe('button_clicked');
      expect(event.category).toBe(AnalyticsEventCategory.USER_BEHAVIOR);
      expect(event.properties.buttonName).toBe('upgrade_button');
      expect(event.userId).toBe('user_123');
      expect(event.synced).toBe(false);
    });

    test('should include session ID in all events', async () => {
      await analyticsService.track(
        'page_view',
        AnalyticsEventCategory.USER_BEHAVIOR,
        { page: 'subscription_management' }
      );

      const event = (analyticsService as any).eventQueue[0];
      expect(event.sessionId).toBeDefined();
      expect(event.properties.sessionId).toBeDefined();
    });

    test('should auto-flush when queue reaches batch size', async () => {
      mockApiService.post.mockResolvedValue({});
      (analyticsService as any).config.batchSize = 2;

      await analyticsService.track('event_1', AnalyticsEventCategory.USER_BEHAVIOR);
      await analyticsService.track('event_2', AnalyticsEventCategory.USER_BEHAVIOR);

      expect(mockApiService.post).toHaveBeenCalledWith('/analytics/events', {
        events: expect.arrayContaining([
          expect.objectContaining({ eventName: 'event_1' }),
          expect.objectContaining({ eventName: 'event_2' })
        ]),
        sessionId: expect.any(String)
      });
    });

    test('should flush critical events immediately', async () => {
      mockApiService.post.mockResolvedValue({});

      await analyticsService.track(
        'subscription_started',
        AnalyticsEventCategory.CONVERSION,
        { planId: 'pro_plan' }
      );

      expect(mockApiService.post).toHaveBeenCalled();
      expect((analyticsService as any).eventQueue).toHaveLength(0);
    });
  });

  describe('Conversion Tracking', () => {
    test('should track subscription started conversion', async () => {
      mockApiService.post.mockResolvedValue({});

      await analyticsService.trackConversion(
        'subscription_started',
        ConversionFunnelStage.PURCHASE,
        {
          userId: 'user_123',
          revenue: 2900,
          subscriptionTier: SubscriptionTier.PRO,
          previousTier: SubscriptionTier.FREE,
        }
      );

      expect(mockApiService.post).toHaveBeenCalledWith('/analytics/events', {
        events: expect.arrayContaining([
          expect.objectContaining({
            eventName: 'conversion_subscription_started',
            category: AnalyticsEventCategory.CONVERSION,
            conversionType: 'subscription_started',
            funnelStage: ConversionFunnelStage.PURCHASE,
            revenue: 2900,
            subscriptionTier: SubscriptionTier.PRO,
            previousTier: SubscriptionTier.FREE,
          })
        ]),
        sessionId: expect.any(String)
      });
    });

    test('should track paywall interactions', async () => {
      await analyticsService.trackPaywallInteraction(
        'shown',
        {
          triggeredBy: UsageEventType.TRIAGE_SESSION,
          currentTier: SubscriptionTier.FREE,
          position: 'modal',
          variant: 'control',
        }
      );

      const event = (analyticsService as any).eventQueue[0];
      expect(event.eventName).toBe('paywall_shown');
      expect(event.properties.triggeredBy).toBe(UsageEventType.TRIAGE_SESSION);
      expect(event.properties.currentTier).toBe(SubscriptionTier.FREE);
    });

    test('should track upgrade clicks as conversions', async () => {
      mockApiService.post.mockResolvedValue({});

      await analyticsService.trackPaywallInteraction(
        'upgrade_clicked',
        {
          currentTier: SubscriptionTier.FREE,
          selectedTier: SubscriptionTier.PRO,
          timeToAction: 5000,
        }
      );

      // Should have tracked both paywall interaction and conversion
      expect(mockApiService.post).toHaveBeenCalledTimes(2);
      
      const calls = mockApiService.post.mock.calls;
      expect(calls[0][1].events[0].eventName).toBe('paywall_upgrade_clicked');
      expect(calls[1][1].events[0].eventName).toBe('conversion_upgrade_clicked');
    });

    test('should track subscription lifecycle events', async () => {
      mockApiService.post.mockResolvedValue({});

      await analyticsService.trackSubscriptionEvent(
        'upgraded',
        {
          subscriptionTier: SubscriptionTier.TEAM,
          previousTier: SubscriptionTier.PRO,
          revenue: 7000, // $70 difference
          paymentMethod: 'card',
        }
      );

      expect(mockApiService.post).toHaveBeenCalledWith('/analytics/events', {
        events: expect.arrayContaining([
          expect.objectContaining({
            eventName: 'conversion_subscription_upgraded',
            funnelStage: ConversionFunnelStage.PURCHASE,
            subscriptionTier: SubscriptionTier.TEAM,
            previousTier: SubscriptionTier.PRO,
            revenue: 7000,
          })
        ]),
        sessionId: expect.any(String)
      });
    });
  });

  describe('Feature Usage Tracking', () => {
    test('should track feature access', async () => {
      await analyticsService.trackFeatureUsage(
        'advanced_reports',
        'accessed',
        {
          subscriptionTier: SubscriptionTier.PRO,
          timeSpent: 120000, // 2 minutes
          success: true,
        }
      );

      const event = (analyticsService as any).eventQueue[0];
      expect(event.eventName).toBe('feature_accessed');
      expect(event.properties.feature_name).toBe('advanced_reports');
      expect(event.properties.subscriptionTier).toBe(SubscriptionTier.PRO);
      expect(event.properties.timeSpent).toBe(120000);
    });

    test('should track blocked features as conversion opportunities', async () => {
      await analyticsService.trackFeatureUsage(
        'data_export',
        'blocked',
        {
          subscriptionTier: SubscriptionTier.FREE,
          usageLimit: 3,
          currentUsage: 3,
        }
      );

      const eventQueue = (analyticsService as any).eventQueue;
      expect(eventQueue).toHaveLength(2);
      
      expect(eventQueue[0].eventName).toBe('feature_blocked');
      expect(eventQueue[1].eventName).toBe('conversion_opportunity');
      expect(eventQueue[1].properties.reason).toBe('feature_blocked');
    });
  });

  describe('User Journey Tracking', () => {
    test('should start user journey', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await analyticsService.startUserJourney('user_123');

      const journey = (analyticsService as any).userJourney;
      expect(journey.userId).toBe('user_123');
      expect(journey.sessionId).toBeDefined();
      expect(journey.startTime).toBeInstanceOf(Date);
      expect(journey.touchpoints).toEqual([]);
      expect(journey.conversionEvents).toEqual([]);
    });

    test('should update journey with touchpoints', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await analyticsService.startUserJourney('user_123');
      await analyticsService.track(
        'page_view',
        AnalyticsEventCategory.USER_BEHAVIOR,
        { page: 'pricing' }
      );

      const journey = (analyticsService as any).userJourney;
      expect(journey.touchpoints).toHaveLength(1);
      expect(journey.touchpoints[0].event).toBe('page_view');
    });

    test('should end journey with outcome', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await analyticsService.startUserJourney('user_123');
      await analyticsService.endUserJourney('converted');

      const event = (analyticsService as any).eventQueue.find(
        e => e.eventName === 'user_journey_completed'
      );
      
      expect(event).toBeDefined();
      expect(event.properties.outcome).toBe('converted');
      expect(event.properties.userId).toBe('user_123');
    });
  });

  describe('A/B Testing', () => {
    test('should assign experiment variants based on weights', async () => {
      const experiment = {
        id: 'pricing_test',
        name: 'Pricing Page Test',
        variants: [
          { id: 'control', name: 'Original', weight: 70, config: {} },
          { id: 'variant_a', name: 'New Layout', weight: 30, config: {} },
        ],
        isActive: true,
      };

      (analyticsService as any).currentExperiments.set('pricing_test', experiment);

      // Mock random to always return 0.5 (should get variant_a)
      jest.spyOn(Math, 'random').mockReturnValue(0.8); // 80% should get variant_a

      const variant = await analyticsService.getExperimentVariant(
        'pricing_test',
        'user_123'
      );

      expect(variant).toBe('variant_a');

      // Should track experiment exposure
      const event = (analyticsService as any).eventQueue.find(
        e => e.eventName === 'experiment_exposure'
      );
      expect(event).toBeDefined();
      expect(event.properties.experimentId).toBe('pricing_test');
      expect(event.properties.variantId).toBe('variant_a');

      jest.restoreAllMocks();
    });

    test('should return null for inactive experiments', async () => {
      const experiment = {
        id: 'inactive_test',
        name: 'Inactive Test',
        variants: [
          { id: 'control', name: 'Original', weight: 100, config: {} },
        ],
        isActive: false,
      };

      (analyticsService as any).currentExperiments.set('inactive_test', experiment);

      const variant = await analyticsService.getExperimentVariant(
        'inactive_test',
        'user_123'
      );

      expect(variant).toBeNull();
    });

    test('should return null for non-existent experiments', async () => {
      const variant = await analyticsService.getExperimentVariant(
        'non_existent',
        'user_123'
      );

      expect(variant).toBeNull();
    });
  });

  describe('User Properties', () => {
    test('should set user properties', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      const properties = {
        subscriptionTier: SubscriptionTier.PRO,
        registrationDate: '2024-01-01',
        lastActiveDate: '2024-01-15',
      };

      await analyticsService.setUserProperties(properties);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('user_properties'),
        JSON.stringify(properties)
      );

      const event = (analyticsService as any).eventQueue.find(
        e => e.eventName === 'user_properties_updated'
      );
      expect(event).toBeDefined();
      expect(event.userProperties).toEqual(properties);
    });
  });

  describe('Offline Support', () => {
    test('should queue events when API fails', async () => {
      mockApiService.post.mockRejectedValue(new Error('Network error'));
      mockAsyncStorage.setItem.mockResolvedValue();

      await analyticsService.track(
        'offline_event',
        AnalyticsEventCategory.USER_BEHAVIOR
      );

      // Event should still be in queue
      expect((analyticsService as any).eventQueue).toHaveLength(1);
      
      // Should attempt to save to storage
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should load queued events from storage', async () => {
      const queuedEvents = [
        {
          id: 'event_1',
          eventName: 'queued_event',
          category: AnalyticsEventCategory.USER_BEHAVIOR,
          timestamp: new Date().toISOString(),
          properties: {},
          synced: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(queuedEvents));

      await (analyticsService as any).loadQueuedEvents();

      expect((analyticsService as any).eventQueue).toHaveLength(1);
      expect((analyticsService as any).eventQueue[0].eventName).toBe('queued_event');
    });

    test('should flush queued events successfully', async () => {
      const events = [
        {
          id: 'event_1',
          eventName: 'test_event',
          category: AnalyticsEventCategory.USER_BEHAVIOR,
          timestamp: new Date(),
          properties: {},
          synced: false,
        },
      ];

      (analyticsService as any).eventQueue = events;
      mockApiService.post.mockResolvedValue({});

      await analyticsService.flush();

      expect(mockApiService.post).toHaveBeenCalledWith('/analytics/events', {
        events: events,
        sessionId: expect.any(String),
      });

      expect((analyticsService as any).eventQueue).toHaveLength(0);
    });

    test('should re-queue events if flush fails', async () => {
      const events = [
        {
          id: 'event_1',
          eventName: 'test_event',
          category: AnalyticsEventCategory.USER_BEHAVIOR,
          timestamp: new Date(),
          properties: {},
          synced: false,
        },
      ];

      (analyticsService as any).eventQueue = [...events];
      mockApiService.post.mockRejectedValue(new Error('Network error'));
      mockAsyncStorage.setItem.mockResolvedValue();

      await analyticsService.flush();

      // Events should be back in queue
      expect((analyticsService as any).eventQueue.length).toBeGreaterThan(0);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Periodic Flush', () => {
    test('should flush events periodically', async () => {
      mockApiService.post.mockResolvedValue({});
      (analyticsService as any).config.flushInterval = 1000; // 1 second

      await analyticsService.track(
        'periodic_event',
        AnalyticsEventCategory.USER_BEHAVIOR
      );

      // Fast-forward timer
      jest.advanceTimersByTime(1000);

      expect(mockApiService.post).toHaveBeenCalled();
    });

    test('should not flush empty queue', () => {
      (analyticsService as any).config.flushInterval = 1000;
      (analyticsService as any).eventQueue = [];

      jest.advanceTimersByTime(1000);

      expect(mockApiService.post).not.toHaveBeenCalled();
    });
  });

  describe('Analytics Control', () => {
    test('should disable analytics tracking', () => {
      analyticsService.setEnabled(false);

      expect((analyticsService as any).config.enableAnalytics).toBe(false);
      expect((analyticsService as any).eventQueue).toHaveLength(0);
    });

    test('should not track events when disabled', async () => {
      analyticsService.setEnabled(false);

      await analyticsService.track(
        'disabled_event',
        AnalyticsEventCategory.USER_BEHAVIOR
      );

      expect((analyticsService as any).eventQueue).toHaveLength(0);
      expect(mockApiService.post).not.toHaveBeenCalled();
    });

    test('should re-enable analytics', async () => {
      analyticsService.setEnabled(false);
      analyticsService.setEnabled(true);

      expect((analyticsService as any).config.enableAnalytics).toBe(true);

      await analyticsService.track(
        'enabled_event',
        AnalyticsEventCategory.USER_BEHAVIOR
      );

      expect((analyticsService as any).eventQueue).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle tracking errors gracefully', async () => {
      // Mock a scenario that would cause an error
      jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
        throw new Error('Date error');
      });

      // Should not throw
      await expect(
        analyticsService.track('error_event', AnalyticsEventCategory.USER_BEHAVIOR)
      ).resolves.not.toThrow();

      jest.restoreAllMocks();
    });

    test('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw
      await expect(
        analyticsService.setUserProperties({ test: 'value' })
      ).resolves.not.toThrow();
    });

    test('should handle experiment loading errors', async () => {
      mockApiService.get.mockRejectedValue(new Error('API error'));

      // Should not throw
      await expect(
        (analyticsService as any).loadExperiments()
      ).resolves.not.toThrow();

      expect((analyticsService as any).currentExperiments.size).toBe(0);
    });
  });
});