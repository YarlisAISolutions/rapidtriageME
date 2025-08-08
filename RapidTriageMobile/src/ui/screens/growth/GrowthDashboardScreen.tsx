import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../../components/common/Typography';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import TrialCountdown from '../../components/trial/TrialCountdown';
import { COLORS } from '../../../constants/colors';
import { useGrowthStore, useAuthStore } from '../../../store';
import { trialService } from '../../../services/trial/trial.service';
import { referralService } from '../../../services/referral/referral.service';
import { emailMarketingService } from '../../../services/email-marketing/email-marketing.service';
import { growthFeaturesService } from '../../../services/growth/growth-features.service';

/**
 * Props for the GrowthDashboardScreen component
 */
export interface GrowthDashboardScreenProps {
  navigation: any;
}

/**
 * Comprehensive growth dashboard screen
 * 
 * Features:
 * - Trial status and countdown
 * - Referral program overview
 * - Achievement progress
 * - Growth metrics and insights
 * - Quick actions for growth features
 * - Personalized recommendations
 */
export const GrowthDashboardScreen: React.FC<GrowthDashboardScreenProps> = ({
  navigation
}) => {
  const { user } = useAuthStore();
  const { 
    trialStatus, 
    referralStats, 
    onboardingProgress,
    featureFlags,
    setTrialStatus,
    setReferralStats
  } = useGrowthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  /**
   * Load dashboard data on mount
   */
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  /**
   * Load all growth-related data
   */
  const loadDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await Promise.all([
        loadTrialStatus(),
        loadReferralStats(),
        loadAchievements(),
        generateRecommendations()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load trial status
   */
  const loadTrialStatus = async () => {
    if (!user) return;

    try {
      const status = await trialService.getTrialStatus(user.id);
      if (status) {
        setTrialStatus({
          isActive: status.isTrialing,
          daysRemaining: status.daysRemaining,
          endDate: status.endDate.toISOString(),
          hasExtended: status.hasExtended,
          extensionOffered: status.extensionOffered
        });
      }
    } catch (error) {
      console.error('Failed to load trial status:', error);
    }
  };

  /**
   * Load referral statistics
   */
  const loadReferralStats = async () => {
    if (!user) return;

    try {
      const stats = await referralService.getReferralStats(user.id);
      setReferralStats({
        totalReferrals: stats.totalReferrals,
        successfulReferrals: stats.successfulReferrals,
        availableRewards: stats.availableRewards
      });
    } catch (error) {
      console.error('Failed to load referral stats:', error);
    }
  };

  /**
   * Load user achievements
   */
  const loadAchievements = async () => {
    if (!user) return;

    try {
      // This would typically fetch user achievements from the growth service
      // For now, we'll use dummy data
      setAchievements([
        {
          id: 'first_scan',
          name: 'Getting Started',
          description: 'Complete your first website scan',
          isUnlocked: true,
          icon: '🚀'
        },
        {
          id: 'power_user',
          name: 'Power User',
          description: 'Complete 100 scans',
          isUnlocked: false,
          progress: 23,
          target: 100,
          icon: '⚡'
        },
        {
          id: 'referral_master',
          name: 'Referral Master',
          description: 'Refer 5 friends',
          isUnlocked: false,
          progress: referralStats?.successfulReferrals || 0,
          target: 5,
          icon: '👥'
        }
      ]);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  /**
   * Generate personalized recommendations
   */
  const generateRecommendations = async () => {
    if (!user) return;

    const recs: string[] = [];

    // Check if user should start trial
    if (!trialStatus?.isActive && user.subscription?.tierId === 'free') {
      recs.push('Start your 14-day Pro trial to unlock all features');
    }

    // Check if user should create referral code
    if (!referralStats || referralStats.totalReferrals === 0) {
      recs.push('Share your referral code and earn free months');
    }

    // Check onboarding completion
    if (!onboardingProgress?.isComplete) {
      recs.push('Complete your onboarding to get personalized tips');
    }

    // Check email subscription
    try {
      const emailPrefs = await emailMarketingService.getEmailPreferences(user.id);
      if (!emailPrefs.isSubscribed) {
        recs.push('Subscribe to our newsletter for optimization tips');
      }
    } catch (error) {
      // Ignore email preference errors
    }

    setRecommendations(recs);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  /**
   * Handle trial activation
   */
  const handleStartTrial = async () => {
    if (!user) return;

    try {
      const status = await trialService.startTrial(user.id);
      setTrialStatus({
        isActive: status.isTrialing,
        daysRemaining: status.daysRemaining,
        endDate: status.endDate.toISOString(),
        hasExtended: status.hasExtended,
        extensionOffered: status.extensionOffered
      });

      Alert.alert(
        'Trial Started!',
        'Your 14-day Pro trial has begun. Enjoy unlimited access to all features!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start trial. Please try again.');
    }
  };

  /**
   * Handle trial extension
   */
  const handleExtendTrial = async () => {
    if (!user) return;

    try {
      const status = await trialService.extendTrial(user.id, 'user_request');
      if (status) {
        setTrialStatus({
          isActive: status.isTrialing,
          daysRemaining: status.daysRemaining,
          endDate: status.endDate.toISOString(),
          hasExtended: status.hasExtended,
          extensionOffered: status.extensionOffered
        });

        Alert.alert(
          'Trial Extended!',
          'Your trial has been extended by 7 days. Keep exploring Pro features!'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to extend trial at this time.');
    }
  };

  /**
   * Handle upgrade action
   */
  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };

  /**
   * Navigate to referral dashboard
   */
  const navigateToReferrals = () => {
    navigation.navigate('ReferralDashboard', { userId: user?.id });
  };

  /**
   * Render trial section
   */
  const renderTrialSection = () => {
    if (!trialStatus?.isActive) {
      return (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Start Your Pro Trial
            </Typography>
            <Text style={styles.sectionDescription}>
              Try all Pro features free for 14 days
            </Text>
          </View>
          
          <View style={styles.trialBenefits}>
            <Text style={styles.benefit}>✓ Unlimited scans</Text>
            <Text style={styles.benefit}>✓ Advanced analytics</Text>
            <Text style={styles.benefit}>✓ Team collaboration</Text>
            <Text style={styles.benefit}>✓ Priority support</Text>
          </View>

          <Button
            variant="primary"
            onPress={handleStartTrial}
            style={styles.actionButton}
          >
            Start Free Trial
          </Button>
        </Card>
      );
    }

    return (
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Pro Trial Active
          </Typography>
        </View>
        
        <TrialCountdown
          daysRemaining={trialStatus.daysRemaining}
          endDate={new Date(trialStatus.endDate!)}
          canExtend={!trialStatus.hasExtended}
          extensionsUsed={trialStatus.hasExtended ? 1 : 0}
          maxExtensions={1}
          onUpgrade={handleUpgrade}
          onExtend={handleExtendTrial}
          onTrialExpired={() => {
            Alert.alert('Trial Expired', 'Your Pro trial has ended. Upgrade to continue using Pro features.');
          }}
          variant="compact"
        />
      </Card>
    );
  };

  /**
   * Render referral section
   */
  const renderReferralSection = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Typography variant="h3" style={styles.sectionTitle}>
          Referral Program
        </Typography>
        <TouchableOpacity onPress={navigateToReferrals}>
          <Text style={styles.viewAllText}>View All ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.referralStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{referralStats?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>Total Referrals</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{referralStats?.successfulReferrals || 0}</Text>
          <Text style={styles.statLabel}>Successful</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{referralStats?.availableRewards || 0}</Text>
          <Text style={styles.statLabel}>Free Months</Text>
        </View>
      </View>

      <Button
        variant="secondary"
        onPress={navigateToReferrals}
        style={styles.actionButton}
      >
        Share & Earn
      </Button>
    </Card>
  );

  /**
   * Render achievements section
   */
  const renderAchievementsSection = () => (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Typography variant="h3" style={styles.sectionTitle}>
          Achievements
        </Typography>
        <TouchableOpacity onPress={() => navigation.navigate('AchievementsList', { userId: user?.id })}>
          <Text style={styles.viewAllText}>View All ›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsList}>
        {achievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementItem}>
            <View style={[
              styles.achievementIcon, 
              achievement.isUnlocked ? styles.achievementUnlocked : styles.achievementLocked
            ]}>
              <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            </View>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            {!achievement.isUnlocked && achievement.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(achievement.progress / achievement.target) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {achievement.progress}/{achievement.target}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </Card>
  );

  /**
   * Render recommendations section
   */
  const renderRecommendationsSection = () => {
    if (recommendations.length === 0) return null;

    return (
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Recommended for You
          </Typography>
        </View>

        {recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationIcon}>💡</Text>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Typography variant="h2" style={styles.headerTitle}>
            Growth Dashboard
          </Typography>
          <Text style={styles.headerSubtitle}>
            Track your progress and unlock new opportunities
          </Text>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {renderTrialSection()}
          {renderReferralSection()}
          {renderAchievementsSection()}
          {renderRecommendationsSection()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: -20,
  },
  sectionCard: {
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.TEXT_PRIMARY,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  trialBenefits: {
    marginBottom: 20,
  },
  benefit: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
  },
  referralStats: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
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
  achievementsList: {
    marginBottom: 16,
  },
  achievementItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementUnlocked: {
    backgroundColor: COLORS.SUCCESS + '20',
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  achievementLocked: {
    backgroundColor: COLORS.GRAY_200,
    borderWidth: 2,
    borderColor: COLORS.GRAY_300,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.GRAY_200,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 20,
  },
});

export default GrowthDashboardScreen;