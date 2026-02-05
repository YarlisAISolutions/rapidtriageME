/**
 * Home Screen
 * Main landing screen for authenticated users with dashboard stats
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
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H2, H3, Body1, Body2 } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UsageMeter } from '../../components/monetization/UsageMeter';
import { UpgradeModal } from '../../components/monetization/UpgradeModal';
import { useAuthStore, useTriageStore } from '@store/index';
import { useNavigation } from '@react-navigation/native';

// Plan limits
const PLAN_LIMITS = {
  free: 10,
  user: 100,
  team: 500,
  enterprise: null, // unlimited
};

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { reports } = useTriageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'limit_reached' | 'voluntary'>('voluntary');

  const recentReports = reports.slice(0, 5);

  // Get plan info
  const currentPlan = user?.subscription?.tierId || 'free';
  const scansUsed = user?.subscription?.usage?.scansUsed || 0;
  const scansLimit = PLAN_LIMITS[currentPlan as keyof typeof PLAN_LIMITS] ?? 10;
  const scansRemaining = scansLimit === null ? null : Math.max(scansLimit - scansUsed, 0);
  const usagePercentage = scansLimit === null ? 0 : (scansUsed / scansLimit) * 100;

  // Check if user is near limit
  const isNearLimit = scansLimit !== null && usagePercentage >= 80;
  const isAtLimit = scansLimit !== null && scansUsed >= scansLimit;

  const handleQuickScan = useCallback(() => {
    if (isAtLimit) {
      setUpgradeReason('limit_reached');
      setShowUpgradeModal(true);
      return;
    }
    navigation.navigate('Scan');
  }, [isAtLimit, navigation]);

  const handleViewReports = () => {
    navigation.navigate('Reports');
  };

  const handleViewDashboard = () => {
    navigation.navigate('Dashboard');
  };

  const handleUpgrade = async (priceId: string) => {
    // This would call the Firebase function to create Stripe checkout
    try {
      // Mock for now - integrate with real Stripe checkout
      Alert.alert(
        'Upgrading...',
        'Opening Stripe checkout...',
        [{ text: 'OK' }]
      );
      // const { httpsCallable } = await import('firebase/functions');
      // const functions = getApp().functions();
      // const createCheckout = httpsCallable(functions, 'createCheckoutSession');
      // const result = await createCheckout({ priceId, successUrl: '...', cancelUrl: '...' });
      // Linking.openURL(result.data.url);
    } catch (error) {
      console.error('Failed to create checkout:', error);
      throw error;
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Fetch latest stats from API
    try {
      // const stats = await dashboardService.getStats();
      // Update stores with fresh data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated
    } finally {
      setRefreshing(false);
    }
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return theme.SUCCESS;
    if (score >= 50) return theme.WARNING;
    return theme.ERROR;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <H2 style={[styles.welcome, { color: theme.TEXT }]}>
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </H2>
          <Body1 style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
            Ready to analyze some websites?
          </Body1>
        </View>

        {/* Quick Actions */}
        <Card style={styles.quickActions} padding="LG">
          <H3 style={[styles.sectionTitle, { color: theme.TEXT }]}>
            Quick Actions
          </H3>
          <View style={styles.actionButtons}>
            <Button
              title={isAtLimit ? 'Upgrade to Scan' : 'Start New Scan'}
              onPress={handleQuickScan}
              variant="primary"
              size="large"
              fullWidth
              style={styles.actionButton}
            />
            <Button
              title="View Dashboard"
              onPress={handleViewDashboard}
              variant="secondary"
              size="medium"
              fullWidth
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* Usage Stats Card */}
        <Card style={styles.statsCard} padding="LG">
          <View style={styles.statsHeader}>
            <H3 style={[styles.sectionTitle, { color: theme.TEXT }]}>
              This Month's Usage
            </H3>
            <TouchableOpacity onPress={() => navigation.navigate('Subscription')}>
              <Body2 style={[styles.planBadge, { color: theme.PRIMARY }]}>
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
              </Body2>
            </TouchableOpacity>
          </View>

          <UsageMeter
            used={scansUsed}
            limit={scansLimit}
            label="Scans"
            size="large"
            showRemaining
            showPercentage
          />

          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <View style={[styles.quickStat, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
              <H3 style={[styles.quickStatNumber, { color: theme.SUCCESS }]}>
                {reports.filter(r => r.status === 'completed').length}
              </H3>
              <Body2 style={[styles.quickStatLabel, { color: theme.TEXT_SECONDARY }]}>
                Completed
              </Body2>
            </View>
            <View style={[styles.quickStat, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
              <H3 style={[styles.quickStatNumber, { color: theme.WARNING }]}>
                {reports.filter(r => r.status === 'pending').length}
              </H3>
              <Body2 style={[styles.quickStatLabel, { color: theme.TEXT_SECONDARY }]}>
                In Progress
              </Body2>
            </View>
            <View style={[styles.quickStat, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
              <H3 style={[styles.quickStatNumber, { color: theme.ERROR }]}>
                {reports.filter(r => r.status === 'failed').length}
              </H3>
              <Body2 style={[styles.quickStatLabel, { color: theme.TEXT_SECONDARY }]}>
                Failed
              </Body2>
            </View>
          </View>
        </Card>

        {/* Upgrade Prompt if near limit */}
        {isNearLimit && !isAtLimit && (
          <Card
            style={[styles.upgradePrompt, { borderColor: theme.WARNING }]}
            padding="MD"
          >
            <View style={styles.upgradePromptContent}>
              <View style={styles.upgradePromptText}>
                <Body1 style={[styles.upgradePromptTitle, { color: theme.TEXT }]}>
                  ⚠️ Running Low on Scans
                </Body1>
                <Body2 style={[styles.upgradePromptSubtitle, { color: theme.TEXT_SECONDARY }]}>
                  You've used {usagePercentage.toFixed(0)}% of your monthly scans
                </Body2>
              </View>
              <Button
                title="Upgrade"
                onPress={() => {
                  setUpgradeReason('voluntary');
                  setShowUpgradeModal(true);
                }}
                variant="primary"
                size="small"
              />
            </View>
          </Card>
        )}

        {/* At Limit Alert */}
        {isAtLimit && (
          <Card
            style={[styles.limitAlert, { backgroundColor: theme.ERROR + '15', borderColor: theme.ERROR }]}
            padding="MD"
          >
            <View style={styles.limitAlertContent}>
              <Body1 style={[styles.limitAlertTitle, { color: theme.ERROR }]}>
                🚫 Monthly Limit Reached
              </Body1>
              <Body2 style={[styles.limitAlertSubtitle, { color: theme.TEXT_SECONDARY }]}>
                Upgrade your plan to continue scanning
              </Body2>
              <Button
                title="Upgrade Now"
                onPress={() => {
                  setUpgradeReason('limit_reached');
                  setShowUpgradeModal(true);
                }}
                variant="primary"
                size="medium"
                fullWidth
                style={styles.limitAlertButton}
              />
            </View>
          </Card>
        )}

        {/* Recent Reports */}
        <Card style={styles.recentReports} padding="LG">
          <View style={styles.sectionHeader}>
            <H3 style={[styles.sectionTitle, { color: theme.TEXT }]}>
              Recent Audits
            </H3>
            {recentReports.length > 0 && (
              <Button
                title="View All"
                onPress={handleViewReports}
                variant="ghost"
                size="small"
              />
            )}
          </View>
          
          {recentReports.length > 0 ? (
            <View style={styles.reportsList}>
              {recentReports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={[styles.reportItem, { borderBottomColor: theme.BORDER_PRIMARY }]}
                  onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
                >
                  <View style={styles.reportInfo}>
                    <Body1 style={[styles.reportUrl, { color: theme.TEXT }]} numberOfLines={1}>
                      {report.url}
                    </Body1>
                    <Body2 style={[styles.reportDate, { color: theme.TEXT_SECONDARY }]}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </Body2>
                  </View>
                  
                  {/* Score Badge */}
                  {report.status === 'completed' && report.results && (
                    <View
                      style={[
                        styles.scoreBadge,
                        { backgroundColor: getScoreColor(report.results.performance.score) + '20' },
                      ]}
                    >
                      <Body2
                        style={[
                          styles.scoreText,
                          { color: getScoreColor(report.results.performance.score) },
                        ]}
                      >
                        {report.results.performance.score}
                      </Body2>
                    </View>
                  )}
                  
                  {/* Status Badge */}
                  {report.status !== 'completed' && (
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            report.status === 'pending' ? theme.WARNING : theme.ERROR,
                        },
                      ]}
                    >
                      <Body2 style={styles.statusText}>
                        {report.status}
                      </Body2>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyReports}>
              <Body1 style={[styles.emptyIcon, { color: theme.TEXT_TERTIARY }]}>📊</Body1>
              <Body1 style={[styles.emptyText, { color: theme.TEXT_SECONDARY }]}>
                No audits yet. Start your first scan!
              </Body1>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        currentPlan={currentPlan}
        currentUsage={scansLimit ? { used: scansUsed, limit: scansLimit } : undefined}
        reason={upgradeReason}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.LG,
  },
  welcomeSection: {
    marginBottom: SPACING.XL,
  },
  welcome: {
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
  },
  quickActions: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    marginBottom: SPACING.MD,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  actionButtons: {
    gap: SPACING.MD,
  },
  actionButton: {
    marginBottom: SPACING.SM,
  },
  statsCard: {
    marginBottom: SPACING.LG,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  planBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.LG,
    gap: SPACING.SM,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.XS / 2,
  },
  quickStatLabel: {
    fontSize: 12,
  },
  upgradePrompt: {
    marginBottom: SPACING.LG,
    borderWidth: 1,
  },
  upgradePromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradePromptText: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  upgradePromptTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: SPACING.XS / 2,
  },
  upgradePromptSubtitle: {
    fontSize: 13,
  },
  limitAlert: {
    marginBottom: SPACING.LG,
    borderWidth: 1,
  },
  limitAlertContent: {
    alignItems: 'center',
  },
  limitAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  limitAlertSubtitle: {
    fontSize: 14,
    marginBottom: SPACING.MD,
  },
  limitAlertButton: {
    marginTop: SPACING.SM,
  },
  recentReports: {
    marginBottom: SPACING.LG,
  },
  reportsList: {
    // Reports list styles
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
  },
  reportInfo: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  reportUrl: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: SPACING.XS / 2,
  },
  reportDate: {
    fontSize: 12,
  },
  scoreBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#FFFFFF',
  },
  emptyReports: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.MD,
  },
  emptyText: {
    textAlign: 'center',
  },
});
