/**
 * Home Screen
 * Main landing screen for authenticated users
 */

import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING } from '../../styles/themes';
import { H2, H3, Body1 } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuthStore, useTriageStore } from '@store/index';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { reports } = useTriageStore();

  const recentReports = reports.slice(0, 3);

  const handleQuickScan = () => {
    navigation.navigate('Scan');
  };

  const handleViewReports = () => {
    navigation.navigate('Reports');
  };

  const handleViewDashboard = () => {
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              title="Start New Scan"
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

        {/* Usage Stats */}
        <Card style={styles.statsCard} padding="LG">
          <H3 style={[styles.sectionTitle, { color: theme.TEXT }]}>
            This Month
          </H3>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <H2 style={[styles.statNumber, { color: theme.PRIMARY }]}>
                {user?.subscription.usage.scansUsed || 0}
              </H2>
              <Body1 style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
                Scans Used
              </Body1>
            </View>
            <View style={styles.statItem}>
              <H2 style={[styles.statNumber, { color: theme.SUCCESS }]}>
                {reports.filter(r => r.status === 'completed').length}
              </H2>
              <Body1 style={[styles.statLabel, { color: theme.TEXT_SECONDARY }]}>
                Completed
              </Body1>
            </View>
          </View>
          {user?.subscription.usage.scansLimit > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: theme.PRIMARY,
                      width: `${Math.min((user.subscription.usage.scansUsed / user.subscription.usage.scansLimit) * 100, 100)}%`
                    }
                  ]} 
                />
              </View>
              <Body1 style={[styles.progressText, { color: theme.TEXT_SECONDARY }]}>
                {user.subscription.usage.scansLimit - user.subscription.usage.scansUsed} scans remaining
              </Body1>
            </View>
          )}
        </Card>

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <Card style={styles.recentReports} padding="LG">
            <View style={styles.sectionHeader}>
              <H3 style={[styles.sectionTitle, { color: theme.TEXT }]}>
                Recent Reports
              </H3>
              <Button
                title="View All"
                onPress={handleViewReports}
                variant="ghost"
                size="small"
              />
            </View>
            <View style={styles.reportsList}>
              {recentReports.map((report) => (
                <View key={report.id} style={[styles.reportItem, { borderBottomColor: theme.BORDER_PRIMARY }]}>
                  <View style={styles.reportInfo}>
                    <Body1 style={[styles.reportUrl, { color: theme.TEXT }]} numberOfLines={1}>
                      {report.url}
                    </Body1>
                    <Body1 style={[styles.reportDate, { color: theme.TEXT_SECONDARY }]}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </Body1>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: report.status === 'completed' ? theme.SUCCESS : 
                                     report.status === 'pending' ? theme.WARNING : theme.ERROR 
                    }
                  ]}>
                    <Body1 style={[styles.statusText, { color: theme.WHITE }]}>
                      {report.status}
                    </Body1>
                  </View>
                </View>
              ))}
            </View>
          </Card>
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
  actionButtons: {
    gap: SPACING.MD,
  },
  actionButton: {
    marginBottom: SPACING.SM,
  },
  statsCard: {
    marginBottom: SPACING.LG,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: SPACING.MD,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.SM,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
  },
  recentReports: {
    marginBottom: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
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
    fontSize: 16,
    marginBottom: SPACING.XS / 2,
  },
  reportDate: {
    fontSize: 12,
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
  },
});