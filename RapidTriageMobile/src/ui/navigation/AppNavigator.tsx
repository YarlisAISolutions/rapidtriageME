/**
 * Main App Navigator
 * Orchestrates the entire navigation flow of the application
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore, useAppStore } from '@store/index';
import { useTheme } from '../styles/themes';
import { NAVIGATION_ROUTES } from '@constants/app';

// Navigator imports
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Screen imports
import { SplashScreen } from '../screens/SplashScreen';

const Stack = createStackNavigator();

export type RootStackParamList = {
  [NAVIGATION_ROUTES.SPLASH]: undefined;
  [NAVIGATION_ROUTES.ONBOARDING]: undefined;
  [NAVIGATION_ROUTES.AUTH]: undefined;
  [NAVIGATION_ROUTES.MAIN]: undefined;
};

export const AppNavigator: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { isOnboardingComplete } = useAppStore();

  // Determine initial route based on app state
  const getInitialRoute = () => {
    if (!isOnboardingComplete) {
      return NAVIGATION_ROUTES.ONBOARDING;
    }
    if (!isAuthenticated) {
      return NAVIGATION_ROUTES.AUTH;
    }
    return NAVIGATION_ROUTES.MAIN;
  };

  const navigationTheme = {
    dark: false, // We'll handle theming manually
    colors: {
      primary: theme.PRIMARY,
      background: theme.BACKGROUND_PRIMARY,
      card: theme.BACKGROUND_PRIMARY,
      text: theme.TEXT,
      border: theme.BORDER_PRIMARY,
      notification: theme.ERROR,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {/* Splash Screen */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
        />

        {/* Onboarding Flow */}
        <Stack.Screen 
          name={NAVIGATION_ROUTES.ONBOARDING} 
          component={OnboardingNavigator} 
        />

        {/* Authentication Flow */}
        <Stack.Screen 
          name={NAVIGATION_ROUTES.AUTH} 
          component={AuthNavigator} 
        />

        {/* Main App Flow */}
        <Stack.Screen 
          name={NAVIGATION_ROUTES.MAIN} 
          component={MainNavigator} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};