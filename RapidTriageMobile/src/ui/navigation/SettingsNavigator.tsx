/**
 * Settings Navigator
 * Handles navigation within the settings section
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../styles/themes';
import { NAVIGATION_ROUTES } from '@constants/app';

// Screen imports
import { SettingsHomeScreen } from '../screens/settings/SettingsHomeScreen';
import { ProfileScreen } from '../screens/settings/ProfileScreen';
import { SubscriptionScreen } from '../screens/settings/SubscriptionScreen';
import { NotificationsScreen } from '../screens/settings/NotificationsScreen';
import { HelpScreen } from '../screens/settings/HelpScreen';

const Stack = createStackNavigator();

export type SettingsStackParamList = {
  SettingsHome: undefined;
  [NAVIGATION_ROUTES.PROFILE]: undefined;
  [NAVIGATION_ROUTES.SUBSCRIPTION]: undefined;
  [NAVIGATION_ROUTES.NOTIFICATIONS]: undefined;
  [NAVIGATION_ROUTES.HELP]: undefined;
};

export const SettingsNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="SettingsHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.BACKGROUND_PRIMARY,
          borderBottomColor: theme.BORDER_PRIMARY,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.TEXT,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: theme.TEXT,
        headerBackTitleVisible: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name={NAVIGATION_ROUTES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen 
        name={NAVIGATION_ROUTES.SUBSCRIPTION}
        component={SubscriptionScreen}
        options={{
          title: 'Subscription',
        }}
      />
      <Stack.Screen 
        name={NAVIGATION_ROUTES.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      <Stack.Screen 
        name={NAVIGATION_ROUTES.HELP}
        component={HelpScreen}
        options={{
          title: 'Help & Support',
        }}
      />
    </Stack.Navigator>
  );
};