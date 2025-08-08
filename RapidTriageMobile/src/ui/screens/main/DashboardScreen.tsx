import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../styles/themes';
import { H2 } from '../../components/common/Typography';

export const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.BACKGROUND_PRIMARY }]}>
      <View style={styles.content}>
        <H2 style={{ color: theme.TEXT, textAlign: 'center' }}>
          DashboardScreen
        </H2>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
