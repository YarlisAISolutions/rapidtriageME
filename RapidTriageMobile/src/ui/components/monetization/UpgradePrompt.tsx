import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../common/Button';
import { Typography } from '../common/Typography';
import { SubscriptionTier } from '../../../services/payment/payment.service';
import { UsageEventType, UsageAlert } from '../../../services/usage/usage.service';

/**
 * Props for the UpgradePrompt component
 * Configures the prompt appearance and behavior
 */
export interface UpgradePromptProps {
  // Display control
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  
  // Context information
  currentTier: SubscriptionTier;
  triggeredBy: UsageEventType;
  usageAlert?: UsageAlert;
  
  // Customization
  title?: string;
  message?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  showDismiss?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  
  // Styling
  variant?: 'banner' | 'card' | 'fullscreen';
  position?: 'top' | 'bottom' | 'center';
  theme?: 'default' | 'urgent' | 'friendly';
}

/**
 * Smart upgrade prompt component that appears when users hit limits
 * Provides contextual messaging and seamless upgrade path
 * 
 * Features:
 * - Context-aware messaging based on triggering feature
 * - Multiple display variants (banner, card, fullscreen)
 * - Animated entrance and exit
 * - Auto-hide capability with customizable delay
 * - Urgency levels with appropriate styling
 * - Conversion-optimized copy and design
 */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  onUpgrade,
  currentTier,
  triggeredBy,
  usageAlert,
  title,
  message,
  primaryButtonText = 'Upgrade Now',
  secondaryButtonText = 'Maybe Later',
  showDismiss = true,
  autoHide = false,
  autoHideDelay = 10000,
  variant = 'banner',
  position = 'bottom',
  theme = 'default'
}) => {
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  /**
   * Animate prompt entrance when it becomes visible
   */
  React.useEffect(() => {
    if (visible) {
      // Animate slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide if configured
      if (autoHide && autoHideDelay > 0) {
        const timeout = setTimeout(() => {
          handleClose();
        }, autoHideDelay);

        return () => clearTimeout(timeout);
      }
    } else {
      // Reset animations
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, autoHide, autoHideDelay, slideAnim, fadeAnim]);

  /**
   * Generate contextual title based on triggering feature
   */
  const getContextualTitle = (): string => {
    if (title) return title;

    const featureMessages = {
      [UsageEventType.TRIAGE_SESSION]: 'Session Limit Reached',
      [UsageEventType.REPORT_GENERATION]: 'Report Limit Reached', 
      [UsageEventType.DATA_EXPORT]: 'Export Limit Reached',
      [UsageEventType.USER_INVITATION]: 'User Limit Reached',
      [UsageEventType.API_CALL]: 'API Limit Reached'
    };

    return featureMessages[triggeredBy] || 'Upgrade Required';
  };

  /**
   * Generate contextual message with upgrade benefits
   */
  const getContextualMessage = (): string => {
    if (message) return message;

    const baseMessages = {
      [UsageEventType.TRIAGE_SESSION]: 'You\'ve used all your monthly triage sessions. Upgrade for unlimited access.',
      [UsageEventType.REPORT_GENERATION]: 'You\'ve reached your monthly report limit. Get unlimited reports with Pro.',
      [UsageEventType.DATA_EXPORT]: 'You\'ve used all your monthly exports. Upgrade for unlimited data access.',
      [UsageEventType.USER_INVITATION]: 'You\'ve reached your team size limit. Upgrade to add more members.',
      [UsageEventType.API_CALL]: 'You\'ve exceeded your API rate limit. Upgrade for higher limits.'
    };

    let baseMessage = baseMessages[triggeredBy] || 'Upgrade your plan to continue using this feature.';
    
    // Add urgency or benefits based on usage alert
    if (usageAlert) {
      const percentageUsed = usageAlert.percentageUsed;
      if (percentageUsed >= 100) {
        baseMessage += ' Upgrade now to continue without interruption.';
      } else if (percentageUsed >= 95) {
        baseMessage += ' You\'re almost at your limit - upgrade to avoid disruption.';
      }
    }

    return baseMessage;
  };

  /**
   * Get upgrade benefits specific to the current context
   */
  const getUpgradeBenefits = (): string[] => {
    const commonBenefits = ['Priority support', 'No ads'];
    
    const contextBenefits = {
      [UsageEventType.TRIAGE_SESSION]: ['Unlimited triage sessions', 'Advanced analytics'],
      [UsageEventType.REPORT_GENERATION]: ['Unlimited reports', 'Custom report templates'],
      [UsageEventType.DATA_EXPORT]: ['Unlimited exports', 'Multiple export formats'],
      [UsageEventType.USER_INVITATION]: ['Up to 5 team members', 'Team collaboration tools'],
      [UsageEventType.API_CALL]: ['Higher API limits', 'Priority API access']
    };

    return [...(contextBenefits[triggeredBy] || []), ...commonBenefits];
  };

  /**
   * Handle animated close with callback
   */
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  /**
   * Handle upgrade button press with confirmation for enterprise
   */
  const handleUpgrade = () => {
    // Track upgrade prompt interaction for analytics
    console.log('Upgrade prompt - upgrade clicked', {
      currentTier,
      triggeredBy,
      variant,
      theme
    });

    if (currentTier === SubscriptionTier.ENTERPRISE) {
      Alert.alert(
        'Enterprise Support',
        'Contact our enterprise team for custom solutions and dedicated support.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Contact Sales',
            onPress: () => {
              // Handle enterprise contact flow
              console.log('Enterprise contact requested');
            }
          }
        ]
      );
      return;
    }

    onUpgrade();
  };

  /**
   * Get theme-based styling
   */
  const getThemeColors = () => {
    switch (theme) {
      case 'urgent':
        return {
          gradient: ['#FF6B6B', '#FF8E8E'],
          text: '#FFFFFF',
          secondaryText: 'rgba(255, 255, 255, 0.9)',
          buttonBg: '#FFFFFF',
          buttonText: '#FF6B6B'
        };
      case 'friendly':
        return {
          gradient: ['#4ECDC4', '#44A08D'],
          text: '#FFFFFF',
          secondaryText: 'rgba(255, 255, 255, 0.9)',
          buttonBg: '#FFFFFF',
          buttonText: '#44A08D'
        };
      default:
        return {
          gradient: ['#667eea', '#764ba2'],
          text: '#FFFFFF',
          secondaryText: 'rgba(255, 255, 255, 0.9)',
          buttonBg: '#FFFFFF',
          buttonText: '#667eea'
        };
    }
  };

  /**
   * Get animation transform based on position and variant
   */
  const getAnimationTransform = () => {
    const slideDistance = 100;
    
    if (variant === 'fullscreen') {
      return {
        opacity: fadeAnim,
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDistance, 0],
            }),
          },
        ],
      };
    }

    // For banner and card variants
    let translateProperty = 'translateY';
    let outputRange = [slideDistance, 0];

    if (position === 'top') {
      outputRange = [-slideDistance, 0];
    } else if (position === 'center') {
      // Scale animation for center position
      return {
        opacity: fadeAnim,
        transform: [
          {
            scale: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            }),
          },
        ],
      };
    }

    return {
      opacity: fadeAnim,
      transform: [
        {
          [translateProperty]: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange,
          }),
        },
      ],
    };
  };

  if (!visible) return null;

  const themeColors = getThemeColors();
  const benefits = getUpgradeBenefits();

  return (
    <Animated.View style={[
      styles.container,
      styles[`${variant}Container`],
      styles[`${position}Position`],
      getAnimationTransform()
    ]}>
      <LinearGradient
        colors={themeColors.gradient}
        style={[styles.promptContent, styles[`${variant}Content`]]}
      >
        {/* Header with close button */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            {/* Urgency indicator */}
            {theme === 'urgent' && (
              <Text style={styles.urgencyIcon}>⚠️</Text>
            )}
            
            <Typography 
              variant="h3" 
              style={[styles.title, { color: themeColors.text }]}
            >
              {getContextualTitle()}
            </Typography>
          </View>

          {/* Close button */}
          {showDismiss && variant !== 'banner' && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeButtonText, { color: themeColors.text }]}>
                ×
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Message content */}
        <View style={styles.messageContainer}>
          <Typography 
            variant="body1" 
            style={[styles.message, { color: themeColors.secondaryText }]}
          >
            {getContextualMessage()}
          </Typography>

          {/* Benefits list for non-banner variants */}
          {variant !== 'banner' && benefits.length > 0 && (
            <View style={styles.benefitsContainer}>
              <Typography 
                variant="body2" 
                style={[styles.benefitsTitle, { color: themeColors.text }]}
              >
                What you'll get:
              </Typography>
              {benefits.slice(0, 3).map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={[styles.benefitIcon, { color: themeColors.text }]}>
                    ✓
                  </Text>
                  <Text style={[styles.benefitText, { color: themeColors.secondaryText }]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Usage progress for applicable contexts */}
          {usageAlert && usageAlert.limit > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(usageAlert.percentageUsed, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: themeColors.secondaryText }]}>
                {usageAlert.currentUsage} / {usageAlert.limit} used
              </Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={[styles.actions, styles[`${variant}Actions`]]}>
          <Button
            variant="primary"
            onPress={handleUpgrade}
            style={[
              styles.primaryButton,
              { backgroundColor: themeColors.buttonBg }
            ]}
            textStyle={{ color: themeColors.buttonText }}
          >
            {primaryButtonText}
          </Button>

          {showDismiss && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleClose}
            >
              <Text style={[styles.secondaryButtonText, { color: themeColors.secondaryText }]}>
                {secondaryButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  bannerContainer: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    paddingHorizontal: 24,
  },
  fullscreenContainer: {
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topPosition: {
    top: 50,
  },
  bottomPosition: {
    bottom: 50,
  },
  centerPosition: {
    top: '50%',
    transform: [{ translateY: -150 }],
  },
  promptContent: {
    borderRadius: 12,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bannerContent: {
    borderRadius: 8,
    padding: 16,
  },
  cardContent: {
    borderRadius: 16,
    padding: 24,
  },
  fullscreenContent: {
    borderRadius: 20,
    padding: 32,
    maxWidth: 400,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  benefitsContainer: {
    marginTop: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
    width: 16,
  },
  benefitText: {
    fontSize: 12,
    flex: 1,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerActions: {
    flexDirection: 'column',
    gap: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  fullscreenActions: {
    flexDirection: 'column',
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default UpgradePrompt;