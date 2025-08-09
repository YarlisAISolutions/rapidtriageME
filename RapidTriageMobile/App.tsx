/**
 * RapidTriage Mobile App
 * Main entry point for the React Native application
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { useTheme } from './src/ui/styles/themes';
import { initializeTestMode, preloadTestData } from './src/test-mode-init';
import { TestUtils } from './src/utils/test-config';

export default function App() {
  const theme = useTheme();

  // Initialize test mode if configured
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (TestUtils.isTestMode()) {
          await initializeTestMode();
          await preloadTestData();
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
      <StatusBar 
        style="auto" 
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
