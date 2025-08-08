/**
 * Pricing table component
 * Displays subscription tiers with features and pricing
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H3, H4, H5, Body1, Body2, Caption } from '../common/Typography';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SUBSCRIPTION_TIERS } from '@constants/app';

export interface PricingProps {
  onSelectPlan: (planId: string) => void;
  currentPlanId?: string;
}

export const Pricing: React.FC<PricingProps> = ({
  onSelectPlan,
  currentPlanId,
}) => {
  const theme = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const getDiscountedPrice = (price: number | null) => {
    if (price === null) return null;
    return billingCycle === 'yearly' ? Math.round(price * 0.8) : price; // 20% discount for yearly
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return theme.TIER_FREE;
      case 'pro':
        return theme.TIER_PRO;
      case 'team':
        return theme.TIER_TEAM;
      case 'enterprise':
        return theme.TIER_ENTERPRISE;
      default:
        return theme.PRIMARY;
    }
  };

  const isPopular = (planId: string) => planId === 'pro';
  const isCurrentPlan = (planId: string) => planId === currentPlanId;

  return (
    <View style={[styles.container, { backgroundColor: theme.BACKGROUND_PRIMARY }]}>
      {/* Header */}
      <View style={styles.header}>
        <H3 style={[styles.title, { color: theme.TEXT }]}>
          Choose your plan
        </H3>
        <Body1 style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
          Start free, upgrade as you grow
        </Body1>

        {/* Billing toggle */}
        <View style={[styles.billingToggle, { backgroundColor: theme.BACKGROUND_TERTIARY }]}>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              billingCycle === 'monthly' && { backgroundColor: theme.PRIMARY },
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Body2 style={{
              color: billingCycle === 'monthly' ? theme.WHITE : theme.TEXT_SECONDARY
            }}>
              Monthly
            </Body2>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleOption,
              billingCycle === 'yearly' && { backgroundColor: theme.PRIMARY },
            ]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Body2 style={{
              color: billingCycle === 'yearly' ? theme.WHITE : theme.TEXT_SECONDARY
            }}>
              Yearly
            </Body2>
          </TouchableOpacity>
        </View>

        {billingCycle === 'yearly' && (
          <Caption style={[styles.discountNote, { color: theme.SECONDARY }]}>
            Save 20% with yearly billing
          </Caption>
        )}
      </View>

      {/* Pricing cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plansContainer}
      >
        {Object.values(SUBSCRIPTION_TIERS).map((tier) => {
          const planColor = getPlanColor(tier.id);
          const discountedPrice = getDiscountedPrice(tier.price);
          
          return (
            <Card
              key={tier.id}
              style={[
                styles.planCard,
                isPopular(tier.id) && {
                  borderColor: planColor,
                  borderWidth: 2,
                  transform: [{ scale: 1.05 }],
                },
                isCurrentPlan(tier.id) && {
                  backgroundColor: theme.BACKGROUND_SECONDARY,
                }
              ]}
              padding="LG"
              shadow="LG"
            >
              {/* Popular badge */}
              {isPopular(tier.id) && (
                <View style={[styles.popularBadge, { backgroundColor: planColor }]}>
                  <Caption style={[styles.popularText, { color: theme.WHITE }]}>
                    MOST POPULAR
                  </Caption>
                </View>
              )}

              {/* Current plan badge */}
              {isCurrentPlan(tier.id) && (
                <View style={[styles.currentBadge, { backgroundColor: theme.SUCCESS }]}>
                  <Caption style={[styles.currentText, { color: theme.WHITE }]}>
                    CURRENT PLAN
                  </Caption>
                </View>
              )}

              {/* Plan header */}
              <View style={styles.planHeader}>
                <H4 style={[styles.planName, { color: planColor }]}>
                  {tier.name}
                </H4>
                
                <View style={styles.priceContainer}>
                  {tier.price === null ? (
                    <H3 style={[styles.price, { color: theme.TEXT }]}>
                      Custom
                    </H3>
                  ) : tier.price === 0 ? (
                    <H3 style={[styles.price, { color: theme.TEXT }]}>
                      Free
                    </H3>
                  ) : (
                    <View style={styles.priceRow}>
                      <H3 style={[styles.price, { color: theme.TEXT }]}>
                        ${discountedPrice}
                      </H3>
                      <Body2 style={[styles.pricePeriod, { color: theme.TEXT_SECONDARY }]}>
                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                      </Body2>
                    </View>
                  )}
                  
                  {billingCycle === 'yearly' && tier.price && tier.price > 0 && (
                    <Caption style={[styles.originalPrice, { color: theme.TEXT_TERTIARY }]}>
                      was ${tier.price}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </Caption>
                  )}
                </View>
              </View>

              {/* Features list */}
              <View style={styles.featuresList}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Body1 style={[styles.featureIcon, { color: theme.SUCCESS }]}>
                      ✓
                    </Body1>
                    <Body2 style={[styles.featureText, { color: theme.TEXT }]}>
                      {feature}
                    </Body2>
                  </View>
                ))}
              </View>

              {/* Plan stats */}
              <View style={styles.planStats}>
                {tier.maxScansPerMonth !== -1 && (
                  <View style={styles.stat}>
                    <Caption style={[styles.statLabel, { color: theme.TEXT_TERTIARY }]}>
                      Monthly Scans
                    </Caption>
                    <Body2 style={[styles.statValue, { color: theme.TEXT }]}>
                      {tier.maxScansPerMonth.toLocaleString()}
                    </Body2>
                  </View>
                )}
                <View style={styles.stat}>
                  <Caption style={[styles.statLabel, { color: theme.TEXT_TERTIARY }]}>
                    Support Level
                  </Caption>
                  <Body2 style={[styles.statValue, { color: theme.TEXT }]}>
                    {tier.supportLevel}
                  </Body2>
                </View>
              </View>

              {/* Action button */}
              <Button
                title={
                  isCurrentPlan(tier.id) 
                    ? "Current Plan" 
                    : tier.id === 'enterprise' 
                      ? "Contact Sales" 
                      : tier.id === 'free' 
                        ? "Get Started" 
                        : "Upgrade"
                }
                onPress={() => onSelectPlan(tier.id)}
                variant={isPopular(tier.id) ? 'primary' : 'outline'}
                size="medium"
                fullWidth
                disabled={isCurrentPlan(tier.id)}
                style={[
                  styles.planButton,
                  !isPopular(tier.id) && { borderColor: planColor },
                ]}
                textStyle={!isPopular(tier.id) ? { color: planColor } : undefined}
              />
            </Card>
          );
        })}
      </ScrollView>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <Body1 style={[styles.bottomText, { color: theme.TEXT_SECONDARY }]}>
          All plans include a 14-day free trial. No credit card required.
        </Body1>
        <TouchableOpacity onPress={() => onSelectPlan('compare')}>
          <Body2 style={[styles.compareLink, { color: theme.PRIMARY }]}>
            Compare all features →
          </Body2>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.XXL,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  billingToggle: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.MD,
    padding: SPACING.XS,
    marginBottom: SPACING.SM,
  },
  toggleOption: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  discountNote: {
    textAlign: 'center',
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  planCard: {
    width: 280,
    marginRight: SPACING.MD,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -50 }],
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    zIndex: 1,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  currentBadge: {
    position: 'absolute',
    top: SPACING.SM,
    right: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  currentText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
    paddingTop: SPACING.SM,
  },
  planName: {
    marginBottom: SPACING.SM,
  },
  priceContainer: {
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
  },
  pricePeriod: {
    marginLeft: SPACING.XS,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    marginTop: SPACING.XS,
  },
  featuresList: {
    marginBottom: SPACING.LG,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  featureIcon: {
    marginRight: SPACING.SM,
    fontSize: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
  },
  planStats: {
    marginBottom: SPACING.LG,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  planButton: {
    marginTop: SPACING.SM,
  },
  bottomSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  bottomText: {
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  compareLink: {
    fontWeight: '600',
  },
});