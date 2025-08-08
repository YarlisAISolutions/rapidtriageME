/**
 * RapidTriage Mobile App
 * Main entry point for the React Native application
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { useTheme } from './src/ui/styles/themes';

export default function App() {
  const theme = useTheme();

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
