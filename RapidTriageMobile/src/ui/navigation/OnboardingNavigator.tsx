/**
 * Onboarding Navigator
 * Handles the onboarding flow for new users
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NAVIGATION_ROUTES } from '@constants/app';

// Screen imports
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { FeaturesIntroScreen } from '../screens/onboarding/FeaturesIntroScreen';
import { GetStartedScreen } from '../screens/onboarding/GetStartedScreen';

const Stack = createStackNavigator();

export type OnboardingStackParamList = {
  Welcome: undefined;
  FeaturesIntro: undefined;
  GetStarted: undefined;
};

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen} 
      />
      <Stack.Screen 
        name="FeaturesIntro" 
        component={FeaturesIntroScreen} 
      />
      <Stack.Screen 
        name="GetStarted" 
        component={GetStartedScreen} 
      />
    </Stack.Navigator>
  );
};