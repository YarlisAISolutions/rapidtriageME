/**
 * Get Started Screen
 * Final onboarding screen with signup options
 */

import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../styles/themes';
import { SPACING } from '../../styles/themes';
import { InteractiveDemo } from '../../components/landing/InteractiveDemo';
import { Button } from '../../components/common/Button';
import { useAppStore } from '@store/index';

export const GetStartedScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { setOnboardingComplete } = useAppStore();

  const handleDemoComplete = (results: any) => {
    // Demo completed, show results and encourage signup
    console.log('Demo results:', results);
  };

  const handleSignUp = () => {
    setOnboardingComplete(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'Register' } }],
    });
  };

  const handleSkipToLogin = () => {
    setOnboardingComplete(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'Login' } }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <InteractiveDemo onDemoComplete={handleDemoComplete} />
        
        <View style={styles.actionContainer}>
          <Button
            title="Sign Up Free"
            onPress={handleSignUp}
            variant="primary"
            size="large"
            fullWidth
            style={styles.primaryButton}
          />
          <Button
            title="I already have an account"
            onPress={handleSkipToLogin}
            variant="ghost"
            size="medium"
            fullWidth
          />
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
    flexGrow: 1,
  },
  actionContainer: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.LG,
  },
  primaryButton: {
    marginBottom: SPACING.MD,
  },
});