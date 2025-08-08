import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { COLORS } from '../../../constants/colors';
import { 
  upgradePromptsService, 
  UpgradePromptConfig, 
  PromptVariant, 
  PromptPosition,
  PromptTriggerType 
} from '../../../services/upgrade-prompts/upgrade-prompts.service';
import { SubscriptionTier } from '../../../services/payment/payment.service';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Props for the SmartUpgradePrompt component
 */
export interface SmartUpgradePromptProps {
  /** User ID for tracking */
  userId: string;
  /** Current user subscription tier */
  currentTier: SubscriptionTier;
  /** Trigger type that initiated this prompt */
  trigger: PromptTriggerType;
  /** Context data for personalization */
  context: any;
  /** Whether the prompt is visible */
  visible: boolean;
  /** Callback when user clicks upgrade */
  onUpgrade: (selectedTier: SubscriptionTier) => void;
  /** Callback when user dismisses prompt */
  onDismiss: () => void;
  /** Callback when user snoozes prompt */
  onSnooze?: (duration: number) => void;
  /** Override prompt configuration */
  overrideConfig?: {
    config: UpgradePromptConfig;
    variant: PromptVariant;
  };
}

/**
 * Smart upgrade prompt component with A/B testing and personalization
 * 
 * Features:
 * - Dynamic positioning based on prompt configuration
 * - A/B testing support with variant selection
 * - Contextual messaging based on trigger type
 * - Animated entrances and exits
 * - Smart timing and anti-annoyance measures
 * - Conversion tracking and analytics
 * - Social proof and urgency elements
 * - Personalized discount offers
 */
export const SmartUpgradePrompt: React.FC<SmartUpgradePromptProps> = ({
  userId,
  currentTier,
  trigger,
  context,
  visible,
  onUpgrade,
  onDismiss,
  onSnooze,
  overrideConfig
}) => {
  const [config, setConfig] = useState<UpgradePromptConfig | null>(null);
  const [variant, setVariant] = useState<PromptVariant | null>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [showDiscountTimer, setShowDiscountTimer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  /**
   * Initialize prompt when visible
   */
  useEffect(() => {
    if (visible) {
      initializePrompt();
    }
  }, [visible, trigger, context]);

  /**
   * Handle entrance/exit animations
   */
  useEffect(() => {
    if (visible && variant) {
      animateIn();
    } else {
      animateOut();
    }
  }, [visible, variant]);

  /**
   * Handle discount timer
   */
  useEffect(() => {
    if (showDiscountTimer && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setShowDiscountTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showDiscountTimer, timeRemaining]);

  /**
   * Initialize prompt configuration
   */
  const initializePrompt = async () => {
    try {
      let promptConfig: UpgradePromptConfig;
      let promptVariant: PromptVariant;

      if (overrideConfig) {
        promptConfig = overrideConfig.config;
        promptVariant = overrideConfig.variant;
      } else {
        // Check if prompt should be shown
        const result = await upgradePromptsService.shouldShowPrompt(userId, trigger, {
          ...context,
          currentTier
        });

        if (!result.shouldShow || !result.config || !result.variant) {
          onDismiss();
          return;
        }

        promptConfig = result.config;
        promptVariant = result.variant;
      }

      setConfig(promptConfig);
      setVariant(promptVariant);

      // Show the prompt and track interaction
      const id = await upgradePromptsService.showPrompt(
        userId,
        promptConfig,
        promptVariant,
        { ...context, currentTier }
      );
      setInteractionId(id);

      // Initialize discount timer if enabled
      if (promptVariant.config.urgencyTimer) {
        setTimeRemaining(300); // 5 minutes default
        setShowDiscountTimer(true);
      }

      // Start pulse animation for urgent style
      if (promptVariant.config.style === 'urgent') {
        startPulseAnimation();
      }
    } catch (error) {
      console.error('Failed to initialize prompt:', error);
      onDismiss();
    }
  };

  /**
   * Animate prompt entrance
   */
  const animateIn = () => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ];

    if (variant?.config.position === PromptPosition.SLIDE_UP) {
      animations.push(
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      );
    } else if (variant?.config.position === PromptPosition.MODAL_CENTER) {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  /**
   * Animate prompt exit
   */
  const animateOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Start pulse animation for urgent prompts
   */
  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (visible && variant?.config.style === 'urgent') {
          pulse();
        }
      });
    };
    pulse();
  };

  /**
   * Handle upgrade button press
   */
  const handleUpgrade = async (selectedTier: SubscriptionTier = SubscriptionTier.PRO) => {
    if (!interactionId) return;

    setIsLoading(true);
    
    try {
      // Track interaction
      await upgradePromptsService.handlePromptInteraction(interactionId, 'clicked');
      
      // Call upgrade callback
      onUpgrade(selectedTier);
    } catch (error) {
      console.error('Failed to handle upgrade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle dismiss action
   */
  const handleDismiss = async () => {
    if (interactionId) {
      try {
        await upgradePromptsService.handlePromptInteraction(interactionId, 'dismissed');
      } catch (error) {
        console.error('Failed to track dismiss:', error);
      }
    }
    onDismiss();
  };

  /**
   * Handle snooze action
   */
  const handleSnooze = async (duration: number = 24) => {
    if (interactionId) {
      try {
        await upgradePromptsService.handlePromptInteraction(interactionId, 'snoozed');
      } catch (error) {
        console.error('Failed to track snooze:', error);
      }
    }
    
    if (onSnooze) {
      onSnooze(duration);
    } else {
      onDismiss();
    }
  };

  /**
   * Get style configuration based on variant
   */
  const getStyleConfig = () => {
    if (!variant) return {};

    const baseStyles = {
      urgent: {
        gradient: ['#FF6B6B', '#FF8E8E'],
        primaryColor: '#FF6B6B',
        textColor: COLORS.WHITE,
        backgroundColor: '#FFE5E5',
      },
      friendly: {
        gradient: ['#4ECDC4', '#44A08D'],
        primaryColor: '#4ECDC4',
        textColor: COLORS.WHITE,
        backgroundColor: '#E0F7FA',
      },
      professional: {
        gradient: ['#667eea', '#764ba2'],
        primaryColor: '#667eea',
        textColor: COLORS.WHITE,
        backgroundColor: '#F0F7FF',
      },
      playful: {
        gradient: ['#FF9A8B', '#A8E6CF'],
        primaryColor: '#FF9A8B',
        textColor: COLORS.WHITE,
        backgroundColor: '#FFF5F5',
      }
    };

    return baseStyles[variant.config.style] || baseStyles.professional;
  };

  /**
   * Format time remaining for urgency timer
   */
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Render banner position prompt
   */
  const renderBannerPrompt = () => {
    const styleConfig = getStyleConfig();
    const isTop = variant?.config.position === PromptPosition.BANNER_TOP;

    return (
      <Animated.View
        style={[
          styles.bannerContainer,
          isTop ? styles.bannerTop : styles.bannerBottom,
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 300],
                  outputRange: [0, isTop ? -100 : 100],
                }),
              },
              { scale: pulseAnim }
            ],
          },
        ]}
      >
        <LinearGradient
          colors={styleConfig.gradient}
          style={styles.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <Text style={[styles.bannerTitle, { color: styleConfig.textColor }]}>
                {variant?.config.title}
              </Text>
              <Text style={[styles.bannerMessage, { color: styleConfig.textColor }]}>
                {variant?.config.message}
              </Text>
              {showDiscountTimer && (
                <Text style={[styles.timerText, { color: styleConfig.textColor }]}>
                  ⏰ Offer expires in {formatTimeRemaining(timeRemaining)}
                </Text>
              )}
            </View>
            <View style={styles.bannerActions}>
              <Button
                variant="secondary"
                onPress={() => handleUpgrade()}
                loading={isLoading}
                style={[styles.bannerButton, { backgroundColor: styleConfig.textColor }]}
                textStyle={{ color: styleConfig.primaryColor }}
              >
                {variant?.config.ctaText}
              </Button>
              {variant?.config.secondaryCtaText && (
                <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
                  <Text style={[styles.dismissText, { color: styleConfig.textColor }]}>
                    {variant.config.secondaryCtaText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  /**
   * Render modal position prompt
   */
  const renderModalPrompt = () => {
    const styleConfig = getStyleConfig();

    return (
      <Modal visible={visible} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={styleConfig.gradient}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
                <Text style={[styles.closeButtonText, { color: styleConfig.textColor }]}>×</Text>
              </TouchableOpacity>

              <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: styleConfig.textColor }]}>
                  {variant?.config.title}
                </Text>
                <Text style={[styles.modalMessage, { color: styleConfig.textColor }]}>
                  {variant?.config.message}
                </Text>

                {/* Discount badge */}
                {variant?.config.showDiscount && variant?.config.discountPercentage && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {variant.config.discountPercentage}% OFF
                    </Text>
                    {showDiscountTimer && (
                      <Text style={styles.discountTimer}>
                        {formatTimeRemaining(timeRemaining)} left
                      </Text>
                    )}
                  </View>
                )}

                {/* Benefits list */}
                {variant?.config.benefits && (
                  <View style={styles.benefitsList}>
                    {variant.config.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Text style={[styles.benefitCheck, { color: styleConfig.textColor }]}>✓</Text>
                        <Text style={[styles.benefitText, { color: styleConfig.textColor }]}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Social proof */}
                {variant?.config.socialProof && (
                  <View style={styles.socialProof}>
                    <Text style={[styles.socialProofText, { color: styleConfig.textColor }]}>
                      ⭐ Trusted by 10,000+ professionals
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Actions */}
              <View style={styles.modalActions}>
                <Button
                  variant="primary"
                  onPress={() => handleUpgrade()}
                  loading={isLoading}
                  style={[styles.upgradeButton, { backgroundColor: styleConfig.textColor }]}
                  textStyle={{ color: styleConfig.primaryColor }}
                >
                  {variant?.config.ctaText}
                </Button>

                <View style={styles.secondaryActions}>
                  {variant?.config.secondaryCtaText && (
                    <TouchableOpacity onPress={handleDismiss} style={styles.secondaryButton}>
                      <Text style={[styles.secondaryButtonText, { color: styleConfig.textColor }]}>
                        {variant.config.secondaryCtaText}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {onSnooze && (
                    <TouchableOpacity onPress={() => handleSnooze()} style={styles.snoozeButton}>
                      <Text style={[styles.snoozeButtonText, { color: styleConfig.textColor }]}>
                        Remind me tomorrow
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  /**
   * Render slide-up position prompt
   */
  const renderSlideUpPrompt = () => {
    const styleConfig = getStyleConfig();

    return (
      <Modal visible={visible} transparent animationType="none">
        <View style={styles.slideUpOverlay}>
          <Animated.View
            style={[
              styles.slideUpContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={styleConfig.gradient}
              style={styles.slideUpGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.slideUpHeader}>
                <Text style={[styles.slideUpTitle, { color: styleConfig.textColor }]}>
                  {variant?.config.title}
                </Text>
                <TouchableOpacity onPress={handleDismiss} style={styles.slideUpClose}>
                  <Text style={[styles.slideUpCloseText, { color: styleConfig.textColor }]}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.slideUpMessage, { color: styleConfig.textColor }]}>
                {variant?.config.message}
              </Text>

              <View style={styles.slideUpActions}>
                <Button
                  variant="primary"
                  onPress={() => handleUpgrade()}
                  loading={isLoading}
                  style={[styles.slideUpButton, { backgroundColor: styleConfig.textColor }]}
                  textStyle={{ color: styleConfig.primaryColor }}
                >
                  {variant?.config.ctaText}
                </Button>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (!visible || !variant) {
    return null;
  }

  // Render based on position
  switch (variant.config.position) {
    case PromptPosition.BANNER_TOP:
    case PromptPosition.BANNER_BOTTOM:
      return renderBannerPrompt();
    
    case PromptPosition.MODAL_CENTER:
    case PromptPosition.FULLSCREEN:
      return renderModalPrompt();
    
    case PromptPosition.SLIDE_UP:
      return renderSlideUpPrompt();
    
    // TODO: Implement tooltip and inline positions
    case PromptPosition.TOOLTIP:
    case PromptPosition.INLINE:
    default:
      return renderModalPrompt(); // Fallback
  }
};

const styles = StyleSheet.create({
  // Banner styles
  bannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  bannerTop: {
    top: Platform.select({ ios: 44, android: 0 }), // Account for status bar
  },
  bannerBottom: {
    bottom: Platform.select({ ios: 34, android: 0 }), // Account for home indicator
  },
  bannerGradient: {
    padding: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLeft: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerMessage: {
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 18,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  bannerActions: {
    alignItems: 'flex-end',
  },
  bannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  dismissButton: {
    paddingVertical: 4,
  },
  dismissText: {
    fontSize: 12,
    opacity: 0.8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 24,
    paddingTop: 60, // Space for close button
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.9,
  },
  discountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  discountText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  discountTimer: {
    color: COLORS.WHITE,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitCheck: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
    opacity: 0.9,
  },
  socialProof: {
    marginBottom: 24,
  },
  socialProofText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  modalActions: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  upgradeButton: {
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    opacity: 0.8,
  },
  snoozeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  snoozeButtonText: {
    fontSize: 14,
    opacity: 0.8,
  },

  // Slide-up styles
  slideUpOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  slideUpContainer: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.6,
  },
  slideUpGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  slideUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  slideUpTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  slideUpClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideUpCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  slideUpMessage: {
    fontSize: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 24,
    opacity: 0.9,
  },
  slideUpActions: {
    padding: 20,
    paddingTop: 0,
  },
  slideUpButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
});

export default SmartUpgradePrompt;