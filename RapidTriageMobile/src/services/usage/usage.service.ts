import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { SubscriptionTier } from '../payment/payment.service';

/**
 * Usage tracking event types
 * Defines different types of usage events that count towards quotas
 */
export enum UsageEventType {
  TRIAGE_SESSION = 'triage_session',
  API_CALL = 'api_call',
  REPORT_GENERATION = 'report_generation',
  DATA_EXPORT = 'data_export',
  USER_INVITATION = 'user_invitation'
}

/**
 * Usage limit configuration for different subscription tiers
 * Defines what limits apply to each tier and feature
 */
export interface UsageLimits {
  tier: SubscriptionTier;
  monthlySessionLimit: number | null; // null = unlimited
  maxUsers: number; // -1 = unlimited
  maxReportsPerMonth: number | null;
  maxExportsPerMonth: number | null;
  apiCallsPerMinute: number;
  maxStorageGB: number | null;
}

/**
 * Current usage statistics for a user/organization
 * Tracks actual usage against limits
 */
export interface UsageStats {
  userId: string;
  subscriptionTier: SubscriptionTier;
  currentPeriod: {
    startDate: Date;
    endDate: Date;
  };
  usage: {
    triageSessions: number;
    apiCalls: number;
    reportsGenerated: number;
    dataExports: number;
    activeUsers: number;
    storageUsedGB: number;
  };
  limits: UsageLimits;
  percentagesUsed: {
    sessions: number; // 0-100, or -1 if unlimited
    users: number;
    reports: number;
    exports: number;
    storage: number;
  };
}

/**
 * Usage event for tracking individual actions
 * Records individual usage events for analytics and billing
 */
export interface UsageEvent {
  id: string;
  userId: string;
  eventType: UsageEventType;
  timestamp: Date;
  metadata: {
    sessionDuration?: number; // in seconds
    dataSize?: number; // in bytes
    featureUsed?: string;
    apiEndpoint?: string;
    [key: string]: any;
  };
  syncedToServer: boolean;
}

/**
 * Real-time usage monitoring configuration
 * Controls how usage is tracked and reported
 */
export interface UsageMonitoringConfig {
  enableRealTimeSync: boolean;
  batchSyncInterval: number; // minutes
  cacheExpiryTime: number; // minutes
  enableOfflineTracking: boolean;
  alertThresholds: {
    warning: number; // percentage (e.g., 80)
    critical: number; // percentage (e.g., 95)
  };
}

/**
 * Usage alert information
 * Notifies users when approaching or exceeding limits
 */
export interface UsageAlert {
  type: 'warning' | 'critical' | 'exceeded';
  feature: UsageEventType;
  currentUsage: number;
  limit: number;
  percentageUsed: number;
  message: string;
  recommendedAction?: string;
  upgradeRequired?: boolean;
}

/**
 * Comprehensive usage tracking and quota management service
 * Handles all aspects of usage monitoring, limit enforcement, and analytics
 * 
 * Key responsibilities:
 * - Track usage events across all features and tiers
 * - Enforce subscription limits and quotas
 * - Provide real-time usage monitoring and alerts
 * - Handle offline usage tracking with sync capabilities
 * - Generate usage analytics and reports
 * - Manage upgrade prompts when limits are reached
 */
