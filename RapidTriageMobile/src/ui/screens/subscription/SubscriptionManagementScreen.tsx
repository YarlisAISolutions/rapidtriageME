import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../components/common/Typography';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { 
  SubscriptionTier, 
  UserSubscription, 
  PaymentMethod,
  paymentService 
} from '../../../services/payment/payment.service';
import { UsageStats, usageService } from '../../../services/usage/usage.service';
import { authService } from '../../../services/auth/auth.service';
import PaywallModal from '../../components/monetization/PaywallModal';

const { width } = Dimensions.get('window');

/**
 * Navigation props for the subscription management screen
 */
interface SubscriptionManagementScreenProps {
  navigation: any;
  route: any;
}

/**
 * Usage statistics card component
 * Displays current usage against plan limits
 */
interface UsageStatsCardProps {
  stats: UsageStats;
  onUpgrade: () => void;
}

const UsageStatsCard: React.FC<UsageStatsCardProps> = ({ stats, onUpgrade }) => {
  /**
   * Format usage percentage for display
   */
  const formatUsagePercentage = (used: number, limit: number | null): string => {
    if (limit === null) return 'Unlimited';
    if (limit === 0) return '0%';
    return `${Math.round((used / limit) * 100)}%`;
  };

  /**
   * Get usage bar color based on percentage
   */
  const getUsageColor = (percentage: number): string => {
    if (percentage >= 95) return '#FF6B6B';
    if (percentage >= 80) return '#FFA726';
    return '#4CAF50';
  };

  /**
   * Render usage bar component
   */
  const UsageBar: React.FC<{ used: number; limit: number | null; label: string }> = ({
    used,
    limit,
    label
  }) => {
    const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
    const isUnlimited = limit === null;

    return (
      <View style={styles.usageBar}>
        <View style={styles.usageBarHeader}>
          <Typography variant="body2" style={styles.usageLabel}>
            {label}
          </Typography>
          <Typography variant="body2" style={styles.usageValue}>
            {isUnlimited ? `${used} used` : `${used} / ${limit}`}
          </Typography>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            {!isUnlimited && (
              <View 
                style={[
                  styles.progressBarFill,
                  { 
                    width: `${percentage}%`,
                    backgroundColor: getUsageColor(percentage)
                  }
                ]} 
              />
            )}
          </View>
          
          <Typography variant="caption" style={styles.progressText}>
            {isUnlimited ? 'Unlimited' : formatUsagePercentage(used, limit)}
          </Typography>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.usageCard}>
      <View style={styles.cardHeader}>
        <Typography variant="h3" style={styles.cardTitle}>
          Usage This Month
        </Typography>
        <Typography variant="body2" style={styles.periodText}>
          {stats.currentPeriod.startDate.toLocaleDateString()} - {stats.currentPeriod.endDate.toLocaleDateString()}
        </Typography>
      </View>

      <View style={styles.usageGrid}>
        <UsageBar 
          used={stats.usage.triageSessions}
          limit={stats.limits.monthlySessionLimit}
          label="Triage Sessions"
        />
        
        <UsageBar 
          used={stats.usage.activeUsers}
          limit={stats.limits.maxUsers > 0 ? stats.limits.maxUsers : null}
          label="Active Users"
        />
        
        <UsageBar 
          used={stats.usage.reportsGenerated}
          limit={stats.limits.maxReportsPerMonth}
          label="Reports Generated"
        />
        
        <UsageBar 
          used={stats.usage.dataExports}
          limit={stats.limits.maxExportsPerMonth}
          label="Data Exports"
        />
      </View>

      {/* Upgrade button for users near limits */}
      {stats.subscriptionTier === SubscriptionTier.FREE && (
        <View style={styles.upgradeSection}>
          <Typography variant="body2" style={styles.upgradePromptText}>
            Need more? Upgrade to Pro for unlimited access
          </Typography>
          <Button
            variant="primary"
            onPress={onUpgrade}
            style={styles.upgradeButton}
          >
            Upgrade Now
          </Button>
        </View>
      )}
    </Card>
  );
};

/**
 * Current subscription plan card component
 * Shows active plan details and management options
 */
interface CurrentPlanCardProps {
  subscription: UserSubscription | null;
  onChangePlan: () => void;
  onCancelSubscription: () => void;
  onReactivateSubscription?: () => void;
}

