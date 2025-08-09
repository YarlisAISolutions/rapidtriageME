/**
 * Splash Screen
 * Initial loading screen with app branding
 */

import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../styles/themes';
import { useAuthStore, useAppStore } from '@store/index';
import { SPACING } from '../styles/themes';
import { H1, Body1 } from '../components/common/Typography';
import { NAVIGATION_ROUTES } from '@constants/app';

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuthStore();
  const { isOnboardingComplete } = useAppStore();

  useEffect(() => {
    // Simulate initialization time
    const timer = setTimeout(() => {
      if (!isOnboardingComplete) {
        navigation.replace(NAVIGATION_ROUTES.ONBOARDING);
      } else if (!isAuthenticated) {
        navigation.replace(NAVIGATION_ROUTES.AUTH);
      } else {
        navigation.replace(NAVIGATION_ROUTES.MAIN);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, isAuthenticated, isOnboardingComplete]);

  return (
    <View style={[styles.container, { backgroundColor: theme.PRIMARY }]}>
      {/* App logo/branding */}
      <View style={styles.branding}>
        <View style={[styles.logoContainer, { backgroundColor: theme.WHITE }]}>
          <H1 style={[styles.logo, { color: theme.PRIMARY }]}>RT</H1>
        </View>
        <H1 style={[styles.appName, { color: theme.WHITE }]}>
          RapidTriage
        </H1>
        <Body1 style={[styles.tagline, { color: theme.WHITE }]}>
          Lightning-fast website diagnostics
        </Body1>
      </View>

      {/* Loading indicator */}
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.WHITE} />
        <Body1 style={[styles.loadingText, { color: theme.WHITE }]}>
          Loading...
        </Body1>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width,
    height,
  },
  branding: {
    alignItems: 'center',
    marginBottom: SPACING.XXXL,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.LG,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.SM,
  },
  tagline: {
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  loading: {
    alignItems: 'center',
    position: 'absolute',
    bottom: SPACING.XXXL,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: 14,
    opacity: 0.8,
  },
});