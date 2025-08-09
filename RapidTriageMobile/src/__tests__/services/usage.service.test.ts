import { usageService, UsageEventType, SubscriptionTier } from '../../services/usage/usage.service';
import { ApiService } from '../../services/api/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/api/api.service');

/**
 * Unit tests for UsageService
 * Tests usage tracking, quota management, and limit enforcement
 * 
 * Test coverage:
 * - Usage event tracking
 * - Quota limit enforcement
 * - Usage statistics calculations
 * - Offline usage tracking
 * - Alert generation
 * - Tier-based limits
 */
describe('UsageService', () => {
  let mockApiService: jest.Mocked<ApiService>;
  let mockAsyncStorage: jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();

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
    (usageService as any).apiService = mockApiService;
  });

  describe('Usage Tracking', () => {
    test('should track triage session usage successfully', async () => {
      const mockStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.FREE,
        currentPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        usage: {
          triageSessions: 50,
          apiCalls: 100,
          reportsGenerated: 5,
          dataExports: 2,
          activeUsers: 1,
          storageUsedGB: 0.5,
        },
        limits: {
          tier: SubscriptionTier.FREE,
          monthlySessionLimit: 100,
          maxUsers: 1,
          maxReportsPerMonth: 10,
          maxExportsPerMonth: 3,
          apiCallsPerMinute: 60,
          maxStorageGB: 1,
        },
        percentagesUsed: {
          sessions: 50,
          users: 100,
          reports: 50,
          exports: 67,
          storage: 50,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockStats);

      const result = await usageService.trackUsage(
        'user_123',
        UsageEventType.TRIAGE_SESSION,
        { sessionDuration: 300 }
      );

      expect(result.allowed).toBe(true);
      expect(mockApiService.get).toHaveBeenCalledWith('/usage/user_123/stats');
    });

    test('should deny usage when session limit is exceeded', async () => {
      const mockStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.FREE,
        usage: {
          triageSessions: 100,
          apiCalls: 500,
          reportsGenerated: 10,
          dataExports: 3,
          activeUsers: 1,
          storageUsedGB: 0.8,
        },
        limits: {
          tier: SubscriptionTier.FREE,
          monthlySessionLimit: 100,
          maxUsers: 1,
          maxReportsPerMonth: 10,
          maxExportsPerMonth: 3,
          apiCallsPerMinute: 60,
          maxStorageGB: 1,
        },
        percentagesUsed: {
          sessions: 100,
          users: 100,
          reports: 100,
          exports: 100,
          storage: 80,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockStats);

      const result = await usageService.trackUsage(
        'user_123',
        UsageEventType.TRIAGE_SESSION
      );

      expect(result.allowed).toBe(false);
      expect(result.alert).toBeDefined();
      expect(result.alert?.type).toBe('exceeded');
    });

    test('should allow unlimited usage for Pro tier', async () => {
      const mockStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.PRO,
        usage: {
          triageSessions: 500,
          apiCalls: 1000,
          reportsGenerated: 50,
          dataExports: 20,
          activeUsers: 1,
          storageUsedGB: 5,
        },
        limits: {
          tier: SubscriptionTier.PRO,
          monthlySessionLimit: null, // unlimited
          maxUsers: 1,
          maxReportsPerMonth: null, // unlimited
          maxExportsPerMonth: null, // unlimited
          apiCallsPerMinute: 300,
          maxStorageGB: 10,
        },
        percentagesUsed: {
          sessions: -1, // unlimited
          users: 100,
          reports: -1, // unlimited
          exports: -1, // unlimited
          storage: 50,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockStats);

      const result = await usageService.trackUsage(
        'user_123',
        UsageEventType.TRIAGE_SESSION
      );

      expect(result.allowed).toBe(true);
    });

    test('should handle offline usage tracking', async () => {
      // Simulate offline scenario
      mockApiService.get.mockRejectedValueOnce(new Error('Network error'));
      mockAsyncStorage.getItem.mockResolvedValueOnce('[]');

      const result = await usageService.trackUsage(
        'user_123',
        UsageEventType.TRIAGE_SESSION
      );

      // Should still allow usage in case of errors (fail open)
      expect(result.allowed).toBe(true);
    });
  });

  describe('Usage Statistics', () => {
    test('should get user usage stats from server', async () => {
      const mockServerStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.FREE,
        currentPeriod: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
        usage: {
          triageSessions: 75,
          apiCalls: 200,
          reportsGenerated: 8,
          dataExports: 2,
          activeUsers: 1,
          storageUsedGB: 0.3,
        },
        percentagesUsed: {
          sessions: 75,
          users: 100,
          reports: 80,
          exports: 67,
          storage: 30,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockServerStats);

      const stats = await usageService.getUserUsageStats('user_123');

      expect(stats.userId).toBe('user_123');
      expect(stats.subscriptionTier).toBe(SubscriptionTier.FREE);
      expect(stats.usage.triageSessions).toBe(75);
      expect(stats.limits.monthlySessionLimit).toBe(100);
      expect(mockApiService.get).toHaveBeenCalledWith('/usage/user_123/stats');
    });

    test('should use cached stats when available and fresh', async () => {
      // First call - should fetch from server
      const mockStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.FREE,
        currentPeriod: {
          startDate: new Date(),
          endDate: new Date(),
        },
        usage: {
          triageSessions: 50,
          apiCalls: 100,
          reportsGenerated: 5,
          dataExports: 1,
          activeUsers: 1,
          storageUsedGB: 0.2,
        },
        limits: (usageService as any).TIER_LIMITS[SubscriptionTier.FREE],
        percentagesUsed: {
          sessions: 50,
          users: 100,
          reports: 50,
          exports: 33,
          storage: 20,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockStats);

      const stats1 = await usageService.getUserUsageStats('user_123');
      
      // Second call - should use cache
      const stats2 = await usageService.getUserUsageStats('user_123');

      expect(mockApiService.get).toHaveBeenCalledTimes(1);
      expect(stats1).toEqual(stats2);
    });

    test('should return default stats for new free user', async () => {
      mockApiService.get.mockRejectedValueOnce({ status: 404 });

      const stats = await usageService.getUserUsageStats('new_user_123');

      expect(stats.subscriptionTier).toBe(SubscriptionTier.FREE);
      expect(stats.usage.triageSessions).toBe(0);
      expect(stats.limits.monthlySessionLimit).toBe(100);
      expect(stats.percentagesUsed.sessions).toBe(0);
    });
  });

  describe('Usage Limit Checking', () => {
    const mockFreeStats = {
      userId: 'user_123',
      subscriptionTier: SubscriptionTier.FREE,
      usage: {
        triageSessions: 95,
        reportsGenerated: 9,
        dataExports: 3,
        activeUsers: 1,
      },
      limits: {
        monthlySessionLimit: 100,
        maxReportsPerMonth: 10,
        maxExportsPerMonth: 3,
        maxUsers: 1,
      },
      percentagesUsed: {
        sessions: 95,
        reports: 90,
        exports: 100,
        users: 100,
      },
    };

    test('should check session limits correctly', () => {
      const result = usageService.checkUsageLimit(
        mockFreeStats as any,
        UsageEventType.TRIAGE_SESSION
      );

      expect(result.allowed).toBe(true);
    });

    test('should check report limits correctly', () => {
      const result = usageService.checkUsageLimit(
        mockFreeStats as any,
        UsageEventType.REPORT_GENERATION
      );

      expect(result.allowed).toBe(true);
    });

    test('should deny when export limit is exceeded', () => {
      const result = usageService.checkUsageLimit(
        mockFreeStats as any,
        UsageEventType.DATA_EXPORT
      );

      expect(result.allowed).toBe(false);
      expect(result.alert?.type).toBe('exceeded');
      expect(result.alert?.feature).toBe(UsageEventType.DATA_EXPORT);
    });

    test('should allow unlimited usage for Pro tier', () => {
      const mockProStats = {
        ...mockFreeStats,
        subscriptionTier: SubscriptionTier.PRO,
        limits: {
          monthlySessionLimit: null,
          maxReportsPerMonth: null,
          maxExportsPerMonth: null,
          maxUsers: 1,
        },
        percentagesUsed: {
          sessions: -1,
          reports: -1,
          exports: -1,
          users: 100,
        },
      };

      const sessionResult = usageService.checkUsageLimit(
        mockProStats as any,
        UsageEventType.TRIAGE_SESSION
      );

      const reportResult = usageService.checkUsageLimit(
        mockProStats as any,
        UsageEventType.REPORT_GENERATION
      );

      expect(sessionResult.allowed).toBe(true);
      expect(reportResult.allowed).toBe(true);
    });
  });

  describe('Usage Alerts', () => {
    test('should generate warning alert at 80% usage', async () => {
      const mockStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.FREE,
        usage: {
          triageSessions: 80,
        },
        limits: {
          monthlySessionLimit: 100,
        },
        percentagesUsed: {
          sessions: 80,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockStats);

      const alerts = await usageService.getUserUsageAlerts('user_123');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('warning');
      expect(alerts[0].feature).toBe(UsageEventType.TRIAGE_SESSION);
      expect(alerts[0].percentageUsed).toBe(80);
    });

    test('should generate critical alert at 95% usage', async () => {
      const mockStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.FREE,
        usage: {
          triageSessions: 95,
        },
        limits: {
          monthlySessionLimit: 100,
        },
        percentagesUsed: {
          sessions: 95,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockStats);

      const alerts = await usageService.getUserUsageAlerts('user_123');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('critical');
      expect(alerts[0].recommendedAction).toBe('Monitor your usage');
    });

    test('should not generate alerts for unlimited features', async () => {
      const mockStats = {
        userId: 'user_123',
        subscriptionTier: SubscriptionTier.PRO,
        usage: {
          triageSessions: 1000,
        },
        limits: {
          monthlySessionLimit: null,
        },
        percentagesUsed: {
          sessions: -1,
        },
      };

      mockApiService.get.mockResolvedValueOnce(mockStats);

      const alerts = await usageService.getUserUsageAlerts('user_123');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('Analytics and Reporting', () => {
    test('should get usage analytics', async () => {
      const mockAnalytics = {
        dailyUsage: [
          { date: '2024-01-01', sessions: 10, apiCalls: 50 },
          { date: '2024-01-02', sessions: 15, apiCalls: 75 },
        ],
        featureUsage: {
          triage: 100,
          reports: 20,
          exports: 5,
        },
        peakUsageTimes: [
          { hour: 9, usage: 25 },
          { hour: 14, usage: 30 },
        ],
        totalEvents: 200,
      };

      mockApiService.get.mockResolvedValueOnce(mockAnalytics);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const analytics = await usageService.getUsageAnalytics(
        'user_123',
        startDate,
        endDate
      );

      expect(analytics).toEqual(mockAnalytics);
      expect(mockApiService.get).toHaveBeenCalledWith('/usage/user_123/analytics', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    });
  });

  describe('Subscription Tier Updates', () => {
    test('should update subscription tier and refresh limits', async () => {
      mockApiService.post.mockResolvedValueOnce({});

      await usageService.updateSubscriptionTier('user_123', SubscriptionTier.PRO);

      expect(mockApiService.post).toHaveBeenCalledWith('/usage/user_123/update-tier', {
        tier: SubscriptionTier.PRO,
      });

      // Cache should be cleared
      expect((usageService as any).localCache.has('user_123')).toBe(false);
    });

    test('should reset usage for new billing period', async () => {
      mockApiService.post.mockResolvedValueOnce({});

      await usageService.resetUsageForNewPeriod('user_123');

      expect(mockApiService.post).toHaveBeenCalledWith('/usage/user_123/reset-period');

      // Cache should be cleared
      expect((usageService as any).localCache.has('user_123')).toBe(false);
    });
  });

  describe('Offline Support', () => {
    test('should queue usage events when offline', async () => {
      // Simulate offline scenario
      mockApiService.get.mockRejectedValueOnce(new Error('Network error'));
      mockApiService.post.mockRejectedValueOnce(new Error('Network error'));
      mockAsyncStorage.getItem.mockResolvedValueOnce('[]');
      mockAsyncStorage.setItem.mockResolvedValueOnce();

      const result = await usageService.trackUsage(
        'user_123',
        UsageEventType.TRIAGE_SESSION
      );

      expect(result.allowed).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    test('should sync pending usage events', async () => {
      const mockPendingEvents = [
        {
          id: 'event_1',
          userId: 'user_123',
          eventType: UsageEventType.TRIAGE_SESSION,
          timestamp: new Date(),
          metadata: {},
          syncedToServer: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockPendingEvents));
      mockApiService.post.mockResolvedValueOnce({
        success: true,
        syncedCount: 1,
        failedCount: 0,
      });

      // Set up pending events
      (usageService as any).pendingEvents = mockPendingEvents;

      const result = await usageService.syncPendingUsage();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockApiService.post).toHaveBeenCalledWith('/usage/events/batch', {
        events: mockPendingEvents,
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully in tracking', async () => {
      mockApiService.get.mockRejectedValueOnce(new Error('Server error'));

      const result = await usageService.trackUsage(
        'user_123',
        UsageEventType.TRIAGE_SESSION
      );

      // Should fail open and allow usage
      expect(result.allowed).toBe(true);
    });

    test('should handle malformed server responses', async () => {
      mockApiService.get.mockResolvedValueOnce(null);

      const stats = await usageService.getUserUsageStats('user_123');

      expect(stats.subscriptionTier).toBe(SubscriptionTier.FREE);
      expect(stats.usage.triageSessions).toBe(0);
    });

    test('should handle storage errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await usageService.trackUsage(
        'user_123',
        UsageEventType.TRIAGE_SESSION
      );

      // Should not throw error and allow usage
      expect(result.allowed).toBe(true);
    });
  });

  describe('Tier-Specific Limits', () => {
    test('should have correct limits for each tier', () => {
      const tierLimits = (usageService as any).TIER_LIMITS;

      // Free tier
      expect(tierLimits[SubscriptionTier.FREE]).toMatchObject({
        monthlySessionLimit: 100,
        maxUsers: 1,
        maxReportsPerMonth: 10,
        maxExportsPerMonth: 3,
      });

      // Pro tier
      expect(tierLimits[SubscriptionTier.PRO]).toMatchObject({
        monthlySessionLimit: null, // unlimited
        maxUsers: 1,
        maxReportsPerMonth: null, // unlimited
        maxExportsPerMonth: null, // unlimited
      });

      // Team tier
      expect(tierLimits[SubscriptionTier.TEAM]).toMatchObject({
        monthlySessionLimit: null, // unlimited
        maxUsers: 5,
        maxReportsPerMonth: null, // unlimited
        maxExportsPerMonth: null, // unlimited
      });

      // Enterprise tier
      expect(tierLimits[SubscriptionTier.ENTERPRISE]).toMatchObject({
        monthlySessionLimit: null, // unlimited
        maxUsers: -1, // unlimited
        maxReportsPerMonth: null, // unlimited
        maxExportsPerMonth: null, // unlimited
      });
    });
  });
});