import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../../constants/colors';

// Import growth feature screens
import ReferralDashboard from '../components/referral/ReferralDashboard';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';

/**
 * Growth navigator param list for type safety
 */
export type GrowthStackParamList = {
  ReferralDashboard: {
    userId: string;
  };
  OnboardingFlow: {
    userId: string;
    onComplete: (personalization: any) => void;
    onSkip?: () => void;
  };
  TrialDashboard: {
    userId: string;
  };
  EmailPreferences: {
    userId: string;
  };
  AchievementsList: {
    userId: string;
  };
};

const Stack = createStackNavigator<GrowthStackParamList>();

/**
 * Growth navigator for all growth-related features
 * 
 * This navigator handles:
 * - Referral program dashboard
 * - Onboarding flows
 * - Trial management screens
 * - Email preferences
 * - Achievement system
 */
export const GrowthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.WHITE,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.BORDER_PRIMARY,
        },
        headerTintColor: COLORS.TEXT_PRIMARY,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
        cardStyle: {
          backgroundColor: COLORS.BACKGROUND_PRIMARY,
        },
      }}
    >
      <Stack.Screen
        name="ReferralDashboard"
        component={ReferralDashboard}
        options={{
          title: 'Referral Program',
          headerTitleAlign: 'center',
        }}
      />
      
      <Stack.Screen
        name="OnboardingFlow"
        component={OnboardingFlow}
        options={{
          title: 'Getting Started',
          headerLeft: () => null, // Prevent going back during onboarding
          headerTitleAlign: 'center',
        }}
      />
      
      <Stack.Screen
        name="TrialDashboard"
        options={{
          title: 'Trial Dashboard',
          headerTitleAlign: 'center',
        }}
      >
        {({ route }) => (
          <React.Fragment>
            {/* Trial Dashboard component would be implemented here */}
          </React.Fragment>
        )}
      </Stack.Screen>
      
      <Stack.Screen
        name="EmailPreferences"
        options={{
          title: 'Email Preferences',
          headerTitleAlign: 'center',
        }}
      >
        {({ route }) => (
          <React.Fragment>
            {/* Email Preferences component would be implemented here */}
          </React.Fragment>
        )}
      </Stack.Screen>
      
      <Stack.Screen
        name="AchievementsList"
        options={{
          title: 'Achievements',
          headerTitleAlign: 'center',
        }}
      >
        {({ route }) => (
          <React.Fragment>
            {/* Achievements List component would be implemented here */}
          </React.Fragment>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default GrowthNavigator;