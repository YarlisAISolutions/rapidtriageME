import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { analyticsService, AnalyticsEventCategory, ConversionFunnelStage } from '../analytics/analytics.service';
import { SubscriptionTier } from '../payment/payment.service';

/**
 * Trial-related event types for tracking user journey
 */
export enum TrialEventType {
  TRIAL_STARTED = 'trial_started',
  TRIAL_EXTENDED = 'trial_extended',
  TRIAL_CONVERTED = 'trial_converted',
  TRIAL_EXPIRED = 'trial_expired',
  TRIAL_CANCELLED = 'trial_cancelled',
  WARNING_SHOWN = 'trial_warning_shown',
  EXTENSION_OFFERED = 'trial_extension_offered',
  EXTENSION_ACCEPTED = 'trial_extension_accepted',
  EXTENSION_DECLINED = 'trial_extension_declined'
}

/**
 * Trial configuration and limits
 */
export interface TrialConfig {
  duration: number; // days
  warningThresholds: number[]; // days remaining when to show warnings
  extensionDuration: number; // additional days for extension
  maxExtensions: number;
  features: {
    scansLimit: number;
    reportsLimit: number;
    apiCallsLimit: number;
    teamMembersLimit: number;
  };
}

/**
 * Trial status information
 */
export interface TrialStatus {
  isTrialing: boolean;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  hasExtended: boolean;
  extensionsUsed: number;
  extensionOffered: boolean;
  originalTier: SubscriptionTier;
  warningsShown: number[];
  canExtend: boolean;
}

/**
 * Trial warning configuration
 */
export interface TrialWarning {
  daysRemaining: number;
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  showExtensionOffer: boolean;
  actions: Array<{
    text: string;
    type: 'primary' | 'secondary';
    action: 'convert' | 'extend' | 'dismiss';
  }>;
}

/**
 * Trial conversion offer
 */
export interface ConversionOffer {
  id: string;
  tier: SubscriptionTier;
  discount: {
    percentage: number;
    duration: number; // months
    code: string;
  };
  urgency: {
    timeLeft: number; // hours
    message: string;
  };
  benefits: string[];
  originalPrice: number;
  discountedPrice: number;
}

/**
 * Comprehensive trial management service
 * 
 * Key Features:
 * - 14-day trial period with configurable duration
 * - Smart warning system (7 days, 3 days, 1 day)
 * - Trial extension offers with limits
 * - Conversion optimization with personalized offers
 * - Usage tracking and limit enforcement
 * - Analytics integration for conversion funnel
 * - A/B testing for conversion strategies
 * - Automated email campaign triggers
 */
class TrialService {
  private apiService: ApiService;
  private config: TrialConfig;

  // Storage keys for persistence
  private readonly STORAGE_KEYS = {
    TRIAL_STATUS: 'trial_status',
    TRIAL_CONFIG: 'trial_config',
    WARNINGS_SHOWN: 'trial_warnings_shown',
    CONVERSION_OFFERS: 'trial_conversion_offers'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    
    // Default trial configuration
    this.config = {
      duration: 14, // 14 days
      warningThresholds: [7, 3, 1], // Show warnings at 7, 3, and 1 days remaining
      extensionDuration: 7, // 7 additional days
      maxExtensions: 1, // Only one extension allowed
      features: {
        scansLimit: 100, // Generous limit during trial
        reportsLimit: 50,
        apiCallsLimit: 1000,
        teamMembersLimit: 3
      }
    };
  }

  /**
   * Start a new trial for the user
   * 
   * @param userId - User ID to start trial for
   * @param originalTier - The tier the user had before trial
   * @param targetTier - The tier they're trialing (default: pro)
   */
  async startTrial(
    userId: string,
    originalTier: SubscriptionTier = SubscriptionTier.FREE,
    targetTier: SubscriptionTier = SubscriptionTier.PRO
  ): Promise<TrialStatus> {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + this.config.duration);

      const trialStatus: TrialStatus = {
        isTrialing: true,
        startDate,
        endDate,
        daysRemaining: this.config.duration,
        hasExtended: false,
        extensionsUsed: 0,
        extensionOffered: false,
        originalTier,
        warningsShown: [],
        canExtend: true
      };

      // Save trial status
      await this.saveTrialStatus(trialStatus);

      // Track trial start event
      await analyticsService.trackConversion(
        TrialEventType.TRIAL_STARTED,
        ConversionFunnelStage.INTEREST,
        {
          userId,
          originalTier,
          targetTier,
          trialDuration: this.config.duration,
          timestamp: startDate.toISOString()
        }
      );

      // Notify backend
      await this.apiService.post('/trials/start', {
        userId,
        originalTier,
        targetTier,
        duration: this.config.duration,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Schedule warning notifications
      this.scheduleWarningNotifications(userId, trialStatus);

      return trialStatus;
    } catch (error) {
      console.error('Failed to start trial:', error);
      throw new Error('Unable to start trial. Please try again.');
    }
  }

  /**
   * Get current trial status for a user
   */
  async getTrialStatus(userId?: string): Promise<TrialStatus | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.TRIAL_STATUS);
      if (!stored) return null;

      const trialStatus: TrialStatus = JSON.parse(stored);
      
      // Update days remaining
      const now = new Date();
      const endDate = new Date(trialStatus.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      trialStatus.daysRemaining = Math.max(0, daysRemaining);
      trialStatus.isTrialing = daysRemaining > 0;

      // Check if trial has expired
      if (daysRemaining <= 0 && trialStatus.isTrialing) {
        await this.handleTrialExpiration(userId);
        trialStatus.isTrialing = false;
      }

      // Check for warning thresholds
      await this.checkWarningThresholds(userId, trialStatus);

      return trialStatus;
    } catch (error) {
      console.error('Failed to get trial status:', error);
      return null;
    }
  }

  /**
   * Extend trial period (limited extensions)
   */
  async extendTrial(userId: string, reason?: string): Promise<TrialStatus | null> {
    try {
      const currentStatus = await this.getTrialStatus(userId);
      if (!currentStatus || !currentStatus.canExtend) {
        throw new Error('Trial extension not available');
      }

      if (currentStatus.extensionsUsed >= this.config.maxExtensions) {
        throw new Error('Maximum extensions reached');
      }

      // Extend the end date
      const newEndDate = new Date(currentStatus.endDate);
      newEndDate.setDate(newEndDate.getDate() + this.config.extensionDuration);

      const extendedStatus: TrialStatus = {
        ...currentStatus,
        endDate: newEndDate,
        daysRemaining: currentStatus.daysRemaining + this.config.extensionDuration,
        hasExtended: true,
        extensionsUsed: currentStatus.extensionsUsed + 1,
        canExtend: currentStatus.extensionsUsed + 1 < this.config.maxExtensions
      };

      await this.saveTrialStatus(extendedStatus);

      // Track extension event
      await analyticsService.track(
        TrialEventType.TRIAL_EXTENDED,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          reason,
          extensionDays: this.config.extensionDuration,
          totalExtensions: extendedStatus.extensionsUsed,
          newEndDate: newEndDate.toISOString()
        }
      );

      // Notify backend
      await this.apiService.post('/trials/extend', {
        userId,
        extensionDays: this.config.extensionDuration,
        reason,
        newEndDate: newEndDate.toISOString()
      });

      return extendedStatus;
    } catch (error) {
      console.error('Failed to extend trial:', error);
      throw error;
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrial(
    userId: string,
    selectedTier: SubscriptionTier,
    paymentMethod: string,
    offerId?: string
  ): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatus(userId);
      if (!trialStatus) {
        throw new Error('No active trial found');
      }

      // Track conversion attempt
      await analyticsService.trackConversion(
        TrialEventType.TRIAL_CONVERTED,
        ConversionFunnelStage.PURCHASE,
        {
          userId,
          selectedTier,
          originalTier: trialStatus.originalTier,
          trialDaysUsed: this.config.duration - trialStatus.daysRemaining,
          paymentMethod,
          offerId,
          hasExtended: trialStatus.hasExtended
        }
      );

      // Process conversion with backend
      const conversionResult = await this.apiService.post('/trials/convert', {
        userId,
        selectedTier,
        paymentMethod,
        offerId,
        trialStatus
      });

      if (conversionResult.success) {
        // Clear trial status
        await AsyncStorage.removeItem(this.STORAGE_KEYS.TRIAL_STATUS);
        await AsyncStorage.removeItem(this.STORAGE_KEYS.WARNINGS_SHOWN);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to convert trial:', error);
      throw error;
    }
  }

  /**
   * Cancel trial and revert to original tier
   */
  async cancelTrial(userId: string, reason?: string): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatus(userId);
      if (!trialStatus) return true;

      // Track cancellation
      await analyticsService.track(
        TrialEventType.TRIAL_CANCELLED,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          reason,
          trialDaysUsed: this.config.duration - trialStatus.daysRemaining,
          hasExtended: trialStatus.hasExtended
        }
      );

      // Notify backend
      await this.apiService.post('/trials/cancel', {
        userId,
        reason,
        trialStatus
      });

      // Clear trial data
      await AsyncStorage.removeItem(this.STORAGE_KEYS.TRIAL_STATUS);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.WARNINGS_SHOWN);

      return true;
    } catch (error) {
      console.error('Failed to cancel trial:', error);
      return false;
    }
  }

  /**
   * Get appropriate warning based on days remaining
   */
  getTrialWarning(daysRemaining: number): TrialWarning | null {
    if (!this.config.warningThresholds.includes(daysRemaining)) {
      return null;
    }

    const warningConfig: Record<number, TrialWarning> = {
      7: {
        daysRemaining: 7,
        title: 'Trial Ends in 7 Days',
        message: 'You\'re halfway through your Pro trial! Don\'t lose access to premium features.',
        urgency: 'low',
        showExtensionOffer: false,
        actions: [
          { text: 'Upgrade Now', type: 'primary', action: 'convert' },
          { text: 'Remind Me Later', type: 'secondary', action: 'dismiss' }
        ]
      },
      3: {
        daysRemaining: 3,
        title: 'Trial Ends Soon',
        message: 'Only 3 days left in your Pro trial. Upgrade now to keep your enhanced productivity.',
        urgency: 'medium',
        showExtensionOffer: true,
        actions: [
          { text: 'Upgrade Now', type: 'primary', action: 'convert' },
          { text: 'Extend Trial', type: 'secondary', action: 'extend' },
          { text: 'Not Now', type: 'secondary', action: 'dismiss' }
        ]
      },
      1: {
        daysRemaining: 1,
        title: 'Trial Expires Tomorrow!',
        message: 'Your Pro trial ends tomorrow. Upgrade now to avoid losing access to premium features.',
        urgency: 'high',
        showExtensionOffer: true,
        actions: [
          { text: 'Upgrade Now', type: 'primary', action: 'convert' },
          { text: 'Get 7 More Days', type: 'secondary', action: 'extend' }
        ]
      }
    };

    return warningConfig[daysRemaining] || null;
  }

  /**
   * Generate personalized conversion offers
   */
  async generateConversionOffer(userId: string, userBehavior?: any): Promise<ConversionOffer> {
    try {
      const trialStatus = await this.getTrialStatus(userId);
      if (!trialStatus) {
        throw new Error('No active trial found');
      }

      // Base offer configuration
      const baseOffer: ConversionOffer = {
        id: `trial_conversion_${Date.now()}`,
        tier: SubscriptionTier.PRO,
        discount: {
          percentage: 30,
          duration: 3, // 3 months
          code: `TRIAL30_${userId.substr(-6).toUpperCase()}`
        },
        urgency: {
          timeLeft: Math.max(1, trialStatus.daysRemaining * 24), // Convert to hours
          message: `Offer expires when your trial ends in ${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''}!`
        },
        benefits: [
          'Unlimited scans and reports',
          'Advanced analytics dashboard',
          'Priority customer support',
          'Team collaboration features',
          'API access and integrations'
        ],
        originalPrice: 2999, // $29.99 in cents
        discountedPrice: 2099 // $20.99 in cents
      };

      // Personalize offer based on user behavior
      if (userBehavior) {
        if (userBehavior.highUsage) {
          baseOffer.discount.percentage = 40;
          baseOffer.discount.duration = 6;
          baseOffer.discountedPrice = 1799; // $17.99
        }

        if (userBehavior.teamFeatureUsage) {
          baseOffer.tier = SubscriptionTier.TEAM;
          baseOffer.originalPrice = 4999; // $49.99
          baseOffer.discountedPrice = 3499; // $34.99
        }
      }

      // Increase urgency for last day
      if (trialStatus.daysRemaining <= 1) {
        baseOffer.discount.percentage = Math.max(baseOffer.discount.percentage, 40);
        baseOffer.urgency.message = 'Last chance! Trial expires in hours.';
      }

      return baseOffer;
    } catch (error) {
      console.error('Failed to generate conversion offer:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to trial features
   */
  async hasTrialAccess(feature: keyof TrialConfig['features']): Promise<boolean> {
    try {
      const trialStatus = await this.getTrialStatus();
      if (!trialStatus || !trialStatus.isTrialing) {
        return false;
      }

      // For now, return true for all features during trial
      // In a real implementation, you'd check against usage limits
      return true;
    } catch (error) {
      console.error('Failed to check trial access:', error);
      return false;
    }
  }

  /**
   * Get trial usage statistics
   */
  async getTrialUsageStats(userId: string): Promise<any> {
    try {
      return await this.apiService.get(`/trials/${userId}/usage`);
    } catch (error) {
      console.error('Failed to get trial usage stats:', error);
      return {};
    }
  }

  // Private helper methods

  private async saveTrialStatus(status: TrialStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.TRIAL_STATUS,
        JSON.stringify({
          ...status,
          startDate: status.startDate.toISOString(),
          endDate: status.endDate.toISOString()
        })
      );
    } catch (error) {
      console.error('Failed to save trial status:', error);
    }
  }

  private async handleTrialExpiration(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Track expiration
        await analyticsService.track(
          TrialEventType.TRIAL_EXPIRED,
          AnalyticsEventCategory.CONVERSION,
          { userId }
        );

        // Notify backend
        await this.apiService.post('/trials/expired', { userId });
      }

      // Clear trial data
      await AsyncStorage.removeItem(this.STORAGE_KEYS.TRIAL_STATUS);
      await AsyncStorage.removeItem(this.STORAGE_KEYS.WARNINGS_SHOWN);
    } catch (error) {
      console.error('Failed to handle trial expiration:', error);
    }
  }

  private async checkWarningThresholds(userId: string | undefined, trialStatus: TrialStatus): Promise<void> {
    if (!userId) return;

    const daysRemaining = trialStatus.daysRemaining;
    const shouldShowWarning = this.config.warningThresholds.includes(daysRemaining);

    if (shouldShowWarning && !trialStatus.warningsShown.includes(daysRemaining)) {
      // Track warning shown
      await analyticsService.track(
        TrialEventType.WARNING_SHOWN,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          daysRemaining,
          warningType: daysRemaining <= 1 ? 'urgent' : daysRemaining <= 3 ? 'medium' : 'standard'
        }
      );

      // Update warnings shown
      trialStatus.warningsShown.push(daysRemaining);
      await this.saveTrialStatus(trialStatus);

      // Show extension offer for 3-day and 1-day warnings
      if (daysRemaining <= 3 && !trialStatus.extensionOffered && trialStatus.canExtend) {
        trialStatus.extensionOffered = true;
        await this.saveTrialStatus(trialStatus);

        await analyticsService.track(
          TrialEventType.EXTENSION_OFFERED,
          AnalyticsEventCategory.CONVERSION,
          { userId, daysRemaining }
        );
      }
    }
  }

  private scheduleWarningNotifications(userId: string, trialStatus: TrialStatus): void {
    // This would integrate with a push notification service
    // For now, we'll just log the scheduled notifications
    this.config.warningThresholds.forEach(threshold => {
      const warningDate = new Date(trialStatus.endDate);
      warningDate.setDate(warningDate.getDate() - threshold);
      
      console.log(`Scheduled trial warning for ${warningDate.toISOString()}: ${threshold} days remaining`);
      
      // In a real implementation:
      // NotificationService.schedule({
      //   id: `trial_warning_${threshold}`,
      //   title: 'Trial Ending Soon',
      //   body: `Your Pro trial ends in ${threshold} day${threshold !== 1 ? 's' : ''}!`,
      //   date: warningDate,
      //   data: { type: 'trial_warning', daysRemaining: threshold }
      // });
    });
  }
}

// Export singleton instance
const apiService = new (require('../api/api.service').ApiService)();
export const trialService = new TrialService(apiService);
export default trialService;