import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { analyticsService, AnalyticsEventCategory } from '../analytics/analytics.service';
import { SubscriptionTier } from '../payment/payment.service';

/**
 * Email marketing event types for analytics tracking
 */
export enum EmailMarketingEventType {
  EMAIL_CAPTURED = 'email_captured',
  SUBSCRIPTION_UPDATED = 'email_subscription_updated',
  CAMPAIGN_SENT = 'email_campaign_sent',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  UNSUBSCRIBED = 'email_unsubscribed',
  PREFERENCE_UPDATED = 'email_preference_updated',
  CAMPAIGN_CONVERTED = 'email_campaign_converted'
}

/**
 * Email subscription preferences
 */
export interface EmailPreferences {
  isSubscribed: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'minimal';
  contentTypes: {
    productUpdates: boolean;
    tips: boolean;
    casestudies: boolean;
    newsletters: boolean;
    promotions: boolean;
    surveys: boolean;
  };
  communicationChannels: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
  timezone: string;
  language: string;
  optInDate: string;
  lastUpdated: string;
}

/**
 * Email campaign configuration
 */
export interface EmailCampaign {
  id: string;
  name: string;
  type: 'welcome' | 'onboarding' | 'feature_education' | 'upgrade_nurture' | 'win_back' | 'newsletter' | 'promotional';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  
  // Targeting
  targetSegment: {
    subscriptionTiers?: SubscriptionTier[];
    signupDateRange?: { start: string; end: string };
    engagementLevel?: 'low' | 'medium' | 'high';
    lastActiveRange?: { start: string; end: string };
    hasCompletedOnboarding?: boolean;
    customCriteria?: Record<string, any>;
  };
  
  // Content
  subject: string;
  preheader?: string;
  content: {
    html: string;
    text: string;
    variables?: Record<string, string>;
  };
  
  // Scheduling
  schedule: {
    type: 'immediate' | 'scheduled' | 'drip' | 'trigger_based';
    sendDate?: string;
    dripDelay?: number; // hours
    triggerEvent?: string;
    timezone?: string;
  };
  
  // Tracking
  trackingPixel: boolean;
  utmParameters?: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
  };
  
  // Metrics
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
    conversions: number;
    revenue: number;
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Email drip sequence configuration
 */
export interface DripSequence {
  id: string;
  name: string;
  trigger: 'signup' | 'trial_started' | 'first_scan' | 'inactive' | 'upgrade';
  isActive: boolean;
  
  emails: Array<{
    id: string;
    delay: number; // hours after trigger or previous email
    subject: string;
    templateId: string;
    conditions?: {
      hasNotUpgraded?: boolean;
      hasNotUsedFeature?: string;
      minDaysSinceSignup?: number;
    };
  }>;
  
  metrics: {
    enrolled: number;
    completed: number;
    optedOut: number;
    conversions: number;
  };
}

/**
 * Email capture point configuration
 */
export interface EmailCapturePoint {
  id: string;
  location: 'signup' | 'checkout' | 'feature_gate' | 'exit_intent' | 'content_download' | 'newsletter_signup';
  trigger: 'immediate' | 'delay' | 'scroll_percentage' | 'time_on_page' | 'user_action';
  
  // Display configuration
  design: {
    type: 'modal' | 'banner' | 'slide_in' | 'embedded';
    position?: 'center' | 'top' | 'bottom' | 'corner';
    style: 'minimal' | 'branded' | 'promotional';
  };
  
  // Content
  headline: string;
  description: string;
  incentive?: {
    type: 'discount' | 'free_resource' | 'early_access';
    value: string;
    description: string;
  };
  placeholder: string;
  ctaText: string;
  
  // Behavior
  showFrequency: 'once' | 'session' | 'daily' | 'always';
  exitIntentEnabled: boolean;
  mobileOptimized: boolean;
  
  // Metrics
  metrics: {
    shown: number;
    submitted: number;
    dismissed: number;
    conversionRate: number;
  };
  
  isActive: boolean;
}

/**
 * User email interaction tracking
 */
export interface EmailInteraction {
  id: string;
  userId: string;
  email: string;
  campaignId: string;
  
  // Interaction data
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  unsubscribedAt?: string;
  
