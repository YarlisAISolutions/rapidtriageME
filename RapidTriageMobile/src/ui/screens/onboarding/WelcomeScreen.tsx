/**
 * Welcome Screen
 * First screen in the onboarding flow
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
import { Hero } from '../../components/landing/Hero';
import { useAppStore } from '@store/index';

export const WelcomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { setOnboardingComplete } = useAppStore();

  const handleGetStarted = () => {
    navigation.navigate('FeaturesIntro');
  };

  const handleSkip = () => {
    setOnboardingComplete(true);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };

  const handleLearnMore = () => {
    navigation.navigate('FeaturesIntro');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_PRIMARY }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Hero 
          onGetStarted={handleGetStarted}
          onLearnMore={handleLearnMore}
        />
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
});