import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Clipboard,
  Share,
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../common/Typography';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { COLORS } from '../../../constants/colors';
import { referralService, ReferralStats, Referral, ShareConfig } from '../../../services/referral/referral.service';

/**
 * Props for the ReferralDashboard component
 */
export interface ReferralDashboardProps {
  /** Current user ID */
  userId: string;
  /** Callback when user wants to invite someone */
  onInvitePress?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Custom style */
  style?: any;
}

/**
 * Comprehensive referral dashboard component
 * 
 * Features:
 * - Real-time referral statistics
 * - Referral code display and sharing
 * - Multiple sharing channels (email, SMS, social)
 * - Referral history with status tracking
 * - Reward balance and redemption
 * - Performance analytics and insights
 * - Social proof and leaderboard
 */
export const ReferralDashboard: React.FC<ReferralDashboardProps> = ({
  userId,
  onInvitePress,
  isLoading: propLoading = false,
  style
}) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(propLoading);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'rewards'>('overview');

  /**
   * Load all referral data on component mount
   */
  useEffect(() => {
    loadReferralData();
  }, [userId]);

  /**
   * Load referral dashboard data
   */
  const loadReferralData = async () => {
    setIsLoading(true);
    try {
      const [userCode, userStats, userReferrals] = await Promise.all([
        referralService.getUserReferralCode(userId),
        referralService.getReferralStats(userId),
        referralService.getUserReferrals(userId)
      ]);

      // Generate code if user doesn't have one
      const code = userCode || await referralService.generateReferralCode(userId);
      
      setReferralCode(code);
      setStats(userStats);
      setReferrals(userReferrals);
    } catch (error) {
      console.error('Failed to load referral data:', error);
      Alert.alert('Error', 'Failed to load referral information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle refresh action
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReferralData();
    setIsRefreshing(false);
  };

  /**
   * Copy referral code to clipboard
   */
  const copyReferralCode = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
    
    // Track sharing activity
    referralService.trackReferralShare(userId, 'copy', referralCode);
  };

  /**
   * Share referral link via platform share dialog
   */
  const shareReferralLink = async (channel: ShareConfig['channel'] = 'copy') => {
    try {
      const shareContent = await referralService.generateShareContent(userId, channel);
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Share.share({
          title: shareContent.title,
          message: shareContent.message,
          url: shareContent.url,
        });
      } else {
        // Web fallback
        copyReferralCode();
      }

      // Track sharing activity
      await referralService.trackReferralShare(userId, channel, referralCode);
    } catch (error) {
      console.error('Failed to share referral link:', error);
      Alert.alert('Error', 'Failed to share referral link. Please try again.');
    }
  };

  /**
   * Send email invitation
   */
  const sendEmailInvitation = () => {
    Alert.prompt(
      'Send Invitation',
      'Enter the email address to send an invitation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (email) => {
            if (!email) return;
            
            try {
              const success = await referralService.sendReferralInvitation(userId, email);
              if (success) {
                Alert.alert('Sent!', 'Invitation sent successfully');
                loadReferralData(); // Refresh data
              } else {
                Alert.alert('Error', 'Failed to send invitation');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to send invitation. Please check the email address.');
            }
          }
        }
      ],
      'plain-text',
      '',
      'email-address'
    );
  };

  /**
   * Render overview tab with key metrics
   */
  const renderOverviewTab = () => {
    if (!stats) return null;

    return (
      <View style={styles.tabContent}>
        {/* Referral Code Section */}
        <Card style={styles.codeCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.codeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.codeTitle}>Your Referral Code</Text>
            <TouchableOpacity 
              style={styles.codeContainer}
              onPress={copyReferralCode}
            >
              <Text style={styles.codeText}>{referralCode}</Text>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>
            
            <View style={styles.shareButtons}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => shareReferralLink('copy')}
              >
                <Text style={styles.shareButtonText}>Share Link</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={sendEmailInvitation}
              >
                <Text style={styles.shareButtonText}>Send Email</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.successfulReferrals}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{Math.round(stats.conversionRate)}%</Text>
            <Text style={styles.statLabel}>Conversion Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.availableRewards}</Text>
            <Text style={styles.statLabel}>Rewards Earned</Text>
          </View>
        </View>

        {/* Rewards Section */}
        <Card style={styles.rewardsCard}>
          <View style={styles.rewardsHeader}>
            <Text style={styles.rewardsTitle}>Available Rewards</Text>
            <Text style={styles.rewardsValue}>
              {stats.availableRewards} Free Month{stats.availableRewards !== 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.rewardsDescription}>
            Each successful referral earns you 1 month of Pro subscription free!
          </Text>
          
          {stats.availableRewards > 0 && (
            <Button
              variant="primary"
              onPress={() => setActiveTab('rewards')}
              style={styles.redeemButton}
            >
              Redeem Rewards
            </Button>
          )}
        </Card>

        {/* How It Works */}
        <Card style={styles.howItWorksCard}>
          <Typography variant="h3" style={styles.howItWorksTitle}>
            How It Works
          </Typography>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Code</Text>
                <Text style={styles.stepDescription}>
                  Share your unique referral code with friends and colleagues
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>They Sign Up</Text>
                <Text style={styles.stepDescription}>
                  Your friend gets 30% off their first 3 months
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>You Both Win</Text>
                <Text style={styles.stepDescription}>
                  You get 1 month free when they subscribe
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  /**
   * Render referral history tab
   */
  const renderHistoryTab = () => {
    return (
      <View style={styles.tabContent}>
        <Typography variant="h3" style={styles.historyTitle}>
          Referral History
        </Typography>
        
        {referrals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No referrals yet</Text>
            <Text style={styles.emptyDescription}>
              Start sharing your referral code to see your referrals here
            </Text>
            <Button
              variant="primary"
              onPress={() => shareReferralLink()}
              style={styles.shareFirstButton}
            >
              Share Your Code
            </Button>
          </Card>
        ) : (
          <View style={styles.referralsList}>
            {referrals.map((referral, index) => (
              <Card key={referral.id} style={styles.referralItem}>
                <View style={styles.referralHeader}>
                  <Text style={styles.referralEmail}>
                    {referral.referredEmail || 'Unknown Email'}
                  </Text>
                  <View style={[styles.statusBadge, styles[`status${referral.status}`]]}>
                    <Text style={styles.statusText}>
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.referralMeta}>
                  <Text style={styles.referralDate}>
                    Referred on {new Date(referral.createdAt).toLocaleDateString()}
                  </Text>
                  {referral.convertedAt && (
                    <Text style={styles.conversionDate}>
                      Converted on {new Date(referral.convertedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>

                {referral.rewardEarned && (
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardText}>
                      🎉 Earned: {referral.rewardEarned.value} month{referral.rewardEarned.value !== 1 ? 's' : ''} free
                    </Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render rewards tab
   */
  const renderRewardsTab = () => {
    if (!stats) return null;

    return (
      <View style={styles.tabContent}>
        <Typography variant="h3" style={styles.rewardsTabTitle}>
          Your Rewards
        </Typography>

        <Card style={styles.rewardsBalance}>
          <Text style={styles.balanceAmount}>{stats.availableRewards}</Text>
          <Text style={styles.balanceLabel}>Free Months Available</Text>
          <Text style={styles.balanceValue}>
            Worth ${(stats.availableRewards * 29.99).toFixed(2)}
          </Text>
        </Card>

        <Card style={styles.rewardsBreakdown}>
          <Text style={styles.breakdownTitle}>Rewards Breakdown</Text>
          <View style={styles.breakdownList}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Total Earned</Text>
              <Text style={styles.breakdownValue}>{stats.totalRewardsEarned}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Used</Text>
              <Text style={styles.breakdownValue}>
                {stats.totalRewardsEarned - stats.availableRewards}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Available</Text>
              <Text style={[styles.breakdownValue, styles.availableValue]}>
                {stats.availableRewards}
              </Text>
            </View>
          </View>
        </Card>

        {stats.availableRewards > 0 && (
          <Card style={styles.redemptionCard}>
            <Text style={styles.redemptionTitle}>Ready to Redeem?</Text>
            <Text style={styles.redemptionDescription}>
              Your rewards will be automatically applied to your next billing cycle. 
              No action required!
            </Text>
            <Button
              variant="primary"
              onPress={() => Alert.alert('Auto-Applied', 'Your rewards will be automatically applied to your next billing cycle!')}
              style={styles.autoApplyButton}
            >
              Auto-Apply to Next Bill
            </Button>
          </Card>
        )}

        <Card style={styles.earnMoreCard}>
          <Text style={styles.earnMoreTitle}>Earn More Rewards</Text>
          <Text style={styles.earnMoreDescription}>
            Keep referring friends to earn more free months. There's no limit!
          </Text>
          <Button
            variant="secondary"
            onPress={() => shareReferralLink()}
            style={styles.earnMoreButton}
          >
            Share Your Code
          </Button>
        </Card>
      </View>
    );
  };

  if (isLoading && !stats) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>Loading your referral dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
            Rewards
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'rewards' && renderRewardsTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },

  // Code Card Styles
  codeCard: {
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
  },
  codeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  codeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: 16,
  },
  codeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    letterSpacing: 2,
  },
  copyHint: {
    fontSize: 12,
    color: COLORS.WHITE,
    opacity: 0.8,
    marginTop: 4,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },

  // Rewards Card
  rewardsCard: {
    marginBottom: 20,
  },
  rewardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  rewardsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  rewardsDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 16,
    lineHeight: 20,
  },
  redeemButton: {
    borderRadius: 8,
  },

  // How It Works
  howItWorksCard: {
    marginBottom: 20,
  },
  howItWorksTitle: {
    marginBottom: 16,
    color: COLORS.TEXT_PRIMARY,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },

  // History Tab
  historyTitle: {
    marginBottom: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  shareFirstButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  referralsList: {
    gap: 12,
  },
  referralItem: {},
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  referralEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statuspending: {
    backgroundColor: '#FEF3C7',
  },
  statussigned_up: {
    backgroundColor: '#DBEAFE',
  },
  statusconverted: {
    backgroundColor: '#D1FAE5',
  },
  statusexpired: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  referralMeta: {
    marginBottom: 8,
  },
  referralDate: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  conversionDate: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    marginTop: 2,
  },
  rewardInfo: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    padding: 12,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    fontWeight: '500',
  },

  // Rewards Tab
  rewardsTabTitle: {
    marginBottom: 20,
    color: COLORS.TEXT_PRIMARY,
  },
  rewardsBalance: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  rewardsBreakdown: {
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  breakdownList: {
    gap: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  availableValue: {
    color: COLORS.SUCCESS,
  },
  redemptionCard: {
    marginBottom: 20,
    backgroundColor: '#F0F7FF',
    borderColor: COLORS.PRIMARY,
  },
  redemptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  redemptionDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: 16,
  },
  autoApplyButton: {
    borderRadius: 8,
  },
  earnMoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  earnMoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  earnMoreDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  earnMoreButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
  },
});

export default ReferralDashboard;