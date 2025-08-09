/**
 * Reusable Card component
 * Provides consistent card styling for content containers
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';

export interface CardProps {
  children: React.ReactNode;
  padding?: keyof typeof SPACING;
  margin?: keyof typeof SPACING;
  shadow?: keyof typeof SHADOWS;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'MD',
  margin,
  shadow = 'SM',
  style,
}) => {
  const theme = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.BACKGROUND_PRIMARY,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: theme.BORDER_PRIMARY,
    padding: SPACING[padding],
    ...(margin && { margin: SPACING[margin] }),
    ...SHADOWS[shadow],
  };

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};