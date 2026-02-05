/**
 * UpgradeModal Component
 * Triggers Stripe checkout when user needs to upgrade
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H2, H3, Body1, Body2 } from '../common/Typography';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { UsageMeter } from './UsageMeter';
import { PlanCard } from './PlanCard';

export interface UpgradePlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  monthlyScans: number | null;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (priceId: string) => Promise<void>;
  currentPlan?: string;
  currentUsage?: {
    used: number;
    limit: number;
  };
  plans?: UpgradePlan[];
  reason?: 'limit_reached' | 'feature_locked' | 'voluntary';
  featureName?: string;
}

const DEFAULT_PLANS: UpgradePlan[] = [
  {
    id: 'user',
    name: 'User',
    description: 'For individual developers',
    priceMonthly: 1900,
    priceYearly: 19000,
    features: [
      '100 scans per month',
      'Full accessibility reports',
      'Lighthouse integration',
      'Export reports',
      'Priority email support',
    ],
    monthlyScans: 100,
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For development teams',
    priceMonthly: 4900,
    priceYearly: 49000,
    features: [
      '500 scans per month',
      'Everything in User',
      'Up to 5 team members',
      'Team dashboard',
      'API access',
      'Slack integration',
    ],
    monthlyScans: 500,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Unlimited scans',
      'Everything in Team',
      'Unlimited team members',
      'SSO integration',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    monthlyScans: null,
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  currentPlan = 'free',
  currentUsage,
  plans = DEFAULT_PLANS,
  reason = 'voluntary',
  featureName,
}) => {
  const theme = useTheme();
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const getTitle = (): string => {
    switch (reason) {
      case 'limit_reached':
        return "You've Hit Your Limit";
      case 'feature_locked':
        return `Unlock ${featureName || 'This Feature'}`;
      default:
        return 'Upgrade Your Plan';
    }
  };

  const getSubtitle = (): string => {
    switch (reason) {
      case 'limit_reached':
        return 'Upgrade to continue scanning and unlock more features.';
      case 'feature_locked':
        return `Get access to ${featureName || 'premium features'} with an upgraded plan.`;
      default:
        return 'Choose a plan that works best for you.';
    }
  };

  const handleSelectPlan = useCallback(async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // Handle enterprise separately
    if (planId === 'enterprise') {
      Alert.alert(
        'Enterprise Plan',
        'Contact our sales team for custom enterprise pricing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Contact Sales',
            onPress: () => Linking.openURL('mailto:sales@rapidtriage.me?subject=Enterprise%20Plan%20Inquiry'),
          },
        ]
      );
      return;
    }

    const priceId = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
    if (!priceId) {
      Alert.alert('Error', 'This plan is not available for purchase at this time.');
      return;
    }

    try {
      setLoading(planId);
      await onUpgrade(priceId);
      onClose();
    } catch (error) {
      Alert.alert(
        'Upgrade Failed',
        'Something went wrong. Please try again or contact support.'
      );
    } finally {
      setLoading(null);
    }
  }, [plans, isYearly, onUpgrade, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.PRIMARY }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Body1 style={styles.closeText}>✕</Body1>
          </TouchableOpacity>
          
          <H2 style={styles.title}>{getTitle()}</H2>
          <Body1 style={styles.subtitle}>{getSubtitle()}</Body1>

          {/* Current Usage */}
          {currentUsage && (
            <Card style={styles.usageCard} padding="MD">
              <UsageMeter
                used={currentUsage.used}
                limit={currentUsage.limit}
                label="Current Usage"
                size="small"
              />
            </Card>
          )}
        </View>

        {/* Billing Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              !isYearly && { backgroundColor: theme.PRIMARY },
            ]}
            onPress={() => setIsYearly(false)}
          >
            <Body2
              style={[
                styles.toggleText,
                { color: !isYearly ? '#FFFFFF' : theme.TEXT_SECONDARY },
              ]}
            >
              Monthly
            </Body2>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              isYearly && { backgroundColor: theme.PRIMARY },
            ]}
            onPress={() => setIsYearly(true)}
          >
            <Body2
              style={[
                styles.toggleText,
                { color: isYearly ? '#FFFFFF' : theme.TEXT_SECONDARY },
              ]}
            >
              Yearly
            </Body2>
            <View style={[styles.saveBadge, { backgroundColor: theme.SUCCESS }]}>
              <Body2 style={styles.saveText}>Save 16%</Body2>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans List */}
        <ScrollView
          style={styles.plansContainer}
          contentContainerStyle={styles.plansContent}
          showsVerticalScrollIndicator={false}
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              name={plan.name}
              description={plan.description}
              priceMonthly={plan.priceMonthly}
              priceYearly={plan.priceYearly}
              features={plan.features}
              monthlyScans={plan.monthlyScans}
              isCurrentPlan={plan.id === currentPlan}
              isPopular={plan.id === 'user'}
              isYearly={isYearly}
              onSelect={handleSelectPlan}
              loading={loading === plan.id}
              disabled={loading !== null && loading !== plan.id}
            />
          ))}

          {/* Money Back Guarantee */}
          <View style={styles.guarantee}>
            <Body2 style={[styles.guaranteeText, { color: theme.TEXT_SECONDARY }]}>
              🔒 30-day money-back guarantee • Cancel anytime
            </Body2>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.LG,
    paddingHorizontal: SPACING.LG,
    borderBottomLeftRadius: BORDER_RADIUS.XL,
    borderBottomRightRadius: BORDER_RADIUS.XL,
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: SPACING.LG,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  usageCard: {
    marginTop: SPACING.SM,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.LG,
    marginTop: -SPACING.MD,
    marginBottom: SPACING.MD,
    backgroundColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.MD,
    padding: 4,
    ...SHADOWS.SM,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  toggleText: {
    fontWeight: '600',
  },
  saveBadge: {
    marginLeft: SPACING.XS,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.SM,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  plansContainer: {
    flex: 1,
  },
  plansContent: {
    padding: SPACING.LG,
    paddingBottom: SPACING.XXL,
  },
  guarantee: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
  },
  guaranteeText: {
    textAlign: 'center',
  },
});

export default UpgradeModal;
