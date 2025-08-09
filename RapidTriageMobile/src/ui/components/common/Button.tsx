/**
 * Reusable Button component
 * Provides consistent button styling and behavior across the app
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { createTypographyStyles } from '../../styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BORDER_RADIUS.MD,
      ...(size === 'small' && {
        paddingVertical: SPACING.SM,
        paddingHorizontal: SPACING.MD,
      }),
      ...(size === 'medium' && {
        paddingVertical: SPACING.MD,
        paddingHorizontal: SPACING.LG,
      }),
      ...(size === 'large' && {
        paddingVertical: SPACING.LG,
        paddingHorizontal: SPACING.XL,
      }),
      ...(fullWidth && { width: '100%' }),
    };

    // Apply variant-specific styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.GRAY_300 : theme.PRIMARY,
          ...(!disabled && SHADOWS.SM),
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? theme.GRAY_100 : theme.SECONDARY,
          ...(!disabled && SHADOWS.SM),
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? theme.GRAY_300 : theme.PRIMARY,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...typography.button,
      ...(size === 'small' && { fontSize: 14 }),
      ...(size === 'large' && { fontSize: 18 }),
    };

    // Apply variant-specific text styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: disabled ? theme.GRAY_500 : theme.WHITE,
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? theme.GRAY_500 : theme.WHITE,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? theme.GRAY_400 : theme.PRIMARY,
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? theme.GRAY_400 : theme.PRIMARY,
        };
      default:
        return baseStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.PRIMARY : theme.WHITE}
          style={{ marginRight: SPACING.SM }}
        />
      ) : null}
      <Text style={[getTextStyle(), textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Add any additional styles here if needed
});