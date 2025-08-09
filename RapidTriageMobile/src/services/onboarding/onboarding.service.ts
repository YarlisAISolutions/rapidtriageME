import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api/api.service';
import { analyticsService, AnalyticsEventCategory } from '../analytics/analytics.service';

/**
 * Onboarding event types for analytics tracking
 */
export enum OnboardingEventType {
  STARTED = 'onboarding_started',
  STEP_COMPLETED = 'onboarding_step_completed',
  STEP_SKIPPED = 'onboarding_step_skipped',
  COMPLETED = 'onboarding_completed',
  ABANDONED = 'onboarding_abandoned',
  TUTORIAL_STARTED = 'tutorial_started',
  TUTORIAL_COMPLETED = 'tutorial_completed',
  PERSONALIZATION_UPDATED = 'personalization_updated'
}

/**
 * Onboarding step configuration
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'features' | 'personalization' | 'goals' | 'tutorial';
  component: string; // Component name to render
  isRequired: boolean;
  isSkippable: boolean;
  estimatedTime: number; // in seconds
  prerequisites?: string[]; // Step IDs that must be completed first
  metadata?: Record<string, any>;
}

/**
 * User personalization data collected during onboarding
 */
export interface UserPersonalization {
  industry?: 'technology' | 'marketing' | 'ecommerce' | 'agency' | 'healthcare' | 'education' | 'other';
  teamSize?: '1' | '2-5' | '6-20' | '21-50' | '50+';
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  primaryGoals?: Array<'performance' | 'seo' | 'accessibility' | 'monitoring' | 'reporting' | 'compliance'>;
  websiteTypes?: Array<'corporate' | 'ecommerce' | 'blog' | 'portfolio' | 'saas' | 'news' | 'other'>;
  currentTools?: Array<'lighthouse' | 'gtmetrix' | 'pagespeed' | 'webpagetest' | 'none' | 'other'>;
  challenges?: Array<'slow_performance' | 'poor_seo' | 'accessibility_issues' | 'monitoring' | 'reporting'>;
  preferences?: {
    communicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'minimal';
    contentTypes?: Array<'tips' | 'case_studies' | 'tutorials' | 'news'>;
    learningStyle?: 'visual' | 'hands_on' | 'reading' | 'video';
  };
}

/**
 * Onboarding progress tracking
 */
export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: string;
  lastActiveAt: string;
  completedAt?: string;
  timeSpent: number; // total time in seconds
  stepTimeSpent: Record<string, number>; // time per step
  isComplete: boolean;
  abandonedAt?: string;
  abandonedReason?: string;
  personalization: UserPersonalization;
}

/**
 * Tutorial configuration for first scan guidance
 */
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // Element selector to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'tap' | 'input' | 'scroll' | 'wait';
  overlay: boolean;
  highlightElement?: boolean;
  nextTrigger: 'tap' | 'auto' | 'manual';
  autoAdvanceDelay?: number; // milliseconds
}

/**
 * Onboarding configuration
 */
export interface OnboardingConfig {
  steps: OnboardingStep[];
  tutorials: Record<string, TutorialStep[]>; // Tutorial name -> steps
  personalizationQuestions: Record<string, any>;
  completionRewards?: {
    type: 'badge' | 'discount' | 'feature_unlock';
    value: any;
  };
  maxAbandonmentTime: number; // minutes before considered abandoned
  enableAnalytics: boolean;
}

/**
 * Comprehensive onboarding service for new user experience
 * 
 * Key Features:
 * - Multi-step onboarding flow with progress tracking
 * - Personalization questions for user segmentation
 * - Interactive tutorials for key features
 * - Goal setting and expectations management
 * - Skip and resume functionality
 * - Analytics integration for optimization
 * - A/B testing support for onboarding variations
 * - Completion rewards and achievements
 */
class OnboardingService {
  private apiService: ApiService;
  private config: OnboardingConfig;

  // Storage keys for offline persistence
  private readonly STORAGE_KEYS = {
    PROGRESS: 'onboarding_progress',
    CONFIG: 'onboarding_config',
    PERSONALIZATION: 'user_personalization',
    TUTORIAL_PROGRESS: 'tutorial_progress'
  };