  // Context
  userAgent?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  
  // Conversion tracking
  convertedAt?: string;
  conversionValue?: number;
  conversionType?: string;
}

/**
 * Email marketing analytics
 */
export interface EmailMarketingAnalytics {
  overview: {
    totalSubscribers: number;
    activeSubscribers: number;
    growthRate: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
    totalRevenue: number;
  };
  
  campaigns: {
    sent: number;
    active: number;
    avgOpenRate: number;
    avgClickRate: number;
    topPerforming: Array<{
      campaignId: string;
      name: string;
      openRate: number;
      clickRate: number;
      conversions: number;
    }>;
  };
  
  segments: Array<{
    name: string;
    size: number;
    engagement: number;
    conversionRate: number;
  }>;
  
  trends: Array<{
    date: string;
    subscribers: number;
    opens: number;
    clicks: number;
    conversions: number;
  }>;
}

/**
 * Comprehensive email marketing service for user engagement and conversion
 * 
 * Key Features:
 * - Email capture points throughout the app
 * - Automated drip campaigns and sequences
 * - User segmentation and targeting
 * - Personalized content and recommendations
 * - A/B testing for email campaigns
 * - Advanced analytics and reporting
 * - GDPR/CCPA compliance features
 * - Integration with growth metrics
 */
class EmailMarketingService {
  private apiService: ApiService;
  private emailPreferences: Map<string, EmailPreferences> = new Map();
  private activeCampaigns: Map<string, EmailCampaign> = new Map();
  private dripSequences: Map<string, DripSequence> = new Map();

  // Storage keys for offline persistence
  private readonly STORAGE_KEYS = {
    PREFERENCES: 'email_preferences',
    CAMPAIGNS: 'email_campaigns',
    INTERACTIONS: 'email_interactions',
    CAPTURE_POINTS: 'email_capture_points'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    this.initializeDefaultSequences();
  }

  /**
   * Initialize default drip sequences
   */
  private initializeDefaultSequences(): void {
    // Welcome series (5 emails)
    this.dripSequences.set('welcome_series', {
      id: 'welcome_series',
      name: 'Welcome Series',
      trigger: 'signup',
      isActive: true,
      emails: [
        {
          id: 'welcome_1',
          delay: 0, // Immediate
          subject: 'Welcome to RapidTriage! Let\'s get started',
          templateId: 'welcome_email_1'
        },
        {
          id: 'welcome_2',
          delay: 24, // 24 hours later
          subject: 'Your first website scan awaits',
          templateId: 'welcome_email_2'
        },
        {
          id: 'welcome_3',
          delay: 72, // 3 days after signup
          subject: 'Unlock advanced features with Pro',
          templateId: 'welcome_email_3',
          conditions: { hasNotUpgraded: true }
        },
        {
          id: 'welcome_4',
          delay: 168, // 1 week after signup
          subject: '5 pro tips for website optimization',
          templateId: 'tips_email_1'
        },
        {
          id: 'welcome_5',
          delay: 336, // 2 weeks after signup
          subject: 'Join our community of optimization experts',
          templateId: 'community_email_1'
        }
      ],
      metrics: {
        enrolled: 0,
        completed: 0,
        optedOut: 0,
        conversions: 0
      }
    });

    // Upgrade nurture sequence
    this.dripSequences.set('upgrade_nurture', {
      id: 'upgrade_nurture',
      name: 'Upgrade Nurture',
      trigger: 'first_scan',
      isActive: true,
      emails: [
        {
          id: 'nurture_1',
          delay: 24, // 24 hours after first scan
          subject: 'See what you\'re missing with Pro features',
          templateId: 'nurture_email_1',
          conditions: { hasNotUpgraded: true }
        },
        {
          id: 'nurture_2',
          delay: 120, // 5 days later
          subject: 'Limited time: 30% off Pro subscription',
          templateId: 'nurture_email_2',
          conditions: { hasNotUpgraded: true, minDaysSinceSignup: 3 }
        },
        {
          id: 'nurture_3',
          delay: 168, // 7 days later
          subject: 'Last chance: Pro features expire soon',
          templateId: 'nurture_email_3',
          conditions: { hasNotUpgraded: true }
        }
      ],
      metrics: {
        enrolled: 0,
        completed: 0,
        optedOut: 0,
        conversions: 0
      }
    });

    // Win-back campaign
    this.dripSequences.set('win_back', {
      id: 'win_back',
      name: 'Win Back Campaign',
      trigger: 'inactive',
      isActive: true,
      emails: [
        {
          id: 'winback_1',
          delay: 0, // Immediate when triggered
          subject: 'We miss you! Come back and save 50%',
          templateId: 'winback_email_1'
        },
        {
          id: 'winback_2',
          delay: 72, // 3 days later
          subject: 'Don\'t let your website fall behind',
          templateId: 'winback_email_2'
        },
        {
          id: 'winback_3',
          delay: 168, // 1 week later
          subject: 'Final reminder: Your account will be archived',
          templateId: 'winback_email_3'
        }
      ],
      metrics: {
        enrolled: 0,
        completed: 0,
        optedOut: 0,
        conversions: 0
      }
    });
  }

  /**
   * Capture user email with preferences
   */
  async captureEmail(
    email: string,
    userId?: string,
    capturePoint?: string,
    preferences?: Partial<EmailPreferences>,
    incentive?: string
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      // Default preferences
      const defaultPreferences: EmailPreferences = {
        isSubscribed: true,
        frequency: 'weekly',
        contentTypes: {
          productUpdates: true,
          tips: true,
          casestudies: false,
          newsletters: true,
          promotions: false,
          surveys: false
        },
        communicationChannels: {
          email: true,
          inApp: false,
          push: false
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        optInDate: now,
        lastUpdated: now,
        ...preferences
      };

      // Save preferences
      if (userId) {
        this.emailPreferences.set(userId, defaultPreferences);
        await AsyncStorage.setItem(
          `${this.STORAGE_KEYS.PREFERENCES}_${userId}`,
          JSON.stringify(defaultPreferences)
        );
      }

      // Track email capture
      await analyticsService.track(
        EmailMarketingEventType.EMAIL_CAPTURED,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          email,
          capturePoint,
          incentive,
          preferences: defaultPreferences
        }
      );

      // Submit to backend
      await this.apiService.post('/email-marketing/capture', {
        email,
        userId,
        capturePoint,
        preferences: defaultPreferences,
        incentive,
        timestamp: now
      });

      // Start welcome sequence
      if (userId) {
        await this.enrollInDripSequence(userId, 'welcome_series');
      }

      return true;
    } catch (error) {
      console.error('Failed to capture email:', error);
      return false;
    }
  }

  /**
   * Update user email preferences
   */
  async updateEmailPreferences(
    userId: string,
    preferences: Partial<EmailPreferences>
  ): Promise<boolean> {
    try {
      const existingPreferences = await this.getEmailPreferences(userId);
      const updatedPreferences = {
        ...existingPreferences,
        ...preferences,
        lastUpdated: new Date().toISOString()
      };

      // Save preferences
      this.emailPreferences.set(userId, updatedPreferences);
      await AsyncStorage.setItem(
        `${this.STORAGE_KEYS.PREFERENCES}_${userId}`,
        JSON.stringify(updatedPreferences)
      );

      // Track preference update
      await analyticsService.track(
        EmailMarketingEventType.PREFERENCE_UPDATED,
        AnalyticsEventCategory.USER_BEHAVIOR,
        {
          userId,
          preferences: updatedPreferences,
          changes: preferences
        }
      );

      // Update backend
      await this.apiService.put(`/email-marketing/preferences/${userId}`, updatedPreferences);

      return true;
    } catch (error) {
      console.error('Failed to update email preferences:', error);
      return false;
    }
  }

  /**
   * Get user email preferences
   */
  async getEmailPreferences(userId: string): Promise<EmailPreferences> {
    try {
      // Check cache first
      if (this.emailPreferences.has(userId)) {
        return this.emailPreferences.get(userId)!;
      }

      // Load from storage
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEYS.PREFERENCES}_${userId}`);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.emailPreferences.set(userId, preferences);
        return preferences;
      }

      // Fetch from backend
      const response = await this.apiService.get(`/email-marketing/preferences/${userId}`);
      if (response.preferences) {
        this.emailPreferences.set(userId, response.preferences);
        await AsyncStorage.setItem(
          `${this.STORAGE_KEYS.PREFERENCES}_${userId}`,
          JSON.stringify(response.preferences)
        );
        return response.preferences;
      }

      // Return default preferences
      const defaultPreferences: EmailPreferences = {
        isSubscribed: false,
        frequency: 'weekly',
        contentTypes: {
          productUpdates: false,
          tips: false,
          casestudies: false,
          newsletters: false,
          promotions: false,
          surveys: false
        },
        communicationChannels: {
          email: false,
          inApp: false,
          push: false
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        optInDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      return defaultPreferences;
    } catch (error) {
      console.error('Failed to get email preferences:', error);
      return {
        isSubscribed: false,
        frequency: 'weekly',
        contentTypes: {
          productUpdates: false,
          tips: false,
          casestudies: false,
          newsletters: false,
          promotions: false,
          surveys: false
        },
        communicationChannels: {
          email: false,
          inApp: false,
          push: false
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        optInDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Enroll user in a drip sequence
   */
  async enrollInDripSequence(userId: string, sequenceId: string): Promise<boolean> {
    try {
      const sequence = this.dripSequences.get(sequenceId);
      if (!sequence) {
        throw new Error('Drip sequence not found');
      }

      const preferences = await this.getEmailPreferences(userId);
      if (!preferences.isSubscribed) {
        return false; // Don't enroll unsubscribed users
      }

      // Enroll with backend
      await this.apiService.post('/email-marketing/drip/enroll', {
        userId,
        sequenceId,
        enrolledAt: new Date().toISOString()
      });

      // Update metrics
      sequence.metrics.enrolled++;

      // Track enrollment
      await analyticsService.track(
        EmailMarketingEventType.CAMPAIGN_SENT,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          campaignType: 'drip_sequence',
          sequenceId,
          emailCount: sequence.emails.length
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to enroll in drip sequence:', error);
      return false;
    }
  }

  /**
   * Trigger drip sequence based on user action
   */
  async triggerDripSequence(
    userId: string,
    trigger: DripSequence['trigger'],
    context?: any
  ): Promise<void> {
    try {
      // Find sequences with matching trigger
      const matchingSequences = Array.from(this.dripSequences.values()).filter(
        sequence => sequence.trigger === trigger && sequence.isActive
      );

      for (const sequence of matchingSequences) {
        await this.enrollInDripSequence(userId, sequence.id);
      }
    } catch (error) {
      console.error('Failed to trigger drip sequence:', error);
    }
  }

  /**
   * Send newsletter signup confirmation
   */
  async sendNewsletterConfirmation(userId: string, email: string): Promise<boolean> {
    try {
      await this.apiService.post('/email-marketing/newsletter/confirm', {
        userId,
        email,
        timestamp: new Date().toISOString()
      });

      // Track newsletter signup
      await analyticsService.track(
        EmailMarketingEventType.EMAIL_CAPTURED,
        AnalyticsEventCategory.CONVERSION,
        {
          userId,
          email,
          capturePoint: 'newsletter_signup',
          type: 'newsletter'
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to send newsletter confirmation:', error);
      return false;
    }
  }

  /**
   * Unsubscribe user from emails
   */
  async unsubscribe(
    userId: string,
    reason?: string,
    categories?: string[]
  ): Promise<boolean> {
    try {
      const preferences = await this.getEmailPreferences(userId);
      
      if (categories && categories.length > 0) {
        // Unsubscribe from specific categories
        categories.forEach(category => {
          if (category in preferences.contentTypes) {
            preferences.contentTypes[category as keyof typeof preferences.contentTypes] = false;
          }
        });
      } else {
        // Unsubscribe from all emails
        preferences.isSubscribed = false;
        Object.keys(preferences.contentTypes).forEach(key => {
          preferences.contentTypes[key as keyof typeof preferences.contentTypes] = false;
        });
      }

      preferences.lastUpdated = new Date().toISOString();

      // Update preferences
      await this.updateEmailPreferences(userId, preferences);

      // Track unsubscription
      await analyticsService.track(
        EmailMarketingEventType.UNSUBSCRIBED,
        AnalyticsEventCategory.USER_BEHAVIOR,
        {
          userId,
          reason,
          categories,
          unsubscribeType: categories ? 'partial' : 'complete'
        }
      );

      // Update backend
      await this.apiService.post('/email-marketing/unsubscribe', {
        userId,
        reason,
        categories,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
      return false;
    }
  }

  /**
   * Track email interaction (open, click, etc.)
   */
  async trackEmailInteraction(
    interactionType: 'open' | 'click' | 'unsubscribe' | 'conversion',
    data: {
      userId: string;
      campaignId: string;
      email: string;
      linkUrl?: string;
      conversionValue?: number;
      conversionType?: string;
    }
  ): Promise<void> {
    try {
      const interaction: Partial<EmailInteraction> = {
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId,
        email: data.email,
        campaignId: data.campaignId
      };

      const now = new Date().toISOString();

      switch (interactionType) {
        case 'open':
          interaction.openedAt = now;
          break;
        case 'click':
          interaction.clickedAt = now;
          break;
        case 'unsubscribe':
          interaction.unsubscribedAt = now;
          break;
        case 'conversion':
          interaction.convertedAt = now;
          interaction.conversionValue = data.conversionValue;
          interaction.conversionType = data.conversionType;
          break;
      }

      // Track with analytics
      const eventType = {
        open: EmailMarketingEventType.EMAIL_OPENED,
        click: EmailMarketingEventType.EMAIL_CLICKED,
        unsubscribe: EmailMarketingEventType.UNSUBSCRIBED,
        conversion: EmailMarketingEventType.CAMPAIGN_CONVERTED
      }[interactionType];

      await analyticsService.track(
        eventType,
        AnalyticsEventCategory.CONVERSION,
        {
          userId: data.userId,
          campaignId: data.campaignId,
          email: data.email,
          linkUrl: data.linkUrl,
          conversionValue: data.conversionValue,
          conversionType: data.conversionType
        }
      );

      // Send to backend
      await this.apiService.post('/email-marketing/interaction', {
        interaction,
        interactionType,
        timestamp: now
      });
    } catch (error) {
      console.error('Failed to track email interaction:', error);
    }
  }

  /**
   * Get email marketing analytics
   */
  async getEmailAnalytics(): Promise<EmailMarketingAnalytics> {
    try {
      const response = await this.apiService.get('/email-marketing/analytics');
      return response.analytics;
    } catch (error) {
      console.error('Failed to get email analytics:', error);
      
      // Return empty analytics
      return {
        overview: {
          totalSubscribers: 0,
          activeSubscribers: 0,
          growthRate: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
          avgConversionRate: 0,
          totalRevenue: 0
        },
        campaigns: {
          sent: 0,
          active: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
          topPerforming: []
        },
        segments: [],
        trends: []
      };
    }
  }

  /**
   * Check if user should see email capture prompt
   */
  async shouldShowEmailCapture(
    userId: string,
    capturePoint: string,
    context?: any
  ): Promise<boolean> {
    try {
      // Check if user is already subscribed
      const preferences = await this.getEmailPreferences(userId);
      if (preferences.isSubscribed) {
        return false;
      }

      // Check frequency limits and other rules
      const response = await this.apiService.get('/email-marketing/should-show-capture', {
        params: { userId, capturePoint, context }
      });

      return response.shouldShow || false;
    } catch (error) {
      console.error('Failed to check email capture eligibility:', error);
      return false;
    }
  }

  /**
   * Generate personalized email content
   */
  async generatePersonalizedContent(
    userId: string,
    templateId: string,
    variables?: Record<string, string>
  ): Promise<{ subject: string; html: string; text: string } | null> {
    try {
      const response = await this.apiService.post('/email-marketing/personalize', {
        userId,
        templateId,
        variables
      });

      return response.content || null;
    } catch (error) {
      console.error('Failed to generate personalized content:', error);
      return null;
    }
  }
}

// Export singleton instance
const apiService = new (require('../api/api.service').ApiService)();
export const emailMarketingService = new EmailMarketingService(apiService);
export default emailMarketingService;