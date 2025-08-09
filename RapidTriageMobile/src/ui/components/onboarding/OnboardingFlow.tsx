import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { COLORS } from '../../../constants/colors';
import { 
  onboardingService, 
  OnboardingProgress, 
  OnboardingStep, 
  UserPersonalization 
} from '../../../services/onboarding/onboarding.service';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Props for the OnboardingFlow component
 */
export interface OnboardingFlowProps {
  /** Current user ID */
  userId: string;
  /** Callback when onboarding is completed */
  onComplete: (personalization: UserPersonalization) => void;
  /** Callback when onboarding is skipped */
  onSkip?: () => void;
  /** Initial step to start from (for resume) */
  initialStep?: number;
  /** Custom styling */
  style?: any;
}

/**
 * Step components map
 */
interface StepComponentProps {
  step: OnboardingStep;
  onNext: (data?: any) => void;
  onSkip: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  progress: number;
}

/**
 * Welcome step component
 */
const WelcomeStep: React.FC<StepComponentProps> = ({ onNext, isFirst, progress }) => (
  <View style={styles.stepContainer}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
      <View style={styles.welcomeContent}>
        <Text style={styles.welcomeEmoji}>🚀</Text>
        <Typography variant="h1" style={styles.welcomeTitle}>
          Welcome to RapidTriage
        </Typography>
        <Text style={styles.welcomeSubtitle}>
          Let's get you set up for success with website optimization
        </Text>
        
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Analyze website performance in seconds</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📊</Text>
            <Text style={styles.benefitText}>Get actionable insights and recommendations</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <Text style={styles.benefitText}>Track improvements over time</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10k+</Text>
            <Text style={styles.statLabel}>Websites Analyzed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Satisfaction Rate</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    
    <View style={styles.stepActions}>
      <Button
        variant="primary"
        onPress={() => onNext()}
        style={styles.nextButton}
      >
        Let's Get Started
      </Button>
    </View>
  </View>
);

/**
 * Features step component
 */
const FeaturesStep: React.FC<StepComponentProps> = ({ onNext, onSkip, onBack, progress }) => {
  const [selectedFeature, setSelectedFeature] = useState<number | null>(null);

  const features = [
    {
      icon: '⚡',
      title: 'Performance Analysis',
      description: 'Deep dive into Core Web Vitals, loading times, and optimization opportunities',
      color: '#3B82F6'
    },
    {
      icon: '🔍',
      title: 'SEO Optimization',
      description: 'Comprehensive SEO audits with actionable recommendations for better rankings',
      color: '#10B981'
    },
    {
      icon: '♿',
      title: 'Accessibility Check',
      description: 'Ensure your website is accessible to all users with detailed compliance reports',
      color: '#8B5CF6'
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Track performance trends and measure improvements over time',
      color: '#F59E0B'
    }
  ];

  return (
    <View style={styles.stepContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
        <View style={styles.featuresHeader}>
          <Typography variant="h2" style={styles.stepTitle}>
            Discover Key Features
          </Typography>
          <Text style={styles.stepDescription}>
            Tap any feature to learn more about what RapidTriage can do for you
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.featureCard,
                selectedFeature === index && styles.featureCardSelected
              ]}
              onPress={() => setSelectedFeature(selectedFeature === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Text style={styles.featureIconText}>{feature.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>
                {feature.description}
              </Text>
              {selectedFeature === index && (
                <View style={styles.featureExpanded}>
                  <Text style={styles.featureExpandedText}>
                    This feature helps you understand and improve your website's {feature.title.toLowerCase()}.
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.stepActions}>
        <Button
          variant="secondary"
          onPress={onSkip}
          style={styles.skipButton}
        >
          Skip for Now
        </Button>
        <Button
          variant="primary"
          onPress={() => onNext()}
          style={styles.nextButton}
        >
          Continue
        </Button>
      </View>
    </View>
  );
};

/**
 * Personalization step component
 */
const PersonalizationStep: React.FC<StepComponentProps> = ({ onNext, onSkip, onBack, progress }) => {
  const [personalization, setPersonalization] = useState<Partial<UserPersonalization>>({});

  const industryOptions = [
    { value: 'technology', label: 'Technology & Software', icon: '💻' },
    { value: 'marketing', label: 'Marketing & Advertising', icon: '📢' },
    { value: 'ecommerce', label: 'E-commerce & Retail', icon: '🛒' },
    { value: 'agency', label: 'Digital Agency', icon: '🎨' },
    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const teamSizeOptions = [
    { value: '1', label: 'Just me', icon: '👤' },
    { value: '2-5', label: '2-5 people', icon: '👥' },
    { value: '6-20', label: '6-20 people', icon: '👨‍👩‍👧‍👦' },
    { value: '21-50', label: '21-50 people', icon: '🏢' },
    { value: '50+', label: '50+ people', icon: '🏙️' }
  ];

  const experienceOptions = [
    { value: 'beginner', label: 'Beginner', description: 'New to web optimization', icon: '🌱' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience', icon: '🌿' },
    { value: 'expert', label: 'Expert', description: 'Highly experienced', icon: '🌳' }
  ];

  const handleNext = () => {
    onNext(personalization);
  };

  return (
    <View style={styles.stepContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
        <View style={styles.personalizationHeader}>
          <Typography variant="h2" style={styles.stepTitle}>
            Tell Us About Yourself
          </Typography>
          <Text style={styles.stepDescription}>
            Help us personalize your RapidTriage experience
          </Text>
        </View>

        {/* Industry Selection */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>What industry are you in?</Text>
          <View style={styles.optionsGrid}>
            {industryOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  personalization.industry === option.value && styles.optionCardSelected
                ]}
                onPress={() => setPersonalization(prev => ({ ...prev, industry: option.value as any }))}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Team Size Selection */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>How large is your team?</Text>
          <View style={styles.optionsGrid}>
            {teamSizeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  personalization.teamSize === option.value && styles.optionCardSelected
                ]}
                onPress={() => setPersonalization(prev => ({ ...prev, teamSize: option.value as any }))}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>What's your experience level?</Text>
          <View style={styles.experienceOptions}>
            {experienceOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.experienceCard,
                  personalization.experienceLevel === option.value && styles.experienceCardSelected
                ]}
                onPress={() => setPersonalization(prev => ({ ...prev, experienceLevel: option.value as any }))}
              >
                <Text style={styles.experienceIcon}>{option.icon}</Text>
                <View style={styles.experienceContent}>
                  <Text style={styles.experienceLabel}>{option.label}</Text>
                  <Text style={styles.experienceDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.stepActions}>
        <Button
          variant="secondary"
          onPress={onSkip}
          style={styles.skipButton}
        >
          Skip for Now
        </Button>
        <Button
          variant="primary"
          onPress={handleNext}
          style={styles.nextButton}
        >
          Continue
        </Button>
      </View>
    </View>
  );
};

/**
 * Goals step component
 */
const GoalsStep: React.FC<StepComponentProps> = ({ onNext, onSkip, onBack, progress }) => {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const goals = [
    { id: 'performance', label: 'Improve Website Performance', icon: '⚡', color: '#3B82F6' },
    { id: 'seo', label: 'Boost SEO Rankings', icon: '🔍', color: '#10B981' },
    { id: 'accessibility', label: 'Ensure Accessibility', icon: '♿', color: '#8B5CF6' },
    { id: 'monitoring', label: 'Monitor Website Health', icon: '📊', color: '#F59E0B' },
    { id: 'reporting', label: 'Generate Client Reports', icon: '📄', color: '#EF4444' },
    { id: 'compliance', label: 'Meet Compliance Standards', icon: '✅', color: '#6B7280' }
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };

  const handleNext = () => {
    onNext({ primaryGoals: selectedGoals });
  };

  return (
    <View style={styles.stepContainer}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
        <View style={styles.goalsHeader}>
          <Typography variant="h2" style={styles.stepTitle}>
            Set Your Goals
          </Typography>
          <Text style={styles.stepDescription}>
            What would you like to achieve with RapidTriage? Select all that apply.
          </Text>
        </View>

        <View style={styles.goalsGrid}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                selectedGoals.includes(goal.id) && styles.goalCardSelected
              ]}
              onPress={() => toggleGoal(goal.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
                <Text style={styles.goalIconText}>{goal.icon}</Text>
              </View>
              <Text style={styles.goalLabel}>{goal.label}</Text>
              {selectedGoals.includes(goal.id) && (
                <View style={styles.goalCheck}>
                  <Text style={styles.goalCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.goalsFooter}>
          <Text style={styles.goalsFooterText}>
            Don't worry, you can change these anytime in your settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.stepActions}>
        <Button
          variant="secondary"
          onPress={onSkip}
          style={styles.skipButton}
        >
          Skip for Now
        </Button>
        <Button
          variant="primary"
          onPress={handleNext}
          style={styles.nextButton}
          disabled={selectedGoals.length === 0}
        >
          Continue
        </Button>
      </View>
    </View>
  );
};

/**
 * Main onboarding flow component with step management
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  userId,
  onComplete,
  onSkip,
  initialStep = 0,
  style
}) => {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(true);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const slideAnim = useRef(new Animated.Value(0)).current;

  /**
   * Initialize onboarding flow
   */
  useEffect(() => {
    initializeOnboarding();
  }, [userId]);

  /**
   * Animate step transitions
   */
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: -currentStepIndex * screenWidth,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [currentStepIndex]);

  /**
   * Initialize or resume onboarding
   */
  const initializeOnboarding = async () => {
    try {
      let userProgress = await onboardingService.getProgress(userId);
      
      if (!userProgress) {
        // Start new onboarding
        userProgress = await onboardingService.startOnboarding(userId);
      }
      
      setProgress(userProgress);
      setCurrentStepIndex(userProgress.currentStep);
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
      // Start fresh onboarding on error
      try {
        const newProgress = await onboardingService.startOnboarding(userId);
        setProgress(newProgress);
      } catch (startError) {
        console.error('Failed to start onboarding:', startError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle step completion
   */
  const handleStepNext = async (data?: any) => {
    if (!progress) return;

    const currentStep = onboardingService.getCurrentStep(progress);
    if (!currentStep) return;

    try {
      // Store step data
      if (data) {
        setStepData(prev => ({ ...prev, [currentStep.id]: data }));
      }

      // Complete the step
      const updatedProgress = await onboardingService.completeStep(
        userId,
        currentStep.id,
        data,
        30 // TODO: Track actual time spent
      );

      if (updatedProgress) {
        setProgress(updatedProgress);

        if (updatedProgress.isComplete) {
          // Onboarding completed
          const allPersonalization = Object.values(stepData).reduce((acc, data) => ({
            ...acc,
            ...data
          }), {});
          
          onComplete(allPersonalization);
        } else {
          // Move to next step
          const nextStep = onboardingService.getNextStep(updatedProgress);
          if (nextStep) {
            setCurrentStepIndex(currentStepIndex + 1);
          }
        }
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  /**
   * Handle step skip
   */
  const handleStepSkip = async () => {
    if (!progress) return;

    const currentStep = onboardingService.getCurrentStep(progress);
    if (!currentStep || !currentStep.isSkippable) return;

    try {
      const updatedProgress = await onboardingService.skipStep(userId, currentStep.id);
      
      if (updatedProgress) {
        setProgress(updatedProgress);
        
        const nextStep = onboardingService.getNextStep(updatedProgress);
        if (nextStep) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          // No more steps, complete onboarding
          const allPersonalization = Object.values(stepData).reduce((acc, data) => ({
            ...acc,
            ...data
          }), {});
          
          onComplete(allPersonalization);
        }
      }
    } catch (error) {
      console.error('Failed to skip step:', error);
    }
  };

  /**
   * Handle step back navigation
   */
  const handleStepBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  /**
   * Get step component
   */
  const getStepComponent = (step: OnboardingStep, index: number) => {
    const commonProps = {
      step,
      onNext: handleStepNext,
      onSkip: handleStepSkip,
      onBack: handleStepBack,
      isFirst: index === 0,
      isLast: index === (progress?.totalSteps || 1) - 1,
      progress: progress ? (progress.currentStep + 1) / progress.totalSteps : 0
    };

    switch (step.component) {
      case 'WelcomeStep':
        return <WelcomeStep key={step.id} {...commonProps} />;
      case 'FeaturesStep':
        return <FeaturesStep key={step.id} {...commonProps} />;
      case 'PersonalizationStep':
        return <PersonalizationStep key={step.id} {...commonProps} />;
      case 'GoalsStep':
        return <GoalsStep key={step.id} {...commonProps} />;
      default:
        return (
          <View key={step.id} style={styles.stepContainer}>
            <Text>Unknown step: {step.component}</Text>
          </View>
        );
    }
  };

  if (isLoading || !progress) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>Setting up your onboarding...</Text>
      </View>
    );
  }

  const steps = onboardingService['config'].steps; // Access config steps

  return (
    <View style={[styles.container, style]}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { width: `${(progress.currentStep + 1) / progress.totalSteps * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {progress.currentStep + 1} of {progress.totalSteps}
          </Text>
        </View>
        
        {onSkip && (
          <TouchableOpacity onPress={onSkip} style={styles.skipAllButton}>
            <Text style={styles.skipAllText}>Skip All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Steps Container */}
      <Animated.View 
        style={[
          styles.stepsContainer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepWrapper}>
            {getStepComponent(step, index)}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },

  // Progress Header
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
    ...Platform.select({
      ios: {
        paddingTop: 50, // Account for status bar
      },
    }),
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  skipAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipAllText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },

  // Steps Container
  stepsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  stepWrapper: {
    width: screenWidth,
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    flexGrow: 1,
    padding: 20,
  },

  // Step Actions
  stepActions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.select({
      ios: 34, // Account for home indicator
      android: 20,
    }),
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_PRIMARY,
  },
  skipButton: {
    flex: 1,
    marginRight: 12,
    borderRadius: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 8,
  },

  // Welcome Step
  welcomeContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  welcomeSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 40,
    lineHeight: 26,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  benefitText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },

  // Features Step
  featuresHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 12,
    color: COLORS.TEXT_PRIMARY,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  featureCard: {
    width: '47%',
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  featureCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F0F7FF',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureExpanded: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 8,
  },
  featureExpandedText: {
    fontSize: 13,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Personalization Step
  personalizationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  questionSection: {
    marginBottom: 32,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
  },
  optionCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F0F7FF',
  },
  optionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: '500',
  },
  experienceOptions: {
    gap: 12,
  },
  experienceCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  experienceCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F0F7FF',
  },
  experienceIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  experienceContent: {
    flex: 1,
  },
  experienceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },

  // Goals Step
  goalsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  goalCard: {
    width: '47%',
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F0F7FF',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  goalIconText: {
    fontSize: 24,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  goalCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCheckText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalsFooter: {
    alignItems: 'center',
    marginTop: 16,
  },
  goalsFooterText: {
    fontSize: 14,
    color: COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default OnboardingFlow;