const CurrentPlanCard: React.FC<CurrentPlanCardProps> = ({
  subscription,
  onChangePlan,
  onCancelSubscription,
  onReactivateSubscription
}) => {
  const formatPrice = (price: number): string => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(2)}/month`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'cancelled':
        return '#FF9800';
      case 'past_due':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'cancelled':
        return 'Cancelled';
      case 'past_due':
        return 'Past Due';
      case 'trialing':
        return 'Trial';
      default:
        return 'Unknown';
    }
  };

  // Handle free tier (no subscription)
  if (!subscription) {
    return (
      <Card style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Typography variant="h3" style={styles.planName}>
              Free Plan
            </Typography>
            <Typography variant="h2" style={styles.planPrice}>
              $0/month
            </Typography>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
            <Typography variant="caption" style={styles.statusText}>
              ACTIVE
            </Typography>
          </View>
        </View>

        <View style={styles.planFeatures}>
          <Typography variant="body2" style={styles.featureText}>
            • 100 triage sessions per month
          </Typography>
          <Typography variant="body2" style={styles.featureText}>
            • Basic support
          </Typography>
          <Typography variant="body2" style={styles.featureText}>
            • Community access
          </Typography>
        </View>

        <Button
          variant="primary"
          onPress={onChangePlan}
          style={styles.actionButton}
        >
          Upgrade Plan
        </Button>
      </Card>
    );
  }

  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planInfo}>
          <Typography variant="h3" style={styles.planName}>
            {subscription.plan.name}
          </Typography>
          <Typography variant="h2" style={styles.planPrice}>
            {formatPrice(subscription.plan.price)}
          </Typography>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
          <Typography variant="caption" style={styles.statusText}>
            {getStatusText(subscription.status).toUpperCase()}
          </Typography>
        </View>
      </View>

      {/* Billing period information */}
      <View style={styles.billingInfo}>
        <Typography variant="body2" style={styles.billingLabel}>
          Current Period
        </Typography>
        <Typography variant="body1" style={styles.billingText}>
          {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
        </Typography>
        
        {subscription.cancelAtPeriodEnd && (
          <Typography variant="body2" style={styles.cancelNotice}>
            ⚠️ Subscription will end on {subscription.currentPeriodEnd.toLocaleDateString()}
          </Typography>
        )}
      </View>

      {/* Plan features */}
      <View style={styles.planFeatures}>
        {subscription.plan.features.map((feature, index) => (
          <Typography key={index} variant="body2" style={styles.featureText}>
            • {feature}
          </Typography>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.planActions}>
        <Button
          variant="outline"
          onPress={onChangePlan}
          style={[styles.actionButton, styles.secondaryActionButton]}
        >
          Change Plan
        </Button>
        
        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <Button
            variant="outline"
            onPress={onCancelSubscription}
            style={[styles.actionButton, styles.cancelButton]}
          >
            Cancel
          </Button>
        )}
        
        {subscription.cancelAtPeriodEnd && onReactivateSubscription && (
          <Button
            variant="primary"
            onPress={onReactivateSubscription}
            style={styles.actionButton}
          >
            Reactivate
          </Button>
        )}
      </View>
    </Card>
  );
};

/**
 * Payment methods card component
 * Shows saved payment methods and management options
 */
interface PaymentMethodsCardProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: () => void;
  onRemovePaymentMethod: (methodId: string) => void;
  onSetDefaultPaymentMethod: (methodId: string) => void;
}

const PaymentMethodsCard: React.FC<PaymentMethodsCardProps> = ({
  paymentMethods,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefaultPaymentMethod
}) => {
  const formatCardNumber = (last4: string, brand: string): string => {
    return `•••• •••• •••• ${last4} (${brand.toUpperCase()})`;
  };

  const formatExpiryDate = (month: number, year: number): string => {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  };

  return (
    <Card style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <Typography variant="h3" style={styles.cardTitle}>
          Payment Methods
        </Typography>
        <TouchableOpacity onPress={onAddPaymentMethod}>
          <Typography variant="body2" style={styles.addPaymentLink}>
            + Add Card
          </Typography>
        </TouchableOpacity>
      </View>

      {paymentMethods.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="body1" style={styles.emptyStateText}>
            No payment methods saved
          </Typography>
          <Typography variant="body2" style={styles.emptyStateSubtext}>
            Add a payment method to manage your subscription
          </Typography>
        </View>
      ) : (
        <View style={styles.paymentMethodsList}>
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentMethodItem}>
              <View style={styles.paymentMethodInfo}>
                <Typography variant="body1" style={styles.cardNumber}>
                  {method.last4 && method.brand ? 
                    formatCardNumber(method.last4, method.brand) : 
                    `${method.type} Payment Method`
                  }
                </Typography>
                
                {method.expiryMonth && method.expiryYear && (
                  <Typography variant="body2" style={styles.expiryDate}>
                    Expires {formatExpiryDate(method.expiryMonth, method.expiryYear)}
                  </Typography>
                )}
                
                {method.isDefault && (
                  <Typography variant="caption" style={styles.defaultBadge}>
                    DEFAULT
                  </Typography>
                )}
              </View>

              <View style={styles.paymentMethodActions}>
                {!method.isDefault && (
                  <TouchableOpacity
                    onPress={() => onSetDefaultPaymentMethod(method.id)}
                    style={styles.paymentMethodAction}
                  >
                    <Typography variant="caption" style={styles.actionText}>
                      Set Default
                    </Typography>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  onPress={() => onRemovePaymentMethod(method.id)}
                  style={styles.paymentMethodAction}
                >
                  <Typography variant="caption" style={[styles.actionText, styles.removeText]}>
                    Remove
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

/**
 * Main subscription management screen component
 * Comprehensive subscription and billing management interface
 * 
 * Features:
 * - Current plan overview and management
 * - Usage statistics with visual progress bars
 * - Payment method management
 * - Plan change and cancellation flows
 * - Billing history access
 * - Upgrade prompts and paywalls
 */
export const SubscriptionManagementScreen: React.FC<SubscriptionManagementScreenProps> = ({
  navigation,
  route
}) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  /**
   * Load all subscription-related data
   */
  const loadSubscriptionData = async (showLoader = true) => {
    if (!currentUser?.uid) return;

    try {
      if (showLoader) setLoading(true);
      
      // Load subscription, usage stats, and payment methods in parallel
      const [subscriptionData, statsData, paymentMethodsData] = await Promise.all([
        paymentService.getUserSubscription(currentUser.uid).catch(() => null),
        usageService.getUserUsageStats(currentUser.uid).catch(() => null),
        paymentService.getPaymentMethods(currentUser.uid).catch(() => [])
      ]);

      setSubscription(subscriptionData);
      setUsageStats(statsData);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      Alert.alert(
        'Loading Error',
        'Failed to load subscription information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Refresh data when screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      const updateUser = authService.getCurrentUser();
      if (updateUser) {
        setCurrentUser(updateUser);
        loadSubscriptionData();
      }
    }, [])
  );

  /**
   * Initial data load
   */
  useEffect(() => {
    if (currentUser) {
      loadSubscriptionData();
    }
  }, [currentUser]);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = () => {
    setRefreshing(true);
    loadSubscriptionData(false);
  };

  /**
   * Handle plan change request
   */
  const handleChangePlan = () => {
    setShowPaywallModal(true);
  };

  /**
   * Handle subscription cancellation with confirmation
   */
  const handleCancelSubscription = () => {
    if (!subscription) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You\'ll lose access to premium features at the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.cancelSubscription(
                subscription.id,
                false, // Don't cancel immediately
                'user_requested'
              );
              
              Alert.alert(
                'Subscription Cancelled',
                'Your subscription has been cancelled. You\'ll continue to have access until the end of your current billing period.',
                [{ text: 'OK' }]
              );
              
              await loadSubscriptionData();
            } catch (error) {
              console.error('Cancellation error:', error);
              Alert.alert(
                'Cancellation Failed',
                'Unable to cancel subscription. Please contact support for assistance.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  /**
   * Handle subscription reactivation
   */
  const handleReactivateSubscription = async () => {
    if (!subscription) return;

    try {
      // Implementation would depend on your backend API
      // This would typically update the subscription to not cancel at period end
      Alert.alert(
        'Subscription Reactivated',
        'Your subscription has been reactivated and will continue automatically.',
        [{ text: 'OK' }]
      );
      
      await loadSubscriptionData();
    } catch (error) {
      console.error('Reactivation error:', error);
      Alert.alert(
        'Reactivation Failed',
        'Unable to reactivate subscription. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle successful plan upgrade
   */
  const handleUpgradeComplete = async (planId: string) => {
    try {
      setShowPaywallModal(false);
      
      // Refresh subscription data
      await loadSubscriptionData();
      
      Alert.alert(
        'Upgrade Successful',
        'Your plan has been upgraded successfully. New features are now available!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Upgrade completion error:', error);
    }
  };

  /**
   * Navigate to billing history
   */
  const handleViewBillingHistory = () => {
    navigation.navigate('BillingHistory');
  };

  /**
   * Handle add payment method
   */
  const handleAddPaymentMethod = () => {
    navigation.navigate('AddPaymentMethod', {
      onSuccess: () => {
        loadSubscriptionData(false);
      }
    });
  };

  /**
   * Handle remove payment method
   */
  const handleRemovePaymentMethod = async (methodId: string) => {
    if (!currentUser?.uid) return;

    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.removePaymentMethod(methodId, currentUser.uid);
              await loadSubscriptionData(false);
            } catch (error) {
              console.error('Remove payment method error:', error);
              Alert.alert('Error', 'Failed to remove payment method');
            }
          }
        }
      ]
    );
  };

  /**
   * Handle set default payment method
   */
  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    // Implementation would depend on your backend API
    console.log('Set default payment method:', methodId);
    await loadSubscriptionData(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Typography variant="body1">Loading subscription details...</Typography>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.errorContainer}>
        <Typography variant="h3" style={styles.errorTitle}>
          Authentication Required
        </Typography>
        <Typography variant="body1" style={styles.errorMessage}>
          Please sign in to view your subscription details.
        </Typography>
        <Button
          variant="primary"
          onPress={() => navigation.navigate('Auth')}
          style={styles.errorButton}
        >
          Sign In
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <Typography variant="h1" style={styles.headerTitle}>
          Subscription
        </Typography>
        <Typography variant="body1" style={styles.headerSubtitle}>
          Manage your plan and billing
        </Typography>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Plan Section */}
        <CurrentPlanCard
          subscription={subscription}
          onChangePlan={handleChangePlan}
          onCancelSubscription={handleCancelSubscription}
          onReactivateSubscription={handleReactivateSubscription}
        />

        {/* Usage Statistics Section */}
        {usageStats && (
          <UsageStatsCard
            stats={usageStats}
            onUpgrade={handleChangePlan}
          />
        )}

        {/* Payment Methods Section */}
        <PaymentMethodsCard
          paymentMethods={paymentMethods}
          onAddPaymentMethod={handleAddPaymentMethod}
          onRemovePaymentMethod={handleRemovePaymentMethod}
          onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
        />

        {/* Quick Actions Section */}
        <Card style={styles.actionsCard}>
          <Typography variant="h3" style={styles.cardTitle}>
            Quick Actions
          </Typography>
          
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={handleViewBillingHistory}
            >
              <Typography variant="body1" style={styles.actionText}>
                View Billing History
              </Typography>
              <Typography variant="body2" style={styles.actionArrow}>
                →
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('ContactSupport')}
            >
              <Typography variant="body1" style={styles.actionText}>
                Contact Support
              </Typography>
              <Typography variant="body2" style={styles.actionArrow}>
                →
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Paywall Modal for plan changes */}
      <PaywallModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        onUpgrade={handleUpgradeComplete}
        currentTier={subscription?.plan.tier || SubscriptionTier.FREE}
        title="Change Your Plan"
        subtitle="Choose the plan that best fits your needs"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  errorButton: {
    minWidth: 120,
  },
  planCard: {
    marginBottom: 16,
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#2D3748',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C5CE7',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  billingInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  billingLabel: {
    color: '#666',
    marginBottom: 4,
  },
  billingText: {
    fontSize: 16,
    color: '#2D3748',
  },
  cancelNotice: {
    color: '#FF9800',
    marginTop: 8,
    fontStyle: 'italic',
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureText: {
    color: '#4A5568',
    marginBottom: 4,
    lineHeight: 20,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
  },
  secondaryActionButton: {
    borderColor: '#6C5CE7',
  },
  cancelButton: {
    borderColor: '#FF6B6B',
  },
  usageCard: {
    marginBottom: 16,
    padding: 20,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  periodText: {
    color: '#666',
    fontSize: 14,
  },
  usageGrid: {
    gap: 16,
  },
  usageBar: {
    marginBottom: 4,
  },
  usageBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageLabel: {
    color: '#4A5568',
    fontWeight: '500',
  },
  usageValue: {
    color: '#2D3748',
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    minWidth: 60,
    textAlign: 'right',
    color: '#666',
    fontSize: 12,
  },
  upgradeSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradePromptText: {
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    paddingHorizontal: 24,
  },
  paymentCard: {
    marginBottom: 16,
    padding: 20,
  },
  addPaymentLink: {
    color: '#6C5CE7',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#666',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    color: '#999',
    textAlign: 'center',
  },
  paymentMethodsList: {
    gap: 16,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  paymentMethodInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  expiryDate: {
    color: '#666',
    fontSize: 14,
  },
  defaultBadge: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  paymentMethodActions: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentMethodAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#6C5CE7',
    fontSize: 12,
    fontWeight: '500',
  },
  removeText: {
    color: '#FF6B6B',
  },
  actionsCard: {
    marginBottom: 16,
    padding: 20,
  },
  actionsList: {
    marginTop: 16,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionArrow: {
    color: '#999',
    fontSize: 18,
  },
  bottomPadding: {
    height: 32,
  },
});

export default SubscriptionManagementScreen;