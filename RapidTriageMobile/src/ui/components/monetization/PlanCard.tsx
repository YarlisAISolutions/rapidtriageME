/**
 * PlanCard Component
 * Displays subscription plan details with features and pricing
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H3, Body1, Body2 } from '../common/Typography';
import { Button } from '../common/Button';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanCardProps {
  id: string;
  name: string;
  description: string;
  priceMonthly: number; // in cents
  priceYearly?: number; // in cents
  features: string[];
  monthlyScans: number | null; // null = unlimited
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  isYearly?: boolean;
  onSelect: (planId: string) => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  id,
  name,
  description,
  priceMonthly,
  priceYearly,
  features,
  monthlyScans,
  isCurrentPlan = false,
  isPopular = false,
  isYearly = false,
  onSelect,
  disabled = false,
  loading = false,
  style,
}) => {
  const theme = useTheme();

  const formatPrice = (cents: number): string => {
    if (cents === 0) return 'Free';
    return `$${(cents / 100).toFixed(0)}`;
  };

  const displayPrice = isYearly && priceYearly ? priceYearly / 12 : priceMonthly;
  const savings = priceYearly ? Math.round((1 - priceYearly / (priceMonthly * 12)) * 100) : 0;

  const getButtonText = (): string => {
    if (isCurrentPlan) return 'Current Plan';
    if (priceMonthly === 0) return 'Contact Sales';
    return 'Select Plan';
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.BACKGROUND_PRIMARY,
          borderColor: isPopular ? theme.PRIMARY : theme.BORDER_PRIMARY,
          borderWidth: isPopular ? 2 : 1,
        },
        isPopular && { ...SHADOWS.MD },
        style,
      ]}
    >
      {/* Popular Badge */}
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.PRIMARY }]}>
          <Body2 style={styles.popularText}>MOST POPULAR</Body2>
        </View>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <View style={[styles.currentBadge, { backgroundColor: theme.SUCCESS }]}>
          <Body2 style={styles.currentText}>CURRENT</Body2>
        </View>
      )}

      {/* Plan Header */}
      <View style={styles.header}>
        <H3 style={[styles.planName, { color: theme.TEXT }]}>{name}</H3>
        <Body2 style={[styles.description, { color: theme.TEXT_SECONDARY }]}>
          {description}
        </Body2>
      </View>

      {/* Pricing */}
      <View style={styles.pricing}>
        <View style={styles.priceRow}>
          <H3 style={[styles.price, { color: theme.PRIMARY }]}>
            {formatPrice(displayPrice)}
          </H3>
          {displayPrice > 0 && (
            <Body2 style={[styles.period, { color: theme.TEXT_SECONDARY }]}>
              /month
            </Body2>
          )}
        </View>
        {isYearly && savings > 0 && (
          <View style={[styles.savingsBadge, { backgroundColor: theme.SUCCESS + '20' }]}>
            <Body2 style={[styles.savingsText, { color: theme.SUCCESS }]}>
              Save {savings}%
            </Body2>
          </View>
        )}
      </View>

      {/* Scan Limit */}
      <View style={[styles.scanLimit, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
        <Body1 style={[styles.scanLimitText, { color: theme.TEXT }]}>
          {monthlyScans === null
            ? '∞ Unlimited scans'
            : `${monthlyScans} scans/month`}
        </Body1>
      </View>

      {/* Features List */}
      <View style={styles.features}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={[styles.checkmark, { backgroundColor: theme.SUCCESS }]}>
              <Body2 style={styles.checkmarkText}>✓</Body2>
            </View>
            <Body2 style={[styles.featureText, { color: theme.TEXT }]}>
              {feature}
            </Body2>
          </View>
        ))}
      </View>

      {/* Action Button */}
      <Button
        title={getButtonText()}
        onPress={() => onSelect(id)}
        variant={isPopular ? 'primary' : 'outline'}
        size="large"
        fullWidth
        disabled={disabled || isCurrentPlan}
        loading={loading}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  currentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderBottomLeftRadius: BORDER_RADIUS.MD,
  },
  currentText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  header: {
    marginBottom: SPACING.MD,
  },
  planName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: SPACING.XS,
  },
  description: {
    fontSize: 14,
  },
  pricing: {
    marginBottom: SPACING.MD,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
  },
  period: {
    fontSize: 14,
    marginLeft: SPACING.XS,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS / 2,
    borderRadius: BORDER_RADIUS.SM,
    marginTop: SPACING.XS,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scanLimit: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
  },
  scanLimitText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  features: {
    marginBottom: SPACING.LG,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
  },
  button: {
    marginTop: 'auto',
  },
});

export default PlanCard;
