/**
 * Settings Home Screen
 * Main settings screen with account info, preferences, and navigation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H2, H3, Body1, Body2 } from '../../components/common/Typography';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAuthStore, useAppStore } from '@store/index';
import { useNavigation } from '@react-navigation/native';

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: 'navigation' | 'toggle' | 'action';
  icon: string;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const SettingsHomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { user, logout, isLoading } = useAuthStore();
  const { settings, updateSettings } = useAppStore();

  const [loggingOut, setLoggingOut] = useState(false);

  // Plan display info
  const planName = user?.subscription?.tierId 
    ? user.subscription.tierId.charAt(0).toUpperCase() + user.subscription.tierId.slice(1)
    : 'Free';
  const planStatus = user?.subscription?.status || 'active';

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              // Navigation will be handled by auth state change
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Show confirmation with email verification
            Alert.alert(
              'Confirm Deletion',
              `Type "${user?.email}" to confirm account deletion.`,
              [{ text: 'Cancel' }]
            );
          },
        },
      ]
    );
  }, [user?.email]);

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          label: 'Profile',
          description: user?.email,
          type: 'navigation',
          icon: '👤',
          onPress: () => navigation.navigate('Profile'),
        },
        {
          id: 'subscription',
          label: 'Subscription',
          description: `${planName} Plan • ${planStatus}`,
          type: 'navigation',
          icon: '⭐',
          onPress: () => navigation.navigate('Subscription'),
        },
        {
          id: 'api-keys',
          label: 'API Keys',
          description: 'Manage your API access',
          type: 'navigation',
          icon: '🔑',
          onPress: () => navigation.navigate('ApiKeys'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'theme',
          label: 'Dark Mode',
          description: settings.theme === 'dark' ? 'On' : settings.theme === 'light' ? 'Off' : 'System',
          type: 'toggle',
          icon: '🌙',
          value: settings.theme === 'dark',
          onToggle: (value) => updateSettings({ theme: value ? 'dark' : 'light' }),
        },
        {
          id: 'notifications',
          label: 'Push Notifications',
          type: 'toggle',
          icon: '🔔',
          value: settings.notifications.push,
          onToggle: (value) => updateSettings({
            notifications: { ...settings.notifications, push: value }
          }),
        },
        {
          id: 'email-notifications',
          label: 'Email Notifications',
          type: 'toggle',
          icon: '📧',
          value: settings.notifications.email,
          onToggle: (value) => updateSettings({
            notifications: { ...settings.notifications, email: value }
          }),
        },
        {
          id: 'report-complete',
          label: 'Report Completion Alerts',
          type: 'toggle',
          icon: '✅',
          value: settings.notifications.reportComplete,
          onToggle: (value) => updateSettings({
            notifications: { ...settings.notifications, reportComplete: value }
          }),
        },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          id: 'analytics',
          label: 'Usage Analytics',
          description: 'Help us improve the app',
          type: 'toggle',
          icon: '📊',
          value: settings.privacy.analytics,
          onToggle: (value) => updateSettings({
            privacy: { ...settings.privacy, analytics: value }
          }),
        },
        {
          id: 'crash-reporting',
          label: 'Crash Reporting',
          description: 'Send crash reports to help fix bugs',
          type: 'toggle',
          icon: '🐛',
          value: settings.privacy.crashReporting,
          onToggle: (value) => updateSettings({
            privacy: { ...settings.privacy, crashReporting: value }
          }),
        },
        {
          id: 'export-data',
          label: 'Export My Data',
          type: 'navigation',
          icon: '📦',
          onPress: () => {
            Alert.alert(
              'Export Data',
              'Your data export will be prepared and sent to your email.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Export', onPress: () => console.log('Exporting data...') },
              ]
            );
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help Center',
          type: 'navigation',
          icon: '❓',
          onPress: () => navigation.navigate('Help'),
        },
        {
          id: 'contact',
          label: 'Contact Support',
          type: 'navigation',
          icon: '💬',
          onPress: () => {
            // Open email or support chat
            Alert.alert('Contact Support', 'support@rapidtriage.me');
          },
        },
        {
          id: 'feedback',
          label: 'Send Feedback',
          type: 'navigation',
          icon: '💡',
          onPress: () => {
            Alert.alert('Feedback', 'We\'d love to hear from you!');
          },
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          id: 'delete-account',
          label: 'Delete Account',
          description: 'Permanently delete your account and data',
          type: 'action',
          icon: '⚠️',
          danger: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        !isLast && { borderBottomColor: theme.BORDER_PRIMARY, borderBottomWidth: 1 },
      ]}
      onPress={item.type === 'navigation' || item.type === 'action' ? item.onPress : undefined}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
          <Body1>{item.icon}</Body1>
        </View>
        <View style={styles.settingText}>
          <Body1
            style={[
              styles.settingLabel,
              { color: item.danger ? theme.ERROR : theme.TEXT },
            ]}
          >
            {item.label}
          </Body1>
          {item.description && (
            <Body2 style={[styles.settingDescription, { color: theme.TEXT_SECONDARY }]}>
              {item.description}
            </Body2>
          )}
        </View>
      </View>

      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: theme.GRAY_300, true: theme.PRIMARY }}
          thumbColor={item.value ? '#FFFFFF' : '#F4F3F4'}
        />
      )}

      {item.type === 'navigation' && (
        <Body1 style={[styles.chevron, { color: theme.TEXT_TERTIARY }]}>›</Body1>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <H2 style={[styles.title, { color: theme.TEXT }]}>Settings</H2>
        </View>

        {/* User Card */}
        <Card style={styles.userCard} padding="LG">
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.PRIMARY }]}>
              <H2 style={styles.avatarText}>
                {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </H2>
            </View>
            <View style={styles.userText}>
              <H3 style={[styles.userName, { color: theme.TEXT }]}>
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'User'}
              </H3>
              <Body2 style={[styles.userEmail, { color: theme.TEXT_SECONDARY }]}>
                {user?.email}
              </Body2>
            </View>
          </View>
          
          {/* Plan Status */}
          <View style={[styles.planRow, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
            <View style={styles.planInfo}>
              <Body2 style={[styles.planLabel, { color: theme.TEXT_SECONDARY }]}>
                Current Plan
              </Body2>
              <Body1 style={[styles.planName, { color: theme.TEXT }]}>
                {planName}
              </Body1>
            </View>
            <Button
              title="Manage"
              onPress={() => navigation.navigate('Subscription')}
              variant="outline"
              size="small"
            />
          </View>
        </Card>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Body2 style={[styles.sectionTitle, { color: theme.TEXT_SECONDARY }]}>
              {section.title}
            </Body2>
            <Card padding="NONE">
              {section.items.map((item, itemIndex) =>
                renderSettingItem(item, itemIndex === section.items.length - 1)
              )}
            </Card>
          </View>
        ))}

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title={loggingOut ? 'Signing Out...' : 'Sign Out'}
            onPress={handleLogout}
            variant="outline"
            size="large"
            fullWidth
            disabled={loggingOut}
          />
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Body2 style={[styles.versionText, { color: theme.TEXT_TERTIARY }]}>
            RapidTriage.me v1.0.0
          </Body2>
        </View>
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
  userCard: {
    marginBottom: SPACING.LG,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.XS / 2,
  },
  userEmail: {
    fontSize: 14,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  planInfo: {},
  planLabel: {
    fontSize: 12,
    marginBottom: SPACING.XS / 2,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.SM,
    marginLeft: SPACING.XS,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.MD,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  signOutContainer: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.LG,
  },
  versionContainer: {
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
  },
});

export default SettingsHomeScreen;