  constructor(apiService: ApiService) {
    this.apiService = apiService;
    
    // Default onboarding configuration
    this.config = {
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to RapidTriage',
          description: 'Let\'s get you set up for success with website optimization',
          type: 'welcome',
          component: 'WelcomeStep',
          isRequired: true,
          isSkippable: false,
          estimatedTime: 30
        },
        {
          id: 'features',
          title: 'Discover Key Features',
          description: 'Learn about the powerful tools at your disposal',
          type: 'features',
          component: 'FeaturesStep',
          isRequired: true,
          isSkippable: true,
          estimatedTime: 90
        },
        {
          id: 'personalization',
          title: 'Tell Us About Yourself',
          description: 'Help us personalize your experience',
          type: 'personalization',
          component: 'PersonalizationStep',
          isRequired: false,
          isSkippable: true,
          estimatedTime: 120
        },
        {
          id: 'goals',
          title: 'Set Your Goals',
          description: 'What would you like to achieve with RapidTriage?',
          type: 'goals',
          component: 'GoalsStep',
          isRequired: false,
          isSkippable: true,
          estimatedTime: 60
        },
        {
          id: 'first_scan_tutorial',
          title: 'Your First Scan',
          description: 'Let\'s run your first website scan together',
          type: 'tutorial',
          component: 'FirstScanTutorial',
          isRequired: true,
          isSkippable: false,
          estimatedTime: 180,
          prerequisites: ['welcome']
        }
      ],
      tutorials: {
        first_scan: [
          {
            id: 'enter_url',
            title: 'Enter Your Website URL',
            description: 'Type or paste the URL of the website you want to analyze',
            position: 'bottom',
            action: 'input',
            overlay: true,
            highlightElement: true,
            nextTrigger: 'manual'
          },
          {
            id: 'start_scan',
            title: 'Start Your First Scan',
            description: 'Tap the scan button to begin analyzing your website',
            position: 'bottom',
            action: 'tap',
            overlay: true,
            highlightElement: true,
            nextTrigger: 'tap'
          },
          {
            id: 'scan_progress',
            title: 'Scan in Progress',
            description: 'RapidTriage is analyzing your website performance, SEO, and accessibility',
            position: 'center',
            overlay: false,
            nextTrigger: 'auto',
            autoAdvanceDelay: 3000
          },
          {
            id: 'results_overview',
            title: 'Understanding Your Results',
            description: 'Your scan is complete! Here\'s how to read your performance scores',
            position: 'top',
            overlay: true,
            nextTrigger: 'manual'
          }
        ]
      },
      personalizationQuestions: {
        industry: {
          type: 'single_select',
          required: false,
          options: [
            { value: 'technology', label: 'Technology & Software' },
            { value: 'marketing', label: 'Marketing & Advertising' },
            { value: 'ecommerce', label: 'E-commerce & Retail' },
            { value: 'agency', label: 'Digital Agency' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'education', label: 'Education' },
            { value: 'other', label: 'Other' }
          ]
        },
        teamSize: {
          type: 'single_select',
          required: false,
          options: [
            { value: '1', label: 'Just me' },
            { value: '2-5', label: '2-5 people' },
            { value: '6-20', label: '6-20 people' },
            { value: '21-50', label: '21-50 people' },
            { value: '50+', label: '50+ people' }
          ]
        },
        experienceLevel: {
          type: 'single_select',
          required: false,
          options: [
            { value: 'beginner', label: 'Beginner - New to web optimization' },
            { value: 'intermediate', label: 'Intermediate - Some experience' },
            { value: 'expert', label: 'Expert - Highly experienced' }
          ]
        },
        primaryGoals: {
          type: 'multi_select',
          required: false,
          maxSelections: 3,
          options: [
            { value: 'performance', label: 'Improve website performance' },
            { value: 'seo', label: 'Boost SEO rankings' },
            { value: 'accessibility', label: 'Ensure accessibility compliance' },
            { value: 'monitoring', label: 'Monitor website health' },
            { value: 'reporting', label: 'Generate reports for clients/stakeholders' },
            { value: 'compliance', label: 'Meet regulatory compliance' }
          ]
        }
      },
      completionRewards: {
        type: 'discount',
        value: { percentage: 20, duration: 'first_month' }
      },
      maxAbandonmentTime: 30, // 30 minutes
      enableAnalytics: true
    };
  }

  /**
   * Start onboarding process for a new user
   */
  async startOnboarding(userId: string): Promise<OnboardingProgress> {
    try {
      const now = new Date().toISOString();
      
      const progress: OnboardingProgress = {
        userId,
        currentStep: 0,
        totalSteps: this.config.steps.length,
        completedSteps: [],
        skippedSteps: [],
        startedAt: now,
        lastActiveAt: now,
        timeSpent: 0,
        stepTimeSpent: {},
        isComplete: false,
        personalization: {}
      };

      // Save progress
      await this.saveProgress(progress);

      // Track onboarding start
      if (this.config.enableAnalytics) {
        await analyticsService.track(
          OnboardingEventType.STARTED,
          AnalyticsEventCategory.USER_BEHAVIOR,
          {
            userId,
            totalSteps: progress.totalSteps,
            startedAt: now
          }
        );
      }

      // Register with backend
      await this.apiService.post('/onboarding/start', {
        userId,
        progress,
        timestamp: now
      });

      return progress;
    } catch (error) {
      console.error('Failed to start onboarding:', error);
      throw error;
    }
  }

  /**
   * Get current onboarding progress
   */
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      // Try local storage first
      const localProgress = await AsyncStorage.getItem(this.STORAGE_KEYS.PROGRESS);
      if (localProgress) {
        const progress = JSON.parse(localProgress);
        if (progress.userId === userId) {
          return progress;
        }
      }

      // Fetch from backend
      const response = await this.apiService.get(`/onboarding/progress/${userId}`);
      if (response.progress) {
        await this.saveProgress(response.progress);
        return response.progress;
      }

      return null;
    } catch (error) {
      console.error('Failed to get onboarding progress:', error);
      return null;
    }
  }

  /**
   * Complete a specific onboarding step
   */
  async completeStep(
    userId: string, 
    stepId: string, 
    stepData?: any,
    timeSpent?: number
  ): Promise<OnboardingProgress | null> {
    try {
      const progress = await this.getProgress(userId);
      if (!progress) {
        throw new Error('No onboarding progress found');
      }

      const step = this.config.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error('Invalid step ID');
      }

      // Update progress
      const now = new Date().toISOString();
      progress.completedSteps.push(stepId);
      progress.lastActiveAt = now;
      progress.currentStep = Math.min(progress.currentStep + 1, progress.totalSteps - 1);
      
      if (timeSpent) {
        progress.timeSpent += timeSpent;
        progress.stepTimeSpent[stepId] = timeSpent;
      }

      // Update personalization if provided
      if (stepData && step.type === 'personalization') {
        progress.personalization = { ...progress.personalization, ...stepData };
      }

      // Check if onboarding is complete
      const requiredSteps = this.config.steps.filter(s => s.isRequired);
      const completedRequiredSteps = requiredSteps.filter(s => 
        progress.completedSteps.includes(s.id)
      );

      if (completedRequiredSteps.length === requiredSteps.length) {
        progress.isComplete = true;
        progress.completedAt = now;
        
        // Apply completion rewards
        await this.applyCompletionRewards(userId);
        
        // Track completion
        if (this.config.enableAnalytics) {
          await analyticsService.track(
            OnboardingEventType.COMPLETED,
            AnalyticsEventCategory.USER_BEHAVIOR,
            {
              userId,
              totalTimeSpent: progress.timeSpent,
              completedSteps: progress.completedSteps.length,
              skippedSteps: progress.skippedSteps.length,
              completedAt: now
            }
          );
        }
      }

      // Save updated progress
      await this.saveProgress(progress);

      // Track step completion
      if (this.config.enableAnalytics) {
        await analyticsService.track(
          OnboardingEventType.STEP_COMPLETED,
          AnalyticsEventCategory.USER_BEHAVIOR,
          {
            userId,
            stepId,
            stepType: step.type,
            timeSpent,
            currentProgress: progress.currentStep / progress.totalSteps,
            stepData
          }
        );
      }

      // Update backend
      await this.apiService.put(`/onboarding/progress/${userId}`, {
        progress,
        stepId,
        stepData,
        timestamp: now
      });

      return progress;
    } catch (error) {
      console.error('Failed to complete step:', error);
      throw error;
    }
  }

  /**
   * Skip a specific onboarding step
   */
  async skipStep(
    userId: string, 
    stepId: string, 
    reason?: string
  ): Promise<OnboardingProgress | null> {
    try {
      const progress = await this.getProgress(userId);
      if (!progress) {
        throw new Error('No onboarding progress found');
      }

      const step = this.config.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error('Invalid step ID');
      }

      if (!step.isSkippable) {
        throw new Error('Step is not skippable');
      }

      // Update progress
      const now = new Date().toISOString();
      progress.skippedSteps.push(stepId);
      progress.lastActiveAt = now;
      progress.currentStep = Math.min(progress.currentStep + 1, progress.totalSteps - 1);

      // Save updated progress
      await this.saveProgress(progress);

      // Track step skip
      if (this.config.enableAnalytics) {
        await analyticsService.track(
          OnboardingEventType.STEP_SKIPPED,
          AnalyticsEventCategory.USER_BEHAVIOR,
          {
            userId,
            stepId,
            stepType: step.type,
            reason,
            currentProgress: progress.currentStep / progress.totalSteps
          }
        );
      }

      // Update backend
      await this.apiService.put(`/onboarding/progress/${userId}`, {
        progress,
        skippedStepId: stepId,
        skipReason: reason,
        timestamp: now
      });

      return progress;
    } catch (error) {
      console.error('Failed to skip step:', error);
      throw error;
    }
  }

  /**
   * Update user personalization data
   */
  async updatePersonalization(
    userId: string, 
    personalizationData: Partial<UserPersonalization>
  ): Promise<boolean> {
    try {
      const progress = await this.getProgress(userId);
      if (progress) {
        progress.personalization = { ...progress.personalization, ...personalizationData };
        await this.saveProgress(progress);
      }

      // Save separately for quick access
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PERSONALIZATION,
        JSON.stringify(personalizationData)
      );

      // Track personalization update
      if (this.config.enableAnalytics) {
        await analyticsService.track(
          OnboardingEventType.PERSONALIZATION_UPDATED,
          AnalyticsEventCategory.USER_BEHAVIOR,
          {
            userId,
            personalizationData
          }
        );
      }

      // Update backend
      await this.apiService.put(`/users/${userId}/personalization`, personalizationData);

      return true;
    } catch (error) {
      console.error('Failed to update personalization:', error);
      return false;
    }
  }

  /**
   * Get current step information
   */
  getCurrentStep(progress: OnboardingProgress): OnboardingStep | null {
    if (progress.isComplete || progress.currentStep >= this.config.steps.length) {
      return null;
    }

    return this.config.steps[progress.currentStep];
  }

  /**
   * Get next available step (skipping completed ones)
   */
  getNextStep(progress: OnboardingProgress): OnboardingStep | null {
    for (let i = progress.currentStep; i < this.config.steps.length; i++) {
      const step = this.config.steps[i];
      
      if (!progress.completedSteps.includes(step.id) && !progress.skippedSteps.includes(step.id)) {
        // Check prerequisites
        if (step.prerequisites) {
          const prerequisitesMet = step.prerequisites.every(prereq =>
            progress.completedSteps.includes(prereq)
          );
          if (!prerequisitesMet) continue;
        }
        
        return step;
      }
    }

    return null;
  }

  /**
   * Start a tutorial sequence
   */
  async startTutorial(
    userId: string, 
    tutorialName: string
  ): Promise<TutorialStep[] | null> {
    try {
      const tutorial = this.config.tutorials[tutorialName];
      if (!tutorial) {
        throw new Error('Tutorial not found');
      }

      // Track tutorial start
      if (this.config.enableAnalytics) {
        await analyticsService.track(
          OnboardingEventType.TUTORIAL_STARTED,
          AnalyticsEventCategory.USER_BEHAVIOR,
          {
            userId,
            tutorialName,
            stepsCount: tutorial.length
          }
        );
      }

      return tutorial;
    } catch (error) {
      console.error('Failed to start tutorial:', error);
      return null;
    }
  }

  /**
   * Complete a tutorial
   */
  async completeTutorial(userId: string, tutorialName: string): Promise<boolean> {
    try {
      // Track tutorial completion
      if (this.config.enableAnalytics) {
        await analyticsService.track(
          OnboardingEventType.TUTORIAL_COMPLETED,
          AnalyticsEventCategory.USER_BEHAVIOR,
          {
            userId,
            tutorialName
          }
        );
      }

      // Update backend
      await this.apiService.post('/onboarding/tutorial/complete', {
        userId,
        tutorialName,
        completedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Failed to complete tutorial:', error);
      return false;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const progress = await this.getProgress(userId);
      return progress ? progress.isComplete : false;
    } catch (error) {
      console.error('Failed to check onboarding completion:', error);
      return false;
    }
  }

  // Private helper methods

  private async saveProgress(progress: OnboardingProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PROGRESS,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  }

  private async applyCompletionRewards(userId: string): Promise<void> {
    try {
      if (!this.config.completionRewards) return;

      await this.apiService.post('/onboarding/rewards/apply', {
        userId,
        reward: this.config.completionRewards,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to apply completion rewards:', error);
    }
  }
}

// Export singleton instance
const apiService = new (require('../api/api.service').ApiService)();
export const onboardingService = new OnboardingService(apiService);
export default onboardingService;