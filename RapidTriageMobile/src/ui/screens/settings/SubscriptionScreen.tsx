/**
 * Subscription Screen
 * Displays current plan, usage, plan comparison, and billing management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H2, H3, Body1, Body2 } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UsageMeter } from '../../components/monetization/UsageMeter';
import { PlanCard } from '../../components/monetization/PlanCard';
import { BillingHistoryList, BillingItem } from '../../components/monetization/BillingHistoryList';
import { useAuthStore } from '@store/index';
import { useNavigation } from '@react-navigation/native';

// Plan definitions
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic scans',
    priceMonthly: 0,
    priceYearly: 0,
    features: ['10 scans per month', 'Basic accessibility checks', 'Email support'],
    monthlyScans: 10,
  },
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
    stripePriceIdMonthly: process.env.STRIPE_USER_PRICE_ID_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_USER_PRICE_ID_YEARLY,
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
    stripePriceIdMonthly: process.env.STRIPE_TEAM_PRICE_ID_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_TEAM_PRICE_ID_YEARLY,
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

export const SubscriptionScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'plan' | 'billing'>('plan');
  const [billingHistory, setBillingHistory] = useState<BillingItem[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  // Get current plan info
  const currentPlanId = user?.subscription?.tierId || 'free';
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS[0];
  const subscriptionStatus = user?.subscription?.status || 'active';
  const cancelAtPeriodEnd = user?.subscription?.cancelAtPeriodEnd || false;
  const periodEnd = user?.subscription?.currentPeriodEnd;
  const scansUsed = user?.subscription?.usage?.scansUsed || 0;
  const scansLimit = currentPlan.monthlyScans;

  // Mock billing history for now
  useEffect(() => {
    if (selectedTab === 'billing') {
      loadBillingHistory();
    }
  }, [selectedTab]);

  const loadBillingHistory = async () => {
    setLoadingBilling(true);
    try {
      // Mock data - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setBillingHistory([
        {
          id: '1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          amount: currentPlan.priceMonthly,
          currency: 'usd',
          status: 'paid',
          description: `${currentPlan.name} Plan - Monthly`,
          invoiceUrl: 'https://stripe.com/invoice/...',
        },
        {
          id: '2',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          amount: currentPlan.priceMonthly,
          currency: 'usd',
          status: 'paid',
          description: `${currentPlan.name} Plan - Monthly`,
        },
      ]);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh subscription data
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (selectedTab === 'billing') {
        await loadBillingHistory();
      }
    } finally {
      setRefreshing(false);
    }
  }, [selectedTab]);

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlanId) return;

    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    // Handle enterprise
    if (planId === 'enterprise') {
      Alert.alert(
        'Enterprise Plan',
        'Contact our sales team for custom enterprise pricing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Contact Sales',
            onPress: () => Linking.openURL('mailto:sales@rapidtriage.me?subject=Enterprise%20Plan'),
          },
        ]
      );
      return;
    }

    // Handle downgrade to free
    if (planId === 'free') {
      Alert.alert(
        'Downgrade to Free',
        'Are you sure? You\'ll lose access to premium features at the end of your billing period.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Downgrade',
            style: 'destructive',
            onPress: async () => {
              try {
                setUpgrading(planId);
                // Call cancel subscription API
                Alert.alert('Success', 'Your subscription will be canceled at the end of the billing period.');
              } catch (error) {
                Alert.alert('Error', 'Failed to cancel subscription.');
              } finally {
                setUpgrading(null);
              }
            },
          },
        ]
      );
      return;
    }

    // Handle upgrade
    try {
      setUpgrading(planId);
      
      // Get price ID
      const priceId = isYearly ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
      
      // Call create checkout session
      // const result = await httpsCallable(functions, 'createCheckoutSession')({
      //   priceId,
      //   successUrl: 'rapidtriage://subscription/success',
      //   cancelUrl: 'rapidtriage://subscription/cancel',
      // });
      // Linking.openURL(result.data.url);

      Alert.alert('Upgrading', 'Opening checkout...');
    } catch (error) {
      Alert.alert('Error', 'Failed to start checkout. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      // Call create portal session
      // const result = await httpsCallable(functions, 'createPortalSession')({
      //   returnUrl: 'rapidtriage://subscription',
      // });
      // Linking.openURL(result.data.url);
      
      Alert.alert('Billing Portal', 'Opening Stripe billing portal...');
    } catch (error) {
      Alert.alert('Error', 'Failed to open billing portal.');
    }
  };

  const handleReactivate = async () => {
    Alert.alert(
      'Reactivate Subscription',
      'Your subscription will continue at the end of your current billing period.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            try {
              // Call reactivate API
              Alert.alert('Success', 'Your subscription has been reactivated.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reactivate subscription.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <H2 style={[styles.title, { color: theme.TEXT }]}>Subscription</H2>
        </View>

        {/* Current Plan Card */}
        <Card style={styles.currentPlanCard} padding="LG">
          <View style={styles.currentPlanHeader}>
            <View>
              <Body2 style={[styles.currentPlanLabel, { color: theme.TEXT_SECONDARY }]}>
                Current Plan
              </Body2>
              <H3 style={[styles.currentPlanName, { color: theme.TEXT }]}>
                {currentPlan.name}
              </H3>
            </View>
            
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    subscriptionStatus === 'active' && !cancelAtPeriodEnd
                      ? theme.SUCCESS + '20'
                      : cancelAtPeriodEnd
                      ? theme.WARNING + '20'
                      : theme.ERROR + '20',
                },
              ]}
            >
              <Body2
                style={[
                  styles.statusText,
                  {
                    color:
                      subscriptionStatus === 'active' && !cancelAtPeriodEnd
                        ? theme.SUCCESS
                        : cancelAtPeriodEnd
                        ? theme.WARNING
                        : theme.ERROR,
                  },
                ]}
              >
                {cancelAtPeriodEnd ? 'Canceling' : subscriptionStatus}
              </Body2>
            </View>
          </View>

          {/* Cancellation Notice */}
          {cancelAtPeriodEnd && periodEnd && (
            <View style={[styles.cancelNotice, { backgroundColor: theme.WARNING + '15' }]}>
              <Body2 style={[styles.cancelNoticeText, { color: theme.TEXT }]}>
                Your subscription will end on {new Date(periodEnd).toLocaleDateString()}.
              </Body2>
              <Button
                title="Reactivate"
                onPress={handleReactivate}
                variant="primary"
                size="small"
              />
            </View>
          )}

          {/* Usage */}
          <View style={styles.usageSection}>
            <UsageMeter
              used={scansUsed}
              limit={scansLimit}
              label="Monthly Scans"
              size="medium"
              showRemaining
              showPercentage
            />
          </View>

          {/* Renewal Info */}
          {currentPlanId !== 'free' && periodEnd && !cancelAtPeriodEnd && (
            <Body2 style={[styles.renewalText, { color: theme.TEXT_SECONDARY }]}>
              Next billing date: {new Date(periodEnd).toLocaleDateString()}
            </Body2>
          )}

          {/* Manage Billing */}
          {currentPlanId !== 'free' && (
            <Button
              title="Manage Billing"
              onPress={handleManageBilling}
              variant="outline"
              size="medium"
              fullWidth
              style={styles.manageBillingButton}
            />
          )}
        </Card>

        {/* Tab Switcher */}
        <View style={[styles.tabs, { backgroundColor: theme.BACKGROUND_PRIMARY }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'plan' && { borderBottomColor: theme.PRIMARY, borderBottomWidth: 2 },
            ]}
            onPress={() => setSelectedTab('plan')}
          >
            <Body1
              style={[
                styles.tabText,
                { color: selectedTab === 'plan' ? theme.PRIMARY : theme.TEXT_SECONDARY },
              ]}
            >
              Plans
            </Body1>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'billing' && { borderBottomColor: theme.PRIMARY, borderBottomWidth: 2 },
            ]}
            onPress={() => setSelectedTab('billing')}
          >
            <Body1
              style={[
                styles.tabText,
                { color: selectedTab === 'billing' ? theme.PRIMARY : theme.TEXT_SECONDARY },
              ]}
            >
              Billing History
            </Body1>
          </TouchableOpacity>
        </View>

        {/* Plans Tab */}
        {selectedTab === 'plan' && (
          <View style={styles.plansSection}>
            {/* Billing Toggle */}
            <View style={styles.billingToggle}>
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
                  <Body2 style={styles.saveText}>-16%</Body2>
                </View>
              </TouchableOpacity>
            </View>

            {/* Plan Cards */}
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                id={plan.id}
                name={plan.name}
                description={plan.description}
                priceMonthly={plan.priceMonthly}
                priceYearly={plan.priceYearly}
                features={plan.features}
                monthlyScans={plan.monthlyScans}
                isCurrentPlan={plan.id === currentPlanId}
                isPopular={plan.id === 'user'}
                isYearly={isYearly}
                onSelect={handleSelectPlan}
                loading={upgrading === plan.id}
                disabled={upgrading !== null && upgrading !== plan.id}
              />
            ))}
          </View>
        )}

        {/* Billing Tab */}
        {selectedTab === 'billing' && (
          <View style={styles.billingSection}>
            <BillingHistoryList
              items={billingHistory}
              loading={loadingBilling}
              onRefresh={loadBillingHistory}
              emptyMessage={currentPlanId === 'free' ? 'No billing history - you\'re on the free plan' : 'No billing history yet'}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.LG,
    paddingBottom: SPACING.XXL,
  },
  header: {
    marginBottom: SPACING.LG,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  currentPlanCard: {
    marginBottom: SPACING.LG,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  currentPlanLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.XS / 2,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cancelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
  },
  cancelNoticeText: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  usageSection: {
    marginBottom: SPACING.MD,
  },
  renewalText: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: SPACING.MD,
  },
  manageBillingButton: {
    marginTop: SPACING.SM,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
    ...SHADOWS.SM,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  plansSection: {},
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.MD,
    padding: 4,
    marginBottom: SPACING.LG,
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
  billingSection: {
    flex: 1,
    minHeight: 300,
  },
});

export default SubscriptionScreen;