class UsageService {
  private apiService: ApiService;
  private localCache: Map<string, UsageStats> = new Map();
  private pendingEvents: UsageEvent[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = true;

  // Local storage keys for offline support
  private readonly STORAGE_KEYS = {
    USAGE_STATS: 'usage_stats_cache',
    PENDING_EVENTS: 'usage_pending_events',
    LAST_SYNC: 'usage_last_sync_timestamp'
  };

  /**
   * Usage limits configuration for all subscription tiers
   * Defines what each tier allows and restricts
   */
  private readonly TIER_LIMITS: Record<SubscriptionTier, UsageLimits> = {
    [SubscriptionTier.FREE]: {
      tier: SubscriptionTier.FREE,
      monthlySessionLimit: 100,
      maxUsers: 1,
      maxReportsPerMonth: 10,
      maxExportsPerMonth: 3,
      apiCallsPerMinute: 60, // 1 per second
      maxStorageGB: 1
    },
    [SubscriptionTier.PRO]: {
      tier: SubscriptionTier.PRO,
      monthlySessionLimit: null, // unlimited
      maxUsers: 1,
      maxReportsPerMonth: null, // unlimited
      maxExportsPerMonth: null, // unlimited
      apiCallsPerMinute: 300, // 5 per second
      maxStorageGB: 10
    },
    [SubscriptionTier.TEAM]: {
      tier: SubscriptionTier.TEAM,
      monthlySessionLimit: null, // unlimited
      maxUsers: 5,
      maxReportsPerMonth: null, // unlimited
      maxExportsPerMonth: null, // unlimited
      apiCallsPerMinute: 600, // 10 per second
      maxStorageGB: 50
    },
    [SubscriptionTier.ENTERPRISE]: {
      tier: SubscriptionTier.ENTERPRISE,
      monthlySessionLimit: null, // unlimited
      maxUsers: -1, // unlimited
      maxReportsPerMonth: null, // unlimited
      maxExportsPerMonth: null, // unlimited
      apiCallsPerMinute: 1200, // 20 per second
      maxStorageGB: null // unlimited
    }
  };

  private monitoringConfig: UsageMonitoringConfig = {
    enableRealTimeSync: true,
    batchSyncInterval: 5, // sync every 5 minutes
    cacheExpiryTime: 15, // cache expires after 15 minutes
    enableOfflineTracking: true,
    alertThresholds: {
      warning: 80, // 80% of limit
      critical: 95 // 95% of limit
    }
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.initializeUsageTracking();
  }

  /**
   * Initialize usage tracking system
   * Sets up offline support, sync intervals, and cache management
   */
  private async initializeUsageTracking(): Promise<void> {
    try {
      // Load pending events from local storage
      await this.loadPendingEvents();
      
      // Start periodic sync if real-time sync is enabled
      if (this.monitoringConfig.enableRealTimeSync) {
        this.startPeriodicSync();
      }

      // Listen for network connectivity changes
      this.setupNetworkMonitoring();

      console.log('Usage tracking initialized successfully');
    } catch (error) {
      console.error('Usage tracking initialization error:', error);
    }
  }

  /**
   * Track a usage event
   * Records usage and checks against limits
   * 
   * @param userId - User ID performing the action
   * @param eventType - Type of usage event
   * @param metadata - Additional event metadata
   */
  async trackUsage(
    userId: string,
    eventType: UsageEventType,
    metadata: Record<string, any> = {}
  ): Promise<{ allowed: boolean; alert?: UsageAlert }> {
    try {
      // Create usage event
      const usageEvent: UsageEvent = {
        id: this.generateEventId(),
        userId,
        eventType,
        timestamp: new Date(),
        metadata,
        syncedToServer: false
      };

      // Get current usage stats for user
      const stats = await this.getUserUsageStats(userId);
      
      // Check if user can perform this action
      const limitCheck = this.checkUsageLimit(stats, eventType, metadata);
      
      if (!limitCheck.allowed) {
        console.log('Usage limit exceeded:', limitCheck.alert);
        return limitCheck;
      }

      // Record the event
      await this.recordUsageEvent(usageEvent);

      // Update local cache
      await this.updateLocalUsageCache(userId, eventType, metadata);

      // Sync to server if online
      if (this.isOnline && this.monitoringConfig.enableRealTimeSync) {
        await this.syncUsageToServer([usageEvent]);
      } else {
        // Store for later sync if offline
        this.pendingEvents.push(usageEvent);
        await this.savePendingEvents();
      }

      return { allowed: true };
    } catch (error) {
      console.error('Usage tracking error:', error);
      // Don't block user actions on tracking errors in production
      return { allowed: true };
    }
  }

  /**
   * Get current usage statistics for a user
   * Returns cached data with server sync as needed
   * 
   * @param userId - User ID to get stats for
   * @param forceRefresh - Force refresh from server
   */
  async getUserUsageStats(userId: string, forceRefresh = false): Promise<UsageStats> {
    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh && this.localCache.has(userId)) {
        const cachedStats = this.localCache.get(userId)!;
        
        // Check if cache is still valid
        const cacheAge = Date.now() - cachedStats.currentPeriod.startDate.getTime();
        const maxAge = this.monitoringConfig.cacheExpiryTime * 60 * 1000;
        
        if (cacheAge < maxAge) {
          return cachedStats;
        }
      }

      // Fetch from server
      const serverStats = await this.apiService.get(`/usage/${userId}/stats`);
      const usageStats = this.transformServerStatsToUsageStats(serverStats);
      
      // Update cache
      this.localCache.set(userId, usageStats);
      
      return usageStats;
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      
      // Return cached data if available, otherwise return default stats
      if (this.localCache.has(userId)) {
        return this.localCache.get(userId)!;
      }
      
      // Return default stats for free tier
      return this.createDefaultUsageStats(userId, SubscriptionTier.FREE);
    }
  }

  /**
   * Check if a usage action is allowed within current limits
   * Returns detailed information about the limit check
   * 
   * @param stats - Current usage statistics
   * @param eventType - Type of event to check
   * @param metadata - Event metadata for size/duration checks
   */
  checkUsageLimit(
    stats: UsageStats,
    eventType: UsageEventType,
    metadata: Record<string, any> = {}
  ): { allowed: boolean; alert?: UsageAlert } {
    const limits = stats.limits;
    
    switch (eventType) {
      case UsageEventType.TRIAGE_SESSION:
        return this.checkSessionLimit(stats);
      
      case UsageEventType.REPORT_GENERATION:
        return this.checkReportLimit(stats);
      
      case UsageEventType.DATA_EXPORT:
        return this.checkExportLimit(stats);
      
      case UsageEventType.API_CALL:
        return this.checkApiLimit(stats);
      
      case UsageEventType.USER_INVITATION:
        return this.checkUserLimit(stats);
      
      default:
        return { allowed: true };
    }
  }

  /**
   * Get usage alerts for a user
   * Returns current alerts based on usage thresholds
   */
  async getUserUsageAlerts(userId: string): Promise<UsageAlert[]> {
    try {
      const stats = await this.getUserUsageStats(userId);
      const alerts: UsageAlert[] = [];

      // Check session usage
      if (stats.limits.monthlySessionLimit !== null) {
        const sessionPercentage = stats.percentagesUsed.sessions;
        if (sessionPercentage >= this.monitoringConfig.alertThresholds.critical) {
          alerts.push(this.createUsageAlert('critical', UsageEventType.TRIAGE_SESSION, stats));
        } else if (sessionPercentage >= this.monitoringConfig.alertThresholds.warning) {
          alerts.push(this.createUsageAlert('warning', UsageEventType.TRIAGE_SESSION, stats));
        }
      }

      // Check user limit
      if (stats.limits.maxUsers > 0) {
        const userPercentage = stats.percentagesUsed.users;
        if (userPercentage >= this.monitoringConfig.alertThresholds.critical) {
          alerts.push(this.createUsageAlert('critical', UsageEventType.USER_INVITATION, stats));
        }
      }

      // Check storage usage
      if (stats.limits.maxStorageGB !== null) {
        const storagePercentage = stats.percentagesUsed.storage;
        if (storagePercentage >= this.monitoringConfig.alertThresholds.critical) {
          alerts.push(this.createUsageAlert('critical', UsageEventType.DATA_EXPORT, stats));
        }
      }

      return alerts;
    } catch (error) {
      console.error('Failed to get usage alerts:', error);
      return [];
    }
  }

  /**
   * Reset usage statistics for a new billing period
   * Called when subscription renews or changes
   */
  async resetUsageForNewPeriod(userId: string): Promise<void> {
    try {
      await this.apiService.post(`/usage/${userId}/reset-period`);
      
      // Clear local cache to force refresh
      this.localCache.delete(userId);
      
      console.log('Usage reset for new period:', userId);
    } catch (error) {
      console.error('Failed to reset usage:', error);
      throw error;
    }
  }

  /**
   * Get usage analytics and trends
   * Returns detailed usage analytics for reporting
   */
  async getUsageAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    dailyUsage: Array<{ date: string; sessions: number; apiCalls: number }>;
    featureUsage: Record<string, number>;
    peakUsageTimes: Array<{ hour: number; usage: number }>;
    totalEvents: number;
  }> {
    try {
      const analytics = await this.apiService.get(`/usage/${userId}/analytics`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      return analytics;
    } catch (error) {
      console.error('Failed to get usage analytics:', error);
      throw error;
    }
  }

  /**
   * Update subscription tier and refresh limits
   * Called when user upgrades/downgrades subscription
   */
  async updateSubscriptionTier(userId: string, newTier: SubscriptionTier): Promise<void> {
    try {
      // Update limits on server
      await this.apiService.post(`/usage/${userId}/update-tier`, { tier: newTier });
      
      // Clear local cache to force refresh with new limits
      this.localCache.delete(userId);
      
      console.log('Subscription tier updated:', userId, newTier);
    } catch (error) {
      console.error('Failed to update subscription tier:', error);
      throw error;
    }
  }

  /**
   * Sync pending usage events to server
   * Handles batch sync for offline usage tracking
   */
  async syncPendingUsage(): Promise<{ synced: number; failed: number }> {
    if (this.pendingEvents.length === 0) {
      return { synced: 0, failed: 0 };
    }

    try {
      const result = await this.syncUsageToServer(this.pendingEvents);
      
      if (result.success) {
        // Clear synced events
        this.pendingEvents = [];
        await this.savePendingEvents();
      }

      return {
        synced: result.syncedCount || 0,
        failed: result.failedCount || 0
      };
    } catch (error) {
      console.error('Usage sync failed:', error);
      return { synced: 0, failed: this.pendingEvents.length };
    }
  }

  // Private helper methods

  private checkSessionLimit(stats: UsageStats): { allowed: boolean; alert?: UsageAlert } {
    if (stats.limits.monthlySessionLimit === null) {
      return { allowed: true }; // Unlimited
    }

    if (stats.usage.triageSessions >= stats.limits.monthlySessionLimit) {
      return {
        allowed: false,
        alert: this.createUsageAlert('exceeded', UsageEventType.TRIAGE_SESSION, stats)
      };
    }

    return { allowed: true };
  }

  private checkReportLimit(stats: UsageStats): { allowed: boolean; alert?: UsageAlert } {
    if (stats.limits.maxReportsPerMonth === null) {
      return { allowed: true }; // Unlimited
    }

    if (stats.usage.reportsGenerated >= stats.limits.maxReportsPerMonth) {
      return {
        allowed: false,
        alert: this.createUsageAlert('exceeded', UsageEventType.REPORT_GENERATION, stats)
      };
    }

    return { allowed: true };
  }

  private checkExportLimit(stats: UsageStats): { allowed: boolean; alert?: UsageAlert } {
    if (stats.limits.maxExportsPerMonth === null) {
      return { allowed: true }; // Unlimited
    }

    if (stats.usage.dataExports >= stats.limits.maxExportsPerMonth) {
      return {
        allowed: false,
        alert: this.createUsageAlert('exceeded', UsageEventType.DATA_EXPORT, stats)
      };
    }

    return { allowed: true };
  }

  private checkApiLimit(stats: UsageStats): { allowed: boolean; alert?: UsageAlert } {
    // API limits are handled differently (rate limiting)
    // This would typically check recent API call timestamps
    return { allowed: true };
  }

  private checkUserLimit(stats: UsageStats): { allowed: boolean; alert?: UsageAlert } {
    if (stats.limits.maxUsers === -1) {
      return { allowed: true }; // Unlimited
    }

    if (stats.usage.activeUsers >= stats.limits.maxUsers) {
      return {
        allowed: false,
        alert: this.createUsageAlert('exceeded', UsageEventType.USER_INVITATION, stats)
      };
    }

    return { allowed: true };
  }

  private createUsageAlert(
    type: 'warning' | 'critical' | 'exceeded',
    eventType: UsageEventType,
    stats: UsageStats
  ): UsageAlert {
    const messages = {
      [UsageEventType.TRIAGE_SESSION]: {
        warning: 'You\'re approaching your monthly session limit.',
        critical: 'You\'ve used 95% of your monthly sessions.',
        exceeded: 'You\'ve reached your monthly session limit.'
      },
      [UsageEventType.REPORT_GENERATION]: {
        warning: 'You\'re approaching your monthly report limit.',
        critical: 'You\'ve used 95% of your monthly reports.',
        exceeded: 'You\'ve reached your monthly report limit.'
      },
      [UsageEventType.DATA_EXPORT]: {
        warning: 'You\'re approaching your monthly export limit.',
        critical: 'You\'ve used 95% of your monthly exports.',
        exceeded: 'You\'ve reached your monthly export limit.'
      },
      [UsageEventType.USER_INVITATION]: {
        warning: 'You\'re approaching your user limit.',
        critical: 'You\'ve nearly reached your user limit.',
        exceeded: 'You\'ve reached your maximum user limit.'
      },
      [UsageEventType.API_CALL]: {
        warning: 'High API usage detected.',
        critical: 'API rate limit nearly reached.',
        exceeded: 'API rate limit exceeded.'
      }
    };

    let currentUsage = 0;
    let limit = 0;
    let percentageUsed = 0;

    switch (eventType) {
      case UsageEventType.TRIAGE_SESSION:
        currentUsage = stats.usage.triageSessions;
        limit = stats.limits.monthlySessionLimit || 0;
        percentageUsed = stats.percentagesUsed.sessions;
        break;
      case UsageEventType.REPORT_GENERATION:
        currentUsage = stats.usage.reportsGenerated;
        limit = stats.limits.maxReportsPerMonth || 0;
        percentageUsed = stats.percentagesUsed.reports;
        break;
      case UsageEventType.DATA_EXPORT:
        currentUsage = stats.usage.dataExports;
        limit = stats.limits.maxExportsPerMonth || 0;
        percentageUsed = stats.percentagesUsed.exports;
        break;
      case UsageEventType.USER_INVITATION:
        currentUsage = stats.usage.activeUsers;
        limit = stats.limits.maxUsers;
        percentageUsed = stats.percentagesUsed.users;
        break;
    }

    return {
      type,
      feature: eventType,
      currentUsage,
      limit,
      percentageUsed,
      message: messages[eventType][type],
      recommendedAction: type === 'exceeded' ? 'Consider upgrading your plan' : 'Monitor your usage',
      upgradeRequired: type === 'exceeded'
    };
  }

  private async recordUsageEvent(event: UsageEvent): Promise<void> {
    // This could be enhanced to store events locally for analytics
    console.log('Usage event recorded:', event.eventType, event.userId);
  }

  private async updateLocalUsageCache(
    userId: string,
    eventType: UsageEventType,
    metadata: Record<string, any>
  ): Promise<void> {
    const stats = this.localCache.get(userId);
    if (stats) {
      // Update usage counters
      switch (eventType) {
        case UsageEventType.TRIAGE_SESSION:
          stats.usage.triageSessions++;
          break;
        case UsageEventType.REPORT_GENERATION:
          stats.usage.reportsGenerated++;
          break;
        case UsageEventType.DATA_EXPORT:
          stats.usage.dataExports++;
          if (metadata.dataSize) {
            stats.usage.storageUsedGB += metadata.dataSize / (1024 * 1024 * 1024);
          }
          break;
        case UsageEventType.API_CALL:
          stats.usage.apiCalls++;
          break;
      }

      // Recalculate percentages
      this.calculateUsagePercentages(stats);
      
      // Update cache
      this.localCache.set(userId, stats);
    }
  }

  private calculateUsagePercentages(stats: UsageStats): void {
    const limits = stats.limits;
    const usage = stats.usage;

    stats.percentagesUsed = {
      sessions: limits.monthlySessionLimit 
        ? Math.round((usage.triageSessions / limits.monthlySessionLimit) * 100)
        : -1,
      users: limits.maxUsers > 0 
        ? Math.round((usage.activeUsers / limits.maxUsers) * 100)
        : -1,
      reports: limits.maxReportsPerMonth 
        ? Math.round((usage.reportsGenerated / limits.maxReportsPerMonth) * 100)
        : -1,
      exports: limits.maxExportsPerMonth 
        ? Math.round((usage.dataExports / limits.maxExportsPerMonth) * 100)
        : -1,
      storage: limits.maxStorageGB 
        ? Math.round((usage.storageUsedGB / limits.maxStorageGB) * 100)
        : -1
    };
  }

  private createDefaultUsageStats(userId: string, tier: SubscriptionTier): UsageStats {
    const limits = this.TIER_LIMITS[tier];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const stats: UsageStats = {
      userId,
      subscriptionTier: tier,
      currentPeriod: {
        startDate: startOfMonth,
        endDate: endOfMonth
      },
      usage: {
        triageSessions: 0,
        apiCalls: 0,
        reportsGenerated: 0,
        dataExports: 0,
        activeUsers: 1,
        storageUsedGB: 0
      },
      limits,
      percentagesUsed: {
        sessions: 0,
        users: limits.maxUsers > 0 ? Math.round((1 / limits.maxUsers) * 100) : -1,
        reports: 0,
        exports: 0,
        storage: 0
      }
    };

    return stats;
  }

  private transformServerStatsToUsageStats(serverStats: any): UsageStats {
    // Transform server response to UsageStats format
    return {
      userId: serverStats.userId,
      subscriptionTier: serverStats.subscriptionTier,
      currentPeriod: {
        startDate: new Date(serverStats.currentPeriod.startDate),
        endDate: new Date(serverStats.currentPeriod.endDate)
      },
      usage: serverStats.usage,
      limits: this.TIER_LIMITS[serverStats.subscriptionTier],
      percentagesUsed: serverStats.percentagesUsed
    };
  }

  private async syncUsageToServer(events: UsageEvent[]): Promise<{
    success: boolean;
    syncedCount?: number;
    failedCount?: number;
  }> {
    try {
      const result = await this.apiService.post('/usage/events/batch', { events });
      
      // Mark events as synced
      events.forEach(event => {
        event.syncedToServer = true;
      });

      return {
        success: true,
        syncedCount: events.length,
        failedCount: 0
      };
    } catch (error) {
      console.error('Usage sync to server failed:', error);
      return {
        success: false,
        syncedCount: 0,
        failedCount: events.length
      };
    }
  }

  private async loadPendingEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_EVENTS);
      if (stored) {
        this.pendingEvents = JSON.parse(stored);
        console.log(`Loaded ${this.pendingEvents.length} pending usage events`);
      }
    } catch (error) {
      console.error('Failed to load pending events:', error);
      this.pendingEvents = [];
    }
  }

  private async savePendingEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_EVENTS,
        JSON.stringify(this.pendingEvents)
      );
    } catch (error) {
      console.error('Failed to save pending events:', error);
    }
  }

  private startPeriodicSync(): void {
    const intervalMs = this.monitoringConfig.batchSyncInterval * 60 * 1000;
    
    this.syncInterval = setInterval(async () => {
      if (this.isOnline && this.pendingEvents.length > 0) {
        await this.syncPendingUsage();
      }
    }, intervalMs);
  }

  private setupNetworkMonitoring(): void {
    // This would typically use NetInfo or similar to monitor connectivity
    // For now, we'll assume online status
    this.isOnline = true;
  }

  private generateEventId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const usageService = new UsageService(new (require('../api/api.service').ApiService)());
export default usageService;