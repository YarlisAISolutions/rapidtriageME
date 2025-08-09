/**
 * Main App Navigator
 * Handles the main application navigation with bottom tabs
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../styles/themes';
import { NAVIGATION_ROUTES } from '@constants/app';
import { SPACING } from '../styles/themes';

// Screen imports
import { HomeScreen } from '../screens/main/HomeScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { ScanScreen } from '../screens/main/ScanScreen';
import { ReportsScreen } from '../screens/main/ReportsScreen';
import { SettingsNavigator } from './SettingsNavigator';
import { GrowthNavigator } from './GrowthNavigator';

// Icons (in a real app, you'd use proper icon libraries)
const TabIcon: React.FC<{ name: string; focused: boolean; color: string }> = ({ 
  name, 
  focused, 
  color 
}) => {
  const icons: Record<string, string> = {
    Home: '🏠',
    Dashboard: '📊',
    Scan: '🔍',
    Reports: '📄',
    Settings: '⚙️',
  };
  
  return (
    <text style={{ fontSize: focused ? 20 : 18, color }}>
      {icons[name] || '📱'}
    </text>
  );
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export type MainTabParamList = {
  [NAVIGATION_ROUTES.HOME]: undefined;
  [NAVIGATION_ROUTES.DASHBOARD]: undefined;
  [NAVIGATION_ROUTES.SCAN]: undefined;
  [NAVIGATION_ROUTES.REPORTS]: undefined;
  [NAVIGATION_ROUTES.SETTINGS]: undefined;
};

const MainTabs: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName={NAVIGATION_ROUTES.HOME}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => (
          <TabIcon name={route.name} focused={focused} color={color} />
        ),
        tabBarActiveTintColor: theme.PRIMARY,
        tabBarInactiveTintColor: theme.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: theme.BACKGROUND_PRIMARY,
          borderTopColor: theme.BORDER_PRIMARY,
          paddingTop: SPACING.SM,
          paddingBottom: SPACING.SM,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: SPACING.XS / 2,
        },
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
      })}
    >
      <Tab.Screen 
        name={NAVIGATION_ROUTES.HOME}
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'RapidTriage',
        }}
      />
      <Tab.Screen 
        name={NAVIGATION_ROUTES.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name={NAVIGATION_ROUTES.SCAN}
        component={ScanScreen}
        options={{
          title: 'Scan',
          headerTitle: 'New Scan',
        }}
      />
      <Tab.Screen 
        name={NAVIGATION_ROUTES.REPORTS}
        component={ReportsScreen}
        options={{
          title: 'Reports',
          headerTitle: 'My Reports',
        }}
      />
      <Tab.Screen 
        name={NAVIGATION_ROUTES.SETTINGS}
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          headerShown: false, // Settings navigator handles its own header
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
      />
      <Stack.Screen 
        name="Growth" 
        component={GrowthNavigator} 
        options={{
          headerShown: true,
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
};