import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../common/Button';
import { Typography } from '../common/Typography';
import { Card } from '../common/Card';
import { SubscriptionTier, SubscriptionPlan, paymentService } from '../../../services/payment/payment.service';
import { UsageAlert, UsageEventType } from '../../../services/usage/usage.service';
import { authService } from '../../../services/auth/auth.service';

const { width, height } = Dimensions.get('window');

/**
 * Props for the PaywallModal component
 * Configures display options and callback handlers
 */
export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => Promise<void>;
  onDismiss?: () => void;
  
  // Triggering context
  triggeredBy?: {
    feature: UsageEventType;
    currentUsage: number;
    limit: number;
    alert?: UsageAlert;
  };
  
  // Current subscription context
  currentTier?: SubscriptionTier;
  
  // Customization options
  title?: string;
  subtitle?: string;
  highlightedPlan?: SubscriptionTier;
  showTrialOffer?: boolean;
  compactMode?: boolean;
}

/**
 * Feature highlight component for plan benefits
 * Displays individual feature with checkmark or limitation indicator
 */
interface FeatureItemProps {
  feature: string;
  available: boolean;
  highlighted?: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ feature, available, highlighted = false }) => (
  <View style={styles.featureItem}>
    <View style={[
      styles.featureIcon, 
      { backgroundColor: available ? '#4CAF50' : '#757575' }
    ]}>
      <Text style={styles.featureIconText}>{available ? '✓' : '×'}</Text>
    </View>
    <Text style={[
      styles.featureText,
      highlighted && styles.featureTextHighlighted,
      !available && styles.featureTextDisabled
    ]}>
      {feature}
    </Text>
  </View>
);

/**
 * Plan card component for subscription tier display
 * Shows pricing, features, and upgrade options
 */
interface PlanCardProps {
  plan: SubscriptionPlan;
  currentTier?: SubscriptionTier;
  isHighlighted: boolean;
  onSelect: (planId: string) => void;
  showTrialOffer: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  currentTier,
  isHighlighted,
  onSelect,
  showTrialOffer
}) => {
  const isCurrentPlan = currentTier === plan.tier;
  const isUpgrade = currentTier && plan.tier !== SubscriptionTier.FREE && 
    paymentService.canUpgradeTo(currentTier, plan.tier);

  /**
   * Format price for display with appropriate currency and period
   */
  const formatPrice = (price: number): string => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(2)}/mo`;
  };

  /**
   * Get appropriate call-to-action text based on plan and user status
   */
  const getButtonText = (): string => {
    if (isCurrentPlan) return 'Current Plan';
    if (plan.tier === SubscriptionTier.FREE) return 'Downgrade';
    if (plan.tier === SubscriptionTier.ENTERPRISE) return 'Contact Sales';
    if (showTrialOffer && isUpgrade) return 'Start 7-Day Trial';
    return isUpgrade ? 'Upgrade' : 'Select Plan';
  };

  /**
   * Get button style based on plan status and highlighting
   */
  const getButtonStyle = () => {
    if (isCurrentPlan) return 'disabled';
    if (isHighlighted) return 'primary';
    return 'outline';
  };

  return (
    <Card style={[
      styles.planCard,
      isHighlighted && styles.planCardHighlighted,
      isCurrentPlan && styles.planCardCurrent
    ]}>
      {/* Plan header with name and pricing */}
      <View style={styles.planHeader}>
        <Typography variant="h3" style={styles.planName}>
          {plan.name}
        </Typography>
        
        <View style={styles.priceContainer}>
          <Typography variant="h2" style={styles.planPrice}>
            {formatPrice(plan.price)}
          </Typography>
          {plan.price > 0 && (
            <Typography variant="body2" style={styles.priceNote}>
              Billed monthly
            </Typography>
          )}
        </View>

        {/* Highlight badge for recommended plans */}
        {isHighlighted && (
          <View style={styles.highlightBadge}>
            <Text style={styles.highlightBadgeText}>MOST POPULAR</Text>
          </View>
        )}

        {/* Current plan indicator */}
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
        )}
      </View>

      {/* Plan features list */}
      <View style={styles.planFeatures}>
        {plan.features.map((feature, index) => (
          <FeatureItem
            key={index}
            feature={feature}
            available={true}
            highlighted={isHighlighted}
          />
        ))}
        
        {/* Session limit display */}
        <FeatureItem
          feature={plan.monthlySessionLimit 
            ? `${plan.monthlySessionLimit} sessions/month` 
            : 'Unlimited sessions'
          }
          available={true}
          highlighted={isHighlighted}
        />
        
        {/* User limit display */}
        <FeatureItem
          feature={plan.maxUsers === -1 
            ? 'Unlimited users' 
            : `Up to ${plan.maxUsers} user${plan.maxUsers === 1 ? '' : 's'}`
          }
          available={true}
          highlighted={isHighlighted}
        />
      </View>

      {/* Trial offer banner */}
      {showTrialOffer && isUpgrade && plan.tier !== SubscriptionTier.ENTERPRISE && (
        <View style={styles.trialBanner}>
          <Text style={styles.trialText}>
            🎉 7-day free trial • Cancel anytime
          </Text>
        </View>
      )}

      {/* Action button */}
      <View style={styles.planAction}>
        <Button
          variant={getButtonStyle() as any}
          onPress={() => onSelect(plan.id)}
          disabled={isCurrentPlan}
          style={styles.planButton}
        >
          {getButtonText()}
        </Button>
      </View>
    </Card>
  );
};

/**
 * Comprehensive paywall modal component for subscription upgrades
 * Displays when users hit usage limits or access premium features
 * 
 * Key features:
 * - Context-aware messaging based on triggering feature
 * - Plan comparison with current tier highlighting
 * - Trial offers for eligible upgrades
 * - Usage limit information and upgrade benefits
 * - Smooth upgrade flow with payment integration
 */
export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  onDismiss,
  triggeredBy,
  currentTier = SubscriptionTier.FREE,
  title,
  subtitle,
  highlightedPlan = SubscriptionTier.PRO,
  showTrialOffer = true,
  compactMode = false
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());

  /**
   * Load subscription plans on component mount
   * Filters plans based on current tier and availability
   */
  useEffect(() => {
    const loadPlans = async () => {
      try {
        // Get all available plans from payment service
        const availablePlans = paymentService.subscriptionPlans;
        
        // Filter out current plan and show upgrade options
        const upgradePlans = availablePlans.filter(plan => 
          plan.tier !== currentTier
        );
        
        setPlans(upgradePlans);
      } catch (error) {
        console.error('Failed to load subscription plans:', error);
      }
    };

    if (visible) {
      loadPlans();
      setCurrentUser(authService.getCurrentUser());
    }
  }, [visible, currentTier]);

  /**
   * Generate contextual title based on triggering feature
   */
  const getContextualTitle = (): string => {
    if (title) return title;

    if (triggeredBy) {
      const featureNames = {
        [UsageEventType.TRIAGE_SESSION]: 'triage sessions',
        [UsageEventType.REPORT_GENERATION]: 'reports',
        [UsageEventType.DATA_EXPORT]: 'data exports',
        [UsageEventType.USER_INVITATION]: 'team members',
        [UsageEventType.API_CALL]: 'API calls'
      };

      const featureName = featureNames[triggeredBy.feature] || 'features';
      
      if (triggeredBy.alert?.type === 'exceeded') {
        return `You've reached your ${featureName} limit`;
      } else {
        return `Upgrade for unlimited ${featureName}`;
      }
    }

    return 'Upgrade Your Plan';
  };

  /**
   * Generate contextual subtitle with usage information
   */
  const getContextualSubtitle = (): string => {
    if (subtitle) return subtitle;

    if (triggeredBy) {
      const { currentUsage, limit } = triggeredBy;
      return `You've used ${currentUsage} of ${limit}. Upgrade to continue with unlimited access.`;
    }

    return 'Choose a plan that works best for you';
  };

  /**
   * Handle plan selection and upgrade process
   */
  const handlePlanSelection = async (planId: string) => {
    if (loading) return;

    try {
      setLoading(true);
      setSelectedPlan(planId);

      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Selected plan not found');
      }

      // Handle enterprise plan differently (contact sales)
      if (plan.tier === SubscriptionTier.ENTERPRISE) {
        Alert.alert(
          'Enterprise Plan',
          'Contact our sales team for enterprise pricing and custom solutions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Contact Sales', 
              onPress: () => {
                // Open email or contact form
                console.log('Opening contact sales flow');
              }
            }
          ]
        );
        return;
      }

      // Handle free plan (downgrade)
      if (plan.tier === SubscriptionTier.FREE) {
        Alert.alert(
          'Downgrade Plan',
          'Are you sure you want to downgrade to the free plan? You\'ll lose access to premium features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Downgrade', 
              style: 'destructive',
              onPress: async () => {
                await onUpgrade(planId);
                onClose();
              }
            }
          ]
        );
        return;
      }

      // Handle paid plan upgrade
      await onUpgrade(planId);
      onClose();
    } catch (error) {
      console.error('Plan selection error:', error);
      Alert.alert(
        'Upgrade Failed',
        'Something went wrong during the upgrade process. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  /**
   * Handle modal dismissal with optional callback
   */
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header section */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Typography variant="h1" style={styles.title}>
                {getContextualTitle()}
              </Typography>
              
              <Typography variant="body1" style={styles.subtitle}>
                {getContextualSubtitle()}
              </Typography>
            </View>
          </View>

          {/* Usage alert section */}
          {triggeredBy && (
            <View style={styles.alertSection}>
              <Card style={styles.alertCard}>
                <View style={styles.alertContent}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <View style={styles.alertText}>
                    <Typography variant="body1" style={styles.alertMessage}>
                      {triggeredBy.alert?.message}
                    </Typography>
                    {triggeredBy.alert?.recommendedAction && (
                      <Typography variant="body2" style={styles.alertAction}>
                        {triggeredBy.alert.recommendedAction}
                      </Typography>
                    )}
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Plans section */}
          <View style={styles.plansSection}>
            <Typography variant="h2" style={styles.sectionTitle}>
              Choose Your Plan
            </Typography>
            
            <View style={[
              styles.plansContainer,
              compactMode && styles.plansContainerCompact
            ]}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  currentTier={currentTier}
                  isHighlighted={plan.tier === highlightedPlan}
                  onSelect={handlePlanSelection}
                  showTrialOffer={showTrialOffer}
                />
              ))}
            </View>
          </View>

          {/* Benefits section */}
          <View style={styles.benefitsSection}>
            <Typography variant="h3" style={styles.benefitsTitle}>
              Why Upgrade?
            </Typography>
            
            <View style={styles.benefitsList}>
              <FeatureItem feature="Unlimited triage sessions" available={true} />
              <FeatureItem feature="Priority customer support" available={true} />
              <FeatureItem feature="Advanced analytics and insights" available={true} />
              <FeatureItem feature="Data export capabilities" available={true} />
              <FeatureItem feature="No ads or promotional content" available={true} />
            </View>
          </View>

          {/* Footer section */}
          <View style={styles.footer}>
            <Typography variant="body2" style={styles.footerText}>
              All plans include a 30-day money-back guarantee. Cancel anytime.
            </Typography>
            
            {showTrialOffer && (
              <Typography variant="body2" style={styles.trialFooterText}>
                Start your free trial today. No commitment required.
              </Typography>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
    paddingRight: 40,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  alertSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  alertCard: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertText: {
    flex: 1,
  },
  alertMessage: {
    color: '#856404',
    marginBottom: 4,
  },
  alertAction: {
    color: '#6C5CE7',
    fontStyle: 'italic',
  },
  plansSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 22,
    fontWeight: '600',
  },
  plansContainer: {
    gap: 16,
  },
  plansContainerCompact: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  planCardHighlighted: {
    borderColor: '#6C5CE7',
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  planCardCurrent: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  planHeader: {
    padding: 24,
    paddingBottom: 16,
    position: 'relative',
  },
  planName: {
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  priceContainer: {
    alignItems: 'center',
  },
  planPrice: {
    color: '#6C5CE7',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceNote: {
    color: '#718096',
    fontSize: 14,
  },
  highlightBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 16,
  },
  highlightBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  currentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 16,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  planFeatures: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  featureTextHighlighted: {
    color: '#6C5CE7',
    fontWeight: '500',
  },
  featureTextDisabled: {
    color: '#A0AEC0',
  },
  trialBanner: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  trialText: {
    color: '#1976D2',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  planAction: {
    padding: 24,
    paddingTop: 16,
  },
  planButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  benefitsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  benefitsTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '600',
  },
  benefitsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  trialFooterText: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PaywallModal;