/**
 * Authentication Navigator
 * Handles the authentication flow
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NAVIGATION_ROUTES } from '@constants/app';

// Screen imports
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

const Stack = createStackNavigator();

export type AuthStackParamList = {
  [NAVIGATION_ROUTES.LOGIN]: undefined;
  [NAVIGATION_ROUTES.REGISTER]: undefined;
  [NAVIGATION_ROUTES.FORGOT_PASSWORD]: undefined;
};

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={NAVIGATION_ROUTES.LOGIN}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name={NAVIGATION_ROUTES.LOGIN} 
        component={LoginScreen} 
      />
      <Stack.Screen 
        name={NAVIGATION_ROUTES.REGISTER} 
        component={RegisterScreen} 
      />
      <Stack.Screen 
        name={NAVIGATION_ROUTES.FORGOT_PASSWORD} 
        component={ForgotPasswordScreen} 
      />
    </Stack.Navigator>
  );
};