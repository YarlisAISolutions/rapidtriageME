/**
 * Features Introduction Screen
 * Shows key features during onboarding
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
import { Features } from '../../components/landing/Features';
import { Button } from '../../components/common/Button';

export const FeaturesIntroScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();

  const handleContinue = () => {
    navigation.navigate('GetStarted');
  };

  const handleFeaturePress = (featureId: string) => {
    // Could show detailed feature information
    console.log('Feature pressed:', featureId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Features onFeaturePress={handleFeaturePress} />
        
        <View style={styles.actionContainer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
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
});