import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { analyticsService, AnalyticsEventCategory, ConversionFunnelStage } from '../analytics/analytics.service';
import { SubscriptionTier } from '../payment/payment.service';

/**
 * Referral event types for analytics tracking
 */
export enum ReferralEventType {
  CODE_GENERATED = 'referral_code_generated',
  CODE_SHARED = 'referral_code_shared',
  REFERRAL_SIGNUP = 'referral_signup',
  REFERRAL_CONVERTED = 'referral_converted',
  REWARD_EARNED = 'referral_reward_earned',
  REWARD_APPLIED = 'referral_reward_applied',
  INVITATION_SENT = 'referral_invitation_sent'
}

/**
 * Referral reward types and values
 */
export enum ReferralRewardType {
  FREE_MONTH = 'free_month',
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  DOLLAR_DISCOUNT = 'dollar_discount',
  FEATURE_UNLOCK = 'feature_unlock'
}

/**
 * Referral program configuration
 */
export interface ReferralConfig {
  // Reward structure
  referrerRewards: {
    [key in ReferralRewardType]: {
      value: number;
      duration?: number; // months
      maxRedemptions?: number;
    };
  };
  referredRewards: {
    [key in ReferralRewardType]: {
      value: number;
      duration?: number; // months
      conditions?: string[];
    };
  };
  
  // Program settings
  minSubscriptionForReward: SubscriptionTier;
  maxRewards: number;
  rewardExpiration: number; // days
  shareChannels: string[];
  customMessages: Record<string, string>;
}

/**
 * Individual referral record
 */
export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId?: string;
  referredEmail?: string;
  code: string;
  status: 'pending' | 'signed_up' | 'converted' | 'expired';
  
  // Timestamps
  createdAt: string;
  signedUpAt?: string;
  convertedAt?: string;
  expiresAt: string;
  
  // Reward information
  rewardEarned?: {
    type: ReferralRewardType;
    value: number;
    appliedAt?: string;
    expiresAt?: string;
  };
  
  // Tracking data
  source?: string; // Where the referral link was shared
  metadata?: Record<string, any>;
}

/**
 * Referral program statistics
 */
export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  conversionRate: number;
  totalRewardsEarned: number;
  availableRewards: number;
  lifetimeValue: number;
  topChannels: Array<{
    channel: string;
    count: number;
    conversionRate: number;
  }>;
  monthlyStats: Array<{
    month: string;
    referrals: number;
    conversions: number;
  }>;
}

/**
 * Social sharing configuration for referrals
 */
export interface ShareConfig {
  channel: 'email' | 'sms' | 'whatsapp' | 'twitter' | 'facebook' | 'linkedin' | 'copy';
  title: string;
  message: string;
  url: string;
  hashtags?: string[];
}

/**
 * Comprehensive referral program service
 * 
 * Key Features:
 * - Unique referral code generation
 * - Multi-channel sharing (email, SMS, social media)
 * - Automatic reward tracking and application
 * - Fraud prevention and validation
 * - Analytics integration for conversion tracking
 * - Customizable reward structures
 * - Real-time referral dashboard
 * - Automated communication campaigns
 */
class ReferralService {
  private apiService: ApiService;
  private config: ReferralConfig;

  // Storage keys for offline persistence
  private readonly STORAGE_KEYS = {
    REFERRAL_CODE: 'user_referral_code',
    REFERRALS: 'user_referrals',
    STATS: 'referral_stats',
    REWARDS: 'referral_rewards',
    CONFIG: 'referral_config'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    
    // Default referral program configuration
    this.config = {
      referrerRewards: {
        [ReferralRewardType.FREE_MONTH]: {
          value: 1, // 1 free month
          maxRedemptions: 12 // Max 12 free months per year
        },
        [ReferralRewardType.PERCENTAGE_DISCOUNT]: {
          value: 20, // 20% discount
          duration: 3, // for 3 months
          maxRedemptions: 4
        }
      },
      referredRewards: {
        [ReferralRewardType.PERCENTAGE_DISCOUNT]: {
          value: 30, // 30% off
          duration: 3, // first 3 months
          conditions: ['first_subscription']
        }
      },
      minSubscriptionForReward: SubscriptionTier.PRO,
      maxRewards: 50, // Max 50 rewards per user
      rewardExpiration: 365, // Rewards expire after 1 year
      shareChannels: ['email', 'sms', 'whatsapp', 'twitter', 'facebook', 'copy'],
      customMessages: {
        default: "Try RapidTriage Pro free! I've been using it to optimize my websites and it's amazing. You'll get 30% off your first 3 months!",
        email: "Hey! I wanted to share this awesome tool I've been using for website optimization...",
        sms: "Check out RapidTriage! Get 30% off with my referral link:",
        social: "Just discovered the best website optimization tool! Get 30% off your first 3 months 🚀"
      }
    };
  }

  /**
   * Generate unique referral code for user
   * 
   * @param userId - User ID to generate code for
   * @param customCode - Optional custom code (if available)
   */
  async generateReferralCode(userId: string, customCode?: string): Promise<string> {
    try {
      // Check if user already has a code
      const existingCode = await this.getUserReferralCode(userId);
      if (existingCode) {
        return existingCode;
      }

      // Generate new code
      let referralCode: string;
      
      if (customCode) {
        // Validate custom code availability
        const isAvailable = await this.isCodeAvailable(customCode);
        if (!isAvailable) {
          throw new Error('Custom referral code is not available');
        }
        referralCode = customCode.toUpperCase();
      } else {
        // Generate automatic code
        referralCode = await this.generateUniqueCode(userId);
      }

      // Save code
      await AsyncStorage.setItem(this.STORAGE_KEYS.REFERRAL_CODE, referralCode);

      // Register with backend
      await this.apiService.post('/referrals/code', {
        userId,
        code: referralCode,
        timestamp: new Date().toISOString()
      });

      // Track code generation
      await analyticsService.track(
        ReferralEventType.CODE_GENERATED,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          referralCode,
          isCustom: !!customCode
        }
      );

      return referralCode;
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      throw error;
    }
  }

  /**
   * Get user's current referral code
   */
  async getUserReferralCode(userId: string): Promise<string | null> {
    try {
      // Check local storage first
      const localCode = await AsyncStorage.getItem(this.STORAGE_KEYS.REFERRAL_CODE);
      if (localCode) return localCode;

      // Check backend
      const response = await this.apiService.get(`/referrals/user/${userId}/code`);
      if (response.code) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.REFERRAL_CODE, response.code);
        return response.code;
      }

      return null;
    } catch (error) {
      console.error('Failed to get referral code:', error);
      return null;
    }
  }

  /**
   * Process referral signup when new user uses referral code
   */
  async processReferralSignup(
    referralCode: string, 
    newUserId: string, 
    newUserEmail: string
  ): Promise<boolean> {
    try {
      // Validate referral code
      const referralInfo = await this.validateReferralCode(referralCode);
      if (!referralInfo) {
        throw new Error('Invalid referral code');
      }

      // Create referral record
      const referral: Referral = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        referrerUserId: referralInfo.referrerUserId,
        referredUserId: newUserId,
        referredEmail: newUserEmail,
        code: referralCode,
        status: 'signed_up',
        createdAt: new Date().toISOString(),
        signedUpAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (this.config.rewardExpiration * 24 * 60 * 60 * 1000)).toISOString()
      };

      // Save referral
      await this.apiService.post('/referrals/signup', referral);

      // Track referral signup
      await analyticsService.track(
        ReferralEventType.REFERRAL_SIGNUP,
        AnalyticsEventCategory.CONVERSION,
        {
          referralCode,
          referrerUserId: referralInfo.referrerUserId,
          referredUserId: newUserId,
          referredEmail: newUserEmail
        }
      );

      // Apply referred user discount immediately
      await this.applyReferredUserReward(newUserId, referral);

      return true;
    } catch (error) {
      console.error('Failed to process referral signup:', error);
      return false;
    }
  }

  /**
   * Process referral conversion when referred user subscribes
   */
  async processReferralConversion(
    referredUserId: string, 
    subscriptionTier: SubscriptionTier,
    subscriptionValue: number
  ): Promise<boolean> {
    try {
      // Find pending referral
      const referral = await this.findReferralByReferredUser(referredUserId);
      if (!referral || referral.status !== 'signed_up') {
        return false;
      }

      // Check if subscription meets minimum requirement
      if (!this.meetsMinimumSubscription(subscriptionTier)) {
        return false;
      }

      // Update referral status
      referral.status = 'converted';
      referral.convertedAt = new Date().toISOString();

      // Calculate and apply referrer reward
      const reward = await this.calculateReferrerReward(subscriptionTier, subscriptionValue);
      referral.rewardEarned = reward;

      // Save updated referral
      await this.apiService.put(`/referrals/${referral.id}`, referral);

      // Apply reward to referrer
      await this.applyReferrerReward(referral.referrerUserId, reward);

      // Track conversion
      await analyticsService.trackConversion(
        ReferralEventType.REFERRAL_CONVERTED,
        ConversionFunnelStage.PURCHASE,
        {
          referralId: referral.id,
          referrerUserId: referral.referrerUserId,
          referredUserId,
          subscriptionTier,
          subscriptionValue,
          rewardType: reward.type,
          rewardValue: reward.value
        }
      );

      // Send notification to referrer
      await this.notifyReferrerOfConversion(referral);

      return true;
    } catch (error) {
      console.error('Failed to process referral conversion:', error);
      return false;
    }
  }

  /**
   * Get referral statistics for user
   */
  async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // Try to get cached stats first
      const cachedStats = await AsyncStorage.getItem(this.STORAGE_KEYS.STATS);
      
      // Fetch fresh stats from backend
      const stats = await this.apiService.get(`/referrals/user/${userId}/stats`);
      
      // Cache the stats
      await AsyncStorage.setItem(this.STORAGE_KEYS.STATS, JSON.stringify(stats));
      
      return stats;
    } catch (error) {
      console.error('Failed to get referral stats:', error);
      
      // Return cached stats if available
      const cachedStats = await AsyncStorage.getItem(this.STORAGE_KEYS.STATS);
      if (cachedStats) {
        return JSON.parse(cachedStats);
      }
      
      // Return empty stats as fallback
      return {
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        conversionRate: 0,
        totalRewardsEarned: 0,
        availableRewards: 0,
        lifetimeValue: 0,
        topChannels: [],
        monthlyStats: []
      };
    }
  }

  /**
   * Get user's referrals list
   */
  async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const response = await this.apiService.get(`/referrals/user/${userId}`);
      
      // Cache referrals
      await AsyncStorage.setItem(this.STORAGE_KEYS.REFERRALS, JSON.stringify(response.referrals));
      
      return response.referrals;
    } catch (error) {
      console.error('Failed to get user referrals:', error);
      
      // Return cached referrals if available
      const cachedReferrals = await AsyncStorage.getItem(this.STORAGE_KEYS.REFERRALS);
      if (cachedReferrals) {
        return JSON.parse(cachedReferrals);
      }
      
      return [];
    }
  }

  /**
   * Generate shareable content for referral
   */
  async generateShareContent(
    userId: string, 
    channel: ShareConfig['channel'],
    customMessage?: string
  ): Promise<ShareConfig> {
    try {
      const referralCode = await this.getUserReferralCode(userId);
      if (!referralCode) {
        throw new Error('No referral code found');
      }

      const referralUrl = `https://rapidtriage.me/signup?ref=${referralCode}`;
      
      const messages = {
        email: customMessage || this.config.customMessages.email,
        sms: customMessage || this.config.customMessages.sms,
        whatsapp: customMessage || this.config.customMessages.default,
        twitter: customMessage || this.config.customMessages.social,
        facebook: customMessage || this.config.customMessages.social,
        linkedin: customMessage || this.config.customMessages.social,
        copy: customMessage || this.config.customMessages.default
      };

      const shareConfig: ShareConfig = {
        channel,
        title: 'Try RapidTriage Pro - 30% Off!',
        message: `${messages[channel]} ${referralUrl}`,
        url: referralUrl
      };

      if (channel === 'twitter') {
        shareConfig.hashtags = ['WebDev', 'Performance', 'SEO', 'WebOptimization'];
      }

      return shareConfig;
    } catch (error) {
      console.error('Failed to generate share content:', error);
      throw error;
    }
  }

  /**
   * Track referral sharing activity
   */
  async trackReferralShare(
    userId: string, 
    channel: string, 
    referralCode?: string
  ): Promise<void> {
    try {
      await analyticsService.track(
        ReferralEventType.CODE_SHARED,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          channel,
          referralCode: referralCode || await this.getUserReferralCode(userId),
          timestamp: new Date().toISOString()
        }
      );

      // Track with backend for detailed analytics
      await this.apiService.post('/referrals/share', {
        userId,
        channel,
        referralCode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track referral share:', error);
    }
  }

  /**
   * Send referral invitation via email
   */
  async sendReferralInvitation(
    userId: string, 
    recipientEmail: string, 
    personalMessage?: string
  ): Promise<boolean> {
    try {
      const referralCode = await this.getUserReferralCode(userId);
      if (!referralCode) {
        throw new Error('No referral code found');
      }

      const shareContent = await this.generateShareContent(userId, 'email', personalMessage);

      await this.apiService.post('/referrals/invite', {
        referrerUserId: userId,
        recipientEmail,
        referralCode,
        message: shareContent.message,
        timestamp: new Date().toISOString()
      });

      // Track invitation
      await analyticsService.track(
        ReferralEventType.INVITATION_SENT,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          recipientEmail,
          referralCode,
          hasPersonalMessage: !!personalMessage
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to send referral invitation:', error);
      return false;
    }
  }

  // Private helper methods

  private async generateUniqueCode(userId: string): Promise<string> {
    // Generate code based on user info and random string
    const userHash = userId.substr(-4).toUpperCase();
    const randomString = Math.random().toString(36).substr(2, 4).toUpperCase();
    const timestamp = Date.now().toString(36).substr(-2).toUpperCase();
    
    const code = `${userHash}${randomString}${timestamp}`;
    
    // Ensure uniqueness
    const isAvailable = await this.isCodeAvailable(code);
    if (!isAvailable) {
      // Regenerate if not unique
      return this.generateUniqueCode(userId);
    }
    
    return code;
  }

  private async isCodeAvailable(code: string): Promise<boolean> {
    try {
      const response = await this.apiService.get(`/referrals/code/${code}/available`);
      return response.available;
    } catch (error) {
      console.error('Failed to check code availability:', error);
      return false;
    }
  }

  private async validateReferralCode(code: string): Promise<{ referrerUserId: string } | null> {
    try {
      const response = await this.apiService.get(`/referrals/code/${code}/validate`);
      return response.valid ? { referrerUserId: response.referrerUserId } : null;
    } catch (error) {
      console.error('Failed to validate referral code:', error);
      return null;
    }
  }

  private async findReferralByReferredUser(referredUserId: string): Promise<Referral | null> {
    try {
      const response = await this.apiService.get(`/referrals/referred/${referredUserId}`);
      return response.referral || null;
    } catch (error) {
      console.error('Failed to find referral:', error);
      return null;
    }
  }

  private meetsMinimumSubscription(tier: SubscriptionTier): boolean {
    const tierHierarchy = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.PRO]: 1,
      [SubscriptionTier.TEAM]: 2,
      [SubscriptionTier.ENTERPRISE]: 3
    };

    return tierHierarchy[tier] >= tierHierarchy[this.config.minSubscriptionForReward];
  }

  private async calculateReferrerReward(
    subscriptionTier: SubscriptionTier, 
    subscriptionValue: number
  ): Promise<Referral['rewardEarned']> {
    // Default to free month reward
    const reward = this.config.referrerRewards[ReferralRewardType.FREE_MONTH];
    
    return {
      type: ReferralRewardType.FREE_MONTH,
      value: reward.value,
      expiresAt: new Date(Date.now() + (this.config.rewardExpiration * 24 * 60 * 60 * 1000)).toISOString()
    };
  }

  private async applyReferrerReward(
    referrerUserId: string, 
    reward: Referral['rewardEarned']
  ): Promise<void> {
    try {
      await this.apiService.post('/referrals/reward/apply', {
        userId: referrerUserId,
        reward,
        timestamp: new Date().toISOString()
      });

      // Track reward application
      await analyticsService.track(
        ReferralEventType.REWARD_APPLIED,
        AnalyticsEventCategory.CONVERSION,
        {
          userId: referrerUserId,
          rewardType: reward?.type,
          rewardValue: reward?.value
        }
      );
    } catch (error) {
      console.error('Failed to apply referrer reward:', error);
    }
  }

  private async applyReferredUserReward(
    referredUserId: string, 
    referral: Referral
  ): Promise<void> {
    try {
      const referredReward = this.config.referredRewards[ReferralRewardType.PERCENTAGE_DISCOUNT];
      
      await this.apiService.post('/referrals/discount/apply', {
        userId: referredUserId,
        discountPercentage: referredReward.value,
        duration: referredReward.duration,
        referralId: referral.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to apply referred user reward:', error);
    }
  }

  private async notifyReferrerOfConversion(referral: Referral): Promise<void> {
    try {
      await this.apiService.post('/notifications/referral-converted', {
        userId: referral.referrerUserId,
        referralId: referral.id,
        rewardEarned: referral.rewardEarned
      });
    } catch (error) {
      console.error('Failed to notify referrer:', error);
    }
  }
}

// Export singleton instance
const apiService = new (require('../api/api.service').ApiService)();
export const referralService = new ReferralService(apiService);
export default referralService;