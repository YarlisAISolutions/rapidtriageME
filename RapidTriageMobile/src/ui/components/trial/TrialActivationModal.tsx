import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { COLORS } from '../../../constants/colors';

/**
 * Props for the TrialActivationModal component
 */
export interface TrialActivationModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when trial is activated */
  onActivate: () => Promise<void>;
  /** Current user tier */
  currentTier: string;
  /** Target trial tier */
  targetTier?: string;
  /** Trial duration in days */
  trialDuration?: number;
  /** Loading state during activation */
  isLoading?: boolean;
}

/**
 * Trial benefits data for display
 */
const TRIAL_BENEFITS = [
  {
    icon: '🚀',
    title: 'Unlimited Scans',
    description: 'Perform unlimited website scans and get detailed insights',
    highlight: 'No monthly limits'
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Access comprehensive performance metrics and trends',
    highlight: 'Pro-level insights'
  },
  {
    icon: '📄',
    title: 'Detailed Reports',
    description: 'Generate professional reports with actionable recommendations',
    highlight: 'Export & share'
  },
  {
    icon: '👥',
    title: 'Team Collaboration',
    description: 'Invite team members and collaborate on projects',
    highlight: 'Up to 3 members'
  },
  {
    icon: '⚡',
    title: 'Priority Support',
    description: 'Get faster response times from our expert support team',
    highlight: '24/7 availability'
  },
  {
    icon: '🔄',
    title: 'API Access',
    description: 'Integrate with your tools using our powerful API',
    highlight: 'Full access'
  }
];

/**
 * Modal for activating free trial with compelling benefits display
 * 
 * Features:
 * - Compelling trial benefits presentation
 * - Social proof and testimonials
 * - Clear trial terms and expectations
 * - Smooth activation flow with loading states
 * - Animated entrance and benefit reveals
 * - Mobile-optimized layout and interactions
 * - No credit card required messaging
 * - Instant activation with one tap
 */
export const TrialActivationModal: React.FC<TrialActivationModalProps> = ({
  visible,
  onClose,
  onActivate,
  currentTier,
  targetTier = 'Pro',
  trialDuration = 14,
  isLoading = false
}) => {
  const [selectedBenefitIndex, setSelectedBenefitIndex] = useState<number | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));

  /**
   * Animate modal entrance
   */
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible]);

  /**
   * Handle trial activation with loading state
   */
  const handleActivate = async () => {
    try {
      await onActivate();
    } catch (error) {
      console.error('Trial activation failed:', error);
      // Error handling would be managed by parent component
    }
  };

  /**
   * Render benefit item with interactive highlight
   */
  const renderBenefitItem = (benefit: typeof TRIAL_BENEFITS[0], index: number) => {
    const isSelected = selectedBenefitIndex === index;
    
    return (
      <TouchableOpacity
        key={index}
        style={[styles.benefitItem, isSelected && styles.benefitItemSelected]}
        onPress={() => setSelectedBenefitIndex(isSelected ? null : index)}
        activeOpacity={0.7}
      >
        <View style={styles.benefitHeader}>
          <Text style={styles.benefitIcon}>{benefit.icon}</Text>
          <View style={styles.benefitContent}>
            <Text style={styles.benefitTitle}>{benefit.title}</Text>
            <Text style={styles.benefitHighlight}>{benefit.highlight}</Text>
          </View>
          <Text style={[styles.expandIcon, isSelected && styles.expandIconRotated]}>
            ›
          </Text>
        </View>
        
        {isSelected && (
          <Animated.View style={styles.benefitDescription}>
            <Text style={styles.benefitDescriptionText}>
              {benefit.description}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render testimonial section for social proof
   */
  const renderTestimonial = () => (
    <View style={styles.testimonialContainer}>
      <Text style={styles.testimonialQuote}>
        "The Pro trial showed me exactly what I was missing. The advanced analytics alone saved me hours of work!"
      </Text>
      <View style={styles.testimonialAuthor}>
        <View style={styles.authorAvatar}>
          <Text style={styles.authorInitial}>S</Text>
        </View>
        <View>
          <Text style={styles.authorName}>Sarah Chen</Text>
          <Text style={styles.authorTitle}>UX Designer</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          {/* Header */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                Start Your {targetTier} Trial
              </Text>
              <Text style={styles.headerSubtitle}>
                {trialDuration} days free • No credit card required
              </Text>
            </View>

            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>FREE</Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Value proposition */}
            <View style={styles.valueProposition}>
              <Typography variant="h3" style={styles.valueTitle}>
                Unlock Your Full Potential
              </Typography>
              <Text style={styles.valueDescription}>
                Experience all the power of {targetTier} with a {trialDuration}-day free trial. 
                No commitment, cancel anytime.
              </Text>
            </View>

            {/* Benefits list */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>
                What you'll get during your trial:
              </Text>
              {TRIAL_BENEFITS.map((benefit, index) => 
                renderBenefitItem(benefit, index)
              )}
            </View>

            {/* Social proof */}
            {renderTestimonial()}

            {/* Trial terms */}
            <View style={styles.termsContainer}>
              <View style={styles.termItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.termText}>
                  Full access to all {targetTier} features for {trialDuration} days
                </Text>
              </View>
              <View style={styles.termItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.termText}>
                  No credit card required to start
                </Text>
              </View>
              <View style={styles.termItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.termText}>
                  Cancel anytime during trial period
                </Text>
              </View>
              <View style={styles.termItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.termText}>
                  Automatic downgrade to {currentTier} if not upgraded
                </Text>
              </View>
            </View>

            {/* Usage stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>
                Join thousands of satisfied users
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>10k+</Text>
                  <Text style={styles.statLabel}>Active Users</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>95%</Text>
                  <Text style={styles.statLabel}>Satisfaction Rate</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>Support</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer with CTA */}
          <View style={styles.footer}>
            <Button
              variant="primary"
              onPress={handleActivate}
              loading={isLoading}
              style={styles.activateButton}
              disabled={isLoading}
            >
              {isLoading ? 'Activating...' : `Start ${trialDuration}-Day Free Trial`}
            </Button>
            
            <TouchableOpacity onPress={onClose} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>
                Maybe Later
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By starting your trial, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  header: {
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 8,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  trialBadge: {
    position: 'absolute',
    top: 16,
    left: 24,
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trialBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  valueProposition: {
    padding: 24,
    alignItems: 'center',
  },
  valueTitle: {
    textAlign: 'center',
    marginBottom: 12,
    color: COLORS.TEXT_PRIMARY,
  },
  valueDescription: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  benefitItem: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  benefitItemSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#F0F7FF',
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  benefitHighlight: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    transform: [{ rotate: '0deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '90deg' }],
  },
  benefitDescription: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_PRIMARY,
  },
  benefitDescriptionText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginTop: 8,
  },
  testimonialContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  testimonialQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: 16,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitial: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  authorTitle: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  termsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.SUCCESS,
    marginRight: 12,
    marginTop: 2,
  },
  termText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
    lineHeight: 20,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_PRIMARY,
  },
  activateButton: {
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default TrialActivationModal